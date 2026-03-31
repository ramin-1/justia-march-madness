import { Prisma } from "@prisma/client";
import { normalizeEntryPicksJson } from "@/lib/brackets/serialization";
import type { BracketType, PicksByGameId } from "@/lib/brackets/types";
import { prisma } from "@/lib/prisma";
import {
  buildFinalWinnerTeamKeyByGameId,
  createGameResultsIndex,
  scoreMainBracketEntry,
  scoreSecondChanceEntry,
  type GameResultRow,
  type GameResultSnapshot,
} from "@/lib/scoring";

export const SCORE_GAME_RESULT_SELECT = {
  id: true,
  status: true,
  winnerTeam: true,
  winnerTeamKey: true,
  homeTeam: true,
  awayTeam: true,
  homeTeamKey: true,
  awayTeamKey: true,
  homeScore: true,
  awayScore: true,
} satisfies Prisma.GameSelect;

type PersistedScoreFields = {
  totalScore: number;
  correctPicks: number;
  maxPossibleScore: number;
};

function toPersistedScoreFields({
  bracketType,
  picksByGameId,
  gameResultsById,
}: {
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
  gameResultsById: Map<string, GameResultSnapshot>;
}): PersistedScoreFields {
  if (bracketType === "MAIN") {
    const result = scoreMainBracketEntry({ picksByGameId, gameResultsById });

    return {
      totalScore: result.totalScore,
      correctPicks: result.correctPicks,
      maxPossibleScore: result.maxPossibleScore,
    };
  }

  if (bracketType === "SECOND_CHANCE_S16") {
    const result = scoreSecondChanceEntry({ picksByGameId, gameResultsById });

    return {
      totalScore: result.totalScore,
      correctPicks: 0,
      maxPossibleScore: result.maxPossibleScore,
    };
  }

  return {
    totalScore: 0,
    correctPicks: 0,
    maxPossibleScore: 0,
  };
}

export async function getCurrentGameResultsIndex() {
  const games = await prisma.game.findMany({
    select: SCORE_GAME_RESULT_SELECT,
  });

  return createGameResultsIndex(games as GameResultRow[]);
}

export async function recalculateEntryStandings(options?: { entryIds?: string[] }) {
  if (options?.entryIds && options.entryIds.length === 0) {
    return { updatedCount: 0 };
  }

  const gameResultsById = await getCurrentGameResultsIndex();
  const sourceWinnerTeamKeyByGameId = buildFinalWinnerTeamKeyByGameId(gameResultsById);

  const entries = await prisma.entry.findMany({
    where: options?.entryIds ? { id: { in: options.entryIds } } : undefined,
    select: {
      id: true,
      bracketType: true,
      picksJson: true,
    },
  });

  if (entries.length === 0) {
    return { updatedCount: 0 };
  }

  await prisma.$transaction(
    entries.map((entry) => {
      const picksByGameId = normalizeEntryPicksJson(
        entry.picksJson,
        entry.bracketType,
        entry.bracketType === "SECOND_CHANCE_S16"
          ? { sourceWinnerTeamKeyByGameId }
          : undefined,
      ).picksByGameId;

      return prisma.entry.update({
        where: { id: entry.id },
        data: toPersistedScoreFields({
          bracketType: entry.bracketType,
          picksByGameId,
          gameResultsById,
        }),
      });
    }),
  );

  return { updatedCount: entries.length };
}

export async function computeEntryScoreFields({
  bracketType,
  picksByGameId,
}: {
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
}) {
  const gameResultsById = await getCurrentGameResultsIndex();

  return toPersistedScoreFields({
    bracketType,
    picksByGameId,
    gameResultsById,
  });
}
