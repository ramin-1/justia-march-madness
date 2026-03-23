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

const ADMIN_NCAA_BACKFILL_START_DATE = "2026-03-17";
const NCAA_DEFAULT_TIMEZONE = "America/New_York";

export type SyncNcaaResultsOptions = {
  targetDate?: string;
};

export type SyncNcaaResult = {
  requestedDate: string | null;
  sourceUrl: string;
  sourceMode: "override-url" | "override-base-url" | "date-builder";
  parsedGames: number;
  parserPath: "json" | "html-fallback" | "none";
  jsonBlocksFound: number;
  jsonCandidates: number;
  htmlFallbackCandidates: number;
  htmlFallbackParsedCandidates: number;
  normalizedParsedGames: number;
  parsedGamesWithRegion: number;
  parsedGamesMissingRegion: number;
  parsedRegionSamples: Array<{ matchup: string; regionLabel: string | null }>;
  matchedGames: number;
  updatedGames: number;
  unchangedGames: number;
  unmatchedGames: number;
  ambiguousGames: number;
  skippedGames: number;
};

export type SyncNcaaBackfillResult = {
  startDate: string;
  targetDate: string;
  datesProcessed: number;
  dateResults: Array<{
    date: string;
    parsedGames: number;
    matchedGames: number;
    updatedGames: number;
    unchangedGames: number;
    unmatchedGames: number;
    ambiguousGames: number;
    skippedGames: number;
  }>;
  parsedGames: number;
  matchedGames: number;
  updatedGames: number;
  unchangedGames: number;
  unmatchedGames: number;
  ambiguousGames: number;
  skippedGames: number;
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

function buildTeamNameByKey(gamesById: Map<string, LocalGameRow>): Map<string, string> {
  const teamNameByKey = new Map<string, string>();

  for (const game of gamesById.values()) {
    if (game.homeTeamKey && game.homeTeam) {
      teamNameByKey.set(game.homeTeamKey, game.homeTeam);
    }

    if (game.awayTeamKey && game.awayTeam) {
      teamNameByKey.set(game.awayTeamKey, game.awayTeam);
    }

    if (game.winnerTeamKey && game.winnerTeam) {
      teamNameByKey.set(game.winnerTeamKey, game.winnerTeam);
    }
  }

  return teamNameByKey;
}

function buildLocalGamesForMatching(gamesById: Map<string, LocalGameRow>): LocalGameForMatching[] {
  const picksByGameId = buildCompletedPicksByGameId(gamesById);
  const teamNameByKey = buildTeamNameByKey(gamesById);

  return [...gamesById.values()].map((game) => {
    const availableTeams = getAvailableTeamsForGame({
      bracketType: "MAIN",
      gameId: game.id,
      picksByGameId,
    });

    const derivedHomeTeam = availableTeams[0]?.key
      ? teamNameByKey.get(availableTeams[0].key) ?? null
      : null;
    const derivedAwayTeam = availableTeams[1]?.key
      ? teamNameByKey.get(availableTeams[1].key) ?? null
      : null;

    return {
      id: game.id,
      round: game.round,
      region: game.region,
      homeTeam: game.homeTeam ?? derivedHomeTeam,
      awayTeam: game.awayTeam ?? derivedAwayTeam,
    };
  });
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

function parseIsoDate(value: string, label: string): Date {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  const [yearPart, monthPart, dayPart] = trimmed.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${label} must be a valid calendar date.`);
  }

  return parsed;
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentIsoDateInNcaaTimezone(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.NCAA_SCORES_TIMEZONE ?? NCAA_DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine NCAA sync target date.");
  }

  return `${year}-${month}-${day}`;
}

function buildInclusiveDateRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate, "Backfill start date");
  const end = parseIsoDate(endDate, "Backfill target date");

  if (start.getTime() > end.getTime()) {
    throw new Error(`Backfill start date ${startDate} cannot be after target date ${endDate}.`);
  }

  const dates: string[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); ) {
    dates.push(formatIsoDate(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1));
  }

  return dates;
}

function getEffectiveBackfillTargetDate(explicitTargetDate?: string): string {
  if (explicitTargetDate) {
    return formatIsoDate(parseIsoDate(explicitTargetDate, "Backfill target date"));
  }

  const configuredDate = process.env.NCAA_SCORES_DATE?.trim();
  if (configuredDate) {
    return formatIsoDate(parseIsoDate(configuredDate, "NCAA_SCORES_DATE"));
  }

  return getCurrentIsoDateInNcaaTimezone();
}

export async function syncNcaaResults(options: SyncNcaaResultsOptions = {}): Promise<SyncNcaaResult> {
  const requestedDate = options.targetDate?.trim() || null;
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
    const { html, sourceUrl, sourceMode } = await fetchNcaaScoresHtml({
      targetDate: requestedDate ?? undefined,
    });
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
      const localGamesForMatching = buildLocalGamesForMatching(gamesById);
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
          requestedDate,
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
      requestedDate,
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

export async function syncNcaaResultsBackfill(options?: {
  startDate?: string;
  targetDate?: string;
}): Promise<SyncNcaaBackfillResult> {
  const startDate = options?.startDate ?? ADMIN_NCAA_BACKFILL_START_DATE;
  const targetDate = getEffectiveBackfillTargetDate(options?.targetDate);
  const datesToSync = buildInclusiveDateRange(startDate, targetDate);
  const dateResults: SyncNcaaBackfillResult["dateResults"] = [];

  let parsedGames = 0;
  let matchedGames = 0;
  let updatedGames = 0;
  let unchangedGames = 0;
  let unmatchedGames = 0;
  let ambiguousGames = 0;
  let skippedGames = 0;

  for (const syncDate of datesToSync) {
    let result: SyncNcaaResult;

    try {
      result = await syncNcaaResults({ targetDate: syncDate });
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unknown NCAA sync error";
      throw new Error(`Backfill failed for ${syncDate}: ${errorMessage}`);
    }

    dateResults.push({
      date: syncDate,
      parsedGames: result.parsedGames,
      matchedGames: result.matchedGames,
      updatedGames: result.updatedGames,
      unchangedGames: result.unchangedGames,
      unmatchedGames: result.unmatchedGames,
      ambiguousGames: result.ambiguousGames,
      skippedGames: result.skippedGames,
    });

    parsedGames += result.parsedGames;
    matchedGames += result.matchedGames;
    updatedGames += result.updatedGames;
    unchangedGames += result.unchangedGames;
    unmatchedGames += result.unmatchedGames;
    ambiguousGames += result.ambiguousGames;
    skippedGames += result.skippedGames;
  }

  return {
    startDate,
    targetDate,
    datesProcessed: datesToSync.length,
    dateResults,
    parsedGames,
    matchedGames,
    updatedGames,
    unchangedGames,
    unmatchedGames,
    ambiguousGames,
    skippedGames,
  };
}
