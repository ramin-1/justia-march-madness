import { prisma } from "@/lib/prisma";
import { getAvailableTeamsForGame } from "@/lib/brackets/registry";
import type { PicksByGameId } from "@/lib/brackets/types";
import { recalculateEntryStandings } from "@/lib/standings";
import { fetchNcaaScoresHtml, parseCompletedGamesWithDebug } from "./ncaa";
import {
  findCanonicalGameMatch,
  normalizeTeamName,
  type LocalGameForMatching,
} from "./matching";

type LocalGameRow = {
  id: string;
  round: string;
  region: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeam: string | null;
  winnerTeamKey: string | null;
  status: string;
  syncSource: string | null;
  lastSyncedAt: Date | null;
};

type CandidateUpdateData = {
  status: "final";
  homeTeam: string;
  awayTeam: string;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeScore: number;
  awayScore: number;
  winnerTeam: string;
  winnerTeamKey: string;
  syncSource: "ncaa";
  lastSyncedAt: Date;
};

function getRoundSortOrder(roundLabel: string | undefined): number {
  if (!roundLabel) {
    return 999;
  }

  const normalized = roundLabel.toLowerCase();

  if (normalized.includes("first four") || normalized.includes("play in")) {
    return 0;
  }

  if (normalized.includes("first round") || normalized.includes("round of 64")) {
    return 1;
  }

  if (normalized.includes("second round") || normalized.includes("round of 32")) {
    return 2;
  }

  if (normalized.includes("sweet 16") || normalized.includes("sweet sixteen")) {
    return 3;
  }

  if (normalized.includes("elite 8") || normalized.includes("elite eight")) {
    return 4;
  }

  if (normalized.includes("final four") || normalized.includes("semifinal")) {
    return 5;
  }

  if (normalized.includes("championship") || normalized.includes("title game")) {
    return 6;
  }

  return 999;
}

function parseSeedFromTeamKey(teamKey: string | null): number | null {
  if (!teamKey) {
    return null;
  }

  const match = teamKey.match(/_(\d{1,2})(?:[A-Z])?$/);
  return match ? Number(match[1]) : null;
}

function buildCompletedPicksByGameId(gamesById: Map<string, LocalGameRow>): PicksByGameId {
  const picksByGameId: PicksByGameId = {};

  for (const game of gamesById.values()) {
    if (!game.winnerTeamKey) {
      continue;
    }

    picksByGameId[game.id] = {
      winnerTeamKey: game.winnerTeamKey,
    };
  }

  return picksByGameId;
}

function deriveParticipantTeamKeys({
  gameId,
  currentGame,
  gamesById,
}: {
  gameId: string;
  currentGame: LocalGameRow;
  gamesById: Map<string, LocalGameRow>;
}): [string | null, string | null] {
  const picksByGameId = buildCompletedPicksByGameId(gamesById);
  const availableTeams = getAvailableTeamsForGame({
    bracketType: "MAIN",
    gameId,
    picksByGameId,
  });

  const homeTeamKey = availableTeams[0]?.key ?? currentGame.homeTeamKey ?? null;
  const awayTeamKey = availableTeams[1]?.key ?? currentGame.awayTeamKey ?? null;

  return [homeTeamKey, awayTeamKey];
}

function mapTeamsToSlots({
  homeTeamKey,
  awayTeamKey,
  homeTeamName,
  awayTeamName,
  homeSeed,
  awaySeed,
  currentGame,
}: {
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeSeed: number | null;
  awaySeed: number | null;
  currentGame: LocalGameRow;
}) {
  const normalizedHomeName = normalizeTeamName(homeTeamName);
  const normalizedAwayName = normalizeTeamName(awayTeamName);
  const normalizedCurrentHomeName = currentGame.homeTeam ? normalizeTeamName(currentGame.homeTeam) : null;
  const normalizedCurrentAwayName = currentGame.awayTeam ? normalizeTeamName(currentGame.awayTeam) : null;

  if (
    normalizedCurrentHomeName &&
    normalizedCurrentAwayName &&
    normalizedCurrentHomeName === normalizedAwayName &&
    normalizedCurrentAwayName === normalizedHomeName
  ) {
    return {
      homeTeam: awayTeamName,
      awayTeam: homeTeamName,
      homeTeamKey,
      awayTeamKey,
      swapped: true,
    };
  }

  if (homeTeamKey && awayTeamKey && homeSeed !== null && awaySeed !== null) {
    const homeKeySeed = parseSeedFromTeamKey(homeTeamKey);
    const awayKeySeed = parseSeedFromTeamKey(awayTeamKey);

    if (homeKeySeed !== null && awayKeySeed !== null && homeKeySeed !== awayKeySeed) {
      if (homeSeed === homeKeySeed && awaySeed === awayKeySeed) {
        return {
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeTeamKey,
          awayTeamKey,
          swapped: false,
        };
      }

      if (homeSeed === awayKeySeed && awaySeed === homeKeySeed) {
        return {
          homeTeam: awayTeamName,
          awayTeam: homeTeamName,
          homeTeamKey,
          awayTeamKey,
          swapped: true,
        };
      }
    }
  }

  if (homeTeamKey && awayTeamKey && homeSeed !== null && awaySeed !== null && homeSeed === awaySeed) {
    const orderedTeams = [
      { teamName: homeTeamName, normalized: normalizedHomeName },
      { teamName: awayTeamName, normalized: normalizedAwayName },
    ].sort((teamA, teamB) => teamA.normalized.localeCompare(teamB.normalized));

    return {
      homeTeam: orderedTeams[0].teamName,
      awayTeam: orderedTeams[1].teamName,
      homeTeamKey,
      awayTeamKey,
      swapped: normalizeTeamName(orderedTeams[0].teamName) !== normalizedHomeName,
    };
  }

  return {
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    homeTeamKey,
    awayTeamKey,
    swapped: false,
  };
}

function buildCandidateUpdateData({
  currentGame,
  homeTeamKey,
  awayTeamKey,
  homeTeamName,
  awayTeamName,
  homeSeed,
  awaySeed,
  homeScore,
  awayScore,
  winnerTeamName,
}: {
  currentGame: LocalGameRow;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeSeed: number | null;
  awaySeed: number | null;
  homeScore: number;
  awayScore: number;
  winnerTeamName: string;
}): CandidateUpdateData | null {
  const mappedSlots = mapTeamsToSlots({
    homeTeamKey,
    awayTeamKey,
    homeTeamName,
    awayTeamName,
    homeSeed,
    awaySeed,
    currentGame,
  });

  const mappedHomeScore = mappedSlots.swapped ? awayScore : homeScore;
  const mappedAwayScore = mappedSlots.swapped ? homeScore : awayScore;
  const normalizedWinner = normalizeTeamName(winnerTeamName);
  const normalizedHome = normalizeTeamName(mappedSlots.homeTeam);
  const normalizedAway = normalizeTeamName(mappedSlots.awayTeam);

  const winnerTeamKey =
    normalizedWinner === normalizedHome
      ? mappedSlots.homeTeamKey
      : normalizedWinner === normalizedAway
        ? mappedSlots.awayTeamKey
        : null;

  const winnerTeam =
    normalizedWinner === normalizedHome
      ? mappedSlots.homeTeam
      : normalizedWinner === normalizedAway
        ? mappedSlots.awayTeam
        : null;

  if (!winnerTeamKey || !winnerTeam) {
    return null;
  }

  return {
    status: "final",
    homeTeam: mappedSlots.homeTeam,
    awayTeam: mappedSlots.awayTeam,
    homeTeamKey: mappedSlots.homeTeamKey,
    awayTeamKey: mappedSlots.awayTeamKey,
    homeScore: mappedHomeScore,
    awayScore: mappedAwayScore,
    winnerTeam,
    winnerTeamKey,
    syncSource: "ncaa",
    lastSyncedAt: new Date(),
  };
}

function hasNoEffectiveChange(currentGame: LocalGameRow, nextData: CandidateUpdateData): boolean {
  return (
    currentGame.status === nextData.status &&
    currentGame.homeTeam === nextData.homeTeam &&
    currentGame.awayTeam === nextData.awayTeam &&
    currentGame.homeTeamKey === nextData.homeTeamKey &&
    currentGame.awayTeamKey === nextData.awayTeamKey &&
    currentGame.homeScore === nextData.homeScore &&
    currentGame.awayScore === nextData.awayScore &&
    currentGame.winnerTeam === nextData.winnerTeam &&
    currentGame.winnerTeamKey === nextData.winnerTeamKey &&
    currentGame.syncSource === nextData.syncSource
  );
}

export async function syncNcaaResults() {
  const startedAt = new Date();

  const syncRun = await prisma.syncRun.create({
    data: {
      source: "ncaa",
      status: "started",
      startedAt,
      summaryJson: {},
    },
  });

  try {
    const { html, sourceUrl, sourceMode } = await fetchNcaaScoresHtml();
    const parsedGamesResult = parseCompletedGamesWithDebug(html);
    const scrapedGames = parsedGamesResult.games;
    const parsedGamesWithRegion = scrapedGames.filter((game) => Boolean(game.regionLabel)).length;
    const parsedGamesMissingRegion = scrapedGames.length - parsedGamesWithRegion;
    const parsedRegionSamples = scrapedGames.slice(0, 8).map((game) => ({
      matchup: `${game.homeTeam} vs ${game.awayTeam}`,
      regionLabel: game.regionLabel ?? null,
    }));
    const orderedScrapedGames = [...scrapedGames].sort((gameA, gameB) => {
      const roundOrderDifference =
        getRoundSortOrder(gameA.roundLabel) - getRoundSortOrder(gameB.roundLabel);

      if (roundOrderDifference !== 0) {
        return roundOrderDifference;
      }

      const playedAtA = gameA.playedAt ?? "";
      const playedAtB = gameB.playedAt ?? "";
      return playedAtA.localeCompare(playedAtB);
    });
    const localGames = await prisma.game.findMany({
      select: {
        id: true,
        round: true,
        region: true,
        homeTeam: true,
        awayTeam: true,
        homeTeamKey: true,
        awayTeamKey: true,
        homeScore: true,
        awayScore: true,
        winnerTeam: true,
        winnerTeamKey: true,
        status: true,
        syncSource: true,
        lastSyncedAt: true,
      },
    });

    const gamesById = new Map<string, LocalGameRow>(
      (localGames as LocalGameRow[]).map((game) => [game.id, game]),
    );

    let matchedGames = 0;
    let updatedGames = 0;
    let unchangedGames = 0;
    let unmatchedGames = 0;
    let ambiguousGames = 0;
    let skippedGames = 0;
    const unmatchedDetails: string[] = [];
    const ambiguousDetails: string[] = [];

    for (const scrapedGame of orderedScrapedGames) {
      const localGamesForMatching: LocalGameForMatching[] = [...gamesById.values()].map((game) => ({
        id: game.id,
        round: game.round,
        region: game.region,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
      }));
      const canonicalMatch = findCanonicalGameMatch({
        scrapedGame,
        localGames: localGamesForMatching,
      });

      if (canonicalMatch.kind === "unmatched") {
        unmatchedGames += 1;
        unmatchedDetails.push(
          `${scrapedGame.homeTeam} vs ${scrapedGame.awayTeam}: ${canonicalMatch.reason}`,
        );
        continue;
      }

      if (canonicalMatch.kind === "ambiguous") {
        ambiguousGames += 1;
        ambiguousDetails.push(
          `${scrapedGame.homeTeam} vs ${scrapedGame.awayTeam}: ${canonicalMatch.reason} [${canonicalMatch.candidateGameIds.join(", ")}]`,
        );
        continue;
      }

      const currentGame = gamesById.get(canonicalMatch.gameId);
      if (!currentGame) {
        unmatchedGames += 1;
        unmatchedDetails.push(
          `${scrapedGame.homeTeam} vs ${scrapedGame.awayTeam}: matched canonical id ${canonicalMatch.gameId}, but row is missing in database.`,
        );
        continue;
      }

      if (scrapedGame.homeScore === null || scrapedGame.awayScore === null) {
        skippedGames += 1;
        unmatchedDetails.push(
          `${scrapedGame.homeTeam} vs ${scrapedGame.awayTeam}: missing final scores in parsed payload.`,
        );
        continue;
      }

      matchedGames += 1;

      const [homeTeamKey, awayTeamKey] = deriveParticipantTeamKeys({
        gameId: canonicalMatch.gameId,
        currentGame,
        gamesById,
      });

      const updateData = buildCandidateUpdateData({
        currentGame,
        homeTeamKey,
        awayTeamKey,
        homeTeamName: scrapedGame.homeTeam,
        awayTeamName: scrapedGame.awayTeam,
        homeSeed: scrapedGame.homeSeed,
        awaySeed: scrapedGame.awaySeed,
        homeScore: scrapedGame.homeScore,
        awayScore: scrapedGame.awayScore,
        winnerTeamName: scrapedGame.winnerTeam,
      });

      if (!updateData) {
        skippedGames += 1;
        unmatchedDetails.push(
          `${scrapedGame.homeTeam} vs ${scrapedGame.awayTeam}: unable to resolve winner team key safely.`,
        );
        continue;
      }

      if (hasNoEffectiveChange(currentGame, updateData)) {
        unchangedGames += 1;
        continue;
      }

      await prisma.game.update({
        where: { id: currentGame.id },
        data: updateData,
      });

      gamesById.set(currentGame.id, {
        ...currentGame,
        ...updateData,
      });

      updatedGames += 1;
    }

    if (updatedGames > 0) {
      await recalculateEntryStandings();
    }

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        summaryJson: {
          sourceUrl,
          sourceMode,
          parsedGames: scrapedGames.length,
          parserPath: parsedGamesResult.debug.parserPath,
          jsonBlocksFound: parsedGamesResult.debug.jsonBlocksFound,
          jsonCandidates: parsedGamesResult.debug.jsonCandidates,
          htmlFallbackCandidates: parsedGamesResult.debug.htmlFallbackCandidates,
          htmlFallbackParsedCandidates: parsedGamesResult.debug.htmlFallbackParsedCandidates,
          normalizedParsedGames: parsedGamesResult.debug.normalizedParsedGames,
          parsedGamesWithRegion,
          parsedGamesMissingRegion,
          parsedRegionSamples,
          matchedGames,
          updatedGames,
          unchangedGames,
          unmatchedGames,
          ambiguousGames,
          skippedGames,
          unmatchedDetails: unmatchedDetails.slice(0, 25),
          ambiguousDetails: ambiguousDetails.slice(0, 25),
        },
      },
    });

    return {
      sourceUrl,
      sourceMode,
      parsedGames: scrapedGames.length,
      parserPath: parsedGamesResult.debug.parserPath,
      jsonBlocksFound: parsedGamesResult.debug.jsonBlocksFound,
      jsonCandidates: parsedGamesResult.debug.jsonCandidates,
      htmlFallbackCandidates: parsedGamesResult.debug.htmlFallbackCandidates,
      htmlFallbackParsedCandidates: parsedGamesResult.debug.htmlFallbackParsedCandidates,
      normalizedParsedGames: parsedGamesResult.debug.normalizedParsedGames,
      parsedGamesWithRegion,
      parsedGamesMissingRegion,
      parsedRegionSamples,
      matchedGames,
      updatedGames,
      unchangedGames,
      unmatchedGames,
      ambiguousGames,
      skippedGames,
    };
  } catch (error) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        summaryJson: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    throw error;
  }
}
