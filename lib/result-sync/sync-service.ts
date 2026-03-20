import { prisma } from "@/lib/prisma";
import { recalculateEntryStandings } from "@/lib/standings";
import { fetchNcaaScoresHtml, parseCompletedGames } from "./ncaa";
import { isLikelyMatch } from "./matching";

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

      const winnerTeamKey =
        scrapedGame.winnerTeam === match.homeTeam
          ? match.homeTeamKey
          : scrapedGame.winnerTeam === match.awayTeam
            ? match.awayTeamKey
            : null;

      await prisma.game.update({
        where: { id: match.id },
        data: {
          winnerTeam: scrapedGame.winnerTeam,
          winnerTeamKey,
          status: "resolved",
          syncSource: "ncaa",
          lastSyncedAt: new Date(),
        },
      });

      updatedGames += 1;
    }

    await recalculateEntryStandings();

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
