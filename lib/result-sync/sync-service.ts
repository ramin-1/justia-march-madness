import { prisma } from "@/lib/prisma";
import { normalizeEntryPicksJson } from "@/lib/brackets/serialization";
import { calculateScore, ROUND_POINTS, type RoundKey } from "@/lib/scoring";
import { fetchNcaaScoresHtml, parseCompletedGames } from "./ncaa";
import { isLikelyMatch } from "./matching";

function isRoundKey(round: string): round is RoundKey {
  return round in ROUND_POINTS;
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
    const html = await fetchNcaaScoresHtml();
    const scrapedGames = parseCompletedGames(html);
    const localGames = await prisma.game.findMany();
    let updatedGames = 0;
    let unmatchedGames = 0;

    for (const scrapedGame of scrapedGames) {
      const match = localGames.find((game) =>
        isLikelyMatch(scrapedGame, {
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
        }),
      );

      if (!match) {
        unmatchedGames += 1;
        continue;
      }

      await prisma.game.update({
        where: { id: match.id },
        data: {
          winnerTeam: scrapedGame.winnerTeam,
          status: "resolved",
          syncSource: "ncaa",
          lastSyncedAt: new Date(),
        },
      });

      updatedGames += 1;
    }

    const resolvedGames = await prisma.game.findMany({
      select: { id: true, round: true, winnerTeam: true },
    });
    const scorableGames = resolvedGames.filter(
      (
        game,
      ): game is { id: string; round: RoundKey; winnerTeam: string | null } =>
        isRoundKey(game.round),
    );

    const entries = await prisma.entry.findMany();

    await Promise.all(
      entries.map((entry) => {
        const normalizedPicks = normalizeEntryPicksJson(
          entry.picksJson,
          entry.bracketType,
        ).picksByGameId;
        const legacyPickMap: Record<string, string | undefined> = {};

        for (const [gameId, pick] of Object.entries(normalizedPicks)) {
          legacyPickMap[gameId] = pick.winnerTeamKey;
        }

        return prisma.entry.update({
          where: { id: entry.id },
          data: {
            totalScore: calculateScore(legacyPickMap, scorableGames),
          },
        });
      }),
    );

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        summaryJson: {
          updatedGames,
          unmatchedGames,
        },
      },
    });

    return { updatedGames, unmatchedGames };
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
