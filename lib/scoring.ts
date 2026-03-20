import {
  CANONICAL_GAMES,
  getCanonicalGame,
  getTemplateGameIds,
  type BracketRoundKey,
} from "@/lib/brackets/registry";
import { isFinalGameResultStatus } from "@/lib/results/status";
import type { PicksByGameId } from "@/lib/brackets/types";

export const MAIN_ROUND_POINTS = {
  playIn: 1,
  round1: 2,
  round2: 4,
  sweet16: 8,
  elite8: 16,
  final4: 32,
  championship: 64,
} as const;

export const SECOND_CHANCE_ROUND_POINTS = {
  sweet16: 1,
  elite8: 2,
  final4: 4,
  championship: 8,
} as const;

export const ROUND_POINTS = MAIN_ROUND_POINTS;

export type RoundKey = keyof typeof MAIN_ROUND_POINTS;

export type PickMap = Record<string, string | null | undefined>;

export type ScorableGame = {
  id: string;
  round: RoundKey;
  winnerTeam: string | null;
};

export type GameResultRow = {
  id: string;
  status: string | null;
  winnerTeam: string | null;
  winnerTeamKey: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type GameResultSnapshot = {
  id: string;
  round: BracketRoundKey;
  isResolved: boolean;
  winnerTeamKey: string | null;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type BracketScoreSummary = {
  totalScore: number;
  correctPicks: number;
  maxPossibleScore: number;
};

export type ChampionshipOutcome = {
  isResolved: boolean;
  winnerTeamKey: string | null;
  winningTeamScore: number | null;
  totalScore: number | null;
  finalistTeamKeys: string[];
};

export type ChampionshipRankingInput = {
  id: string;
  name: string;
  participantName: string;
  pickedWinnerTeamKey: string | null;
  predictedScoresByTeamKey: Record<string, number>;
};

export type ChampionshipRankingResult = ChampionshipRankingInput & {
  rank: number;
  pickedCorrectWinner: boolean;
  winnerScoreDelta: number | null;
  totalScoreDelta: number | null;
};

const canonicalTeamKeySet = new Set<string>();
const canonicalTeamKeyByLabel = new Map<string, string>();

for (const game of CANONICAL_GAMES) {
  for (const teamOption of [...(game.initialTeams ?? []), ...(game.fixedTeams ?? [])]) {
    canonicalTeamKeySet.add(teamOption.key);

    if (!canonicalTeamKeyByLabel.has(teamOption.label)) {
      canonicalTeamKeyByLabel.set(teamOption.label, teamOption.key);
    }
  }
}

function normalizeNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeInteger(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function resolveTeamKeyFromLabel(label: string | null | undefined): string | null {
  const normalizedLabel = normalizeNonEmptyString(label);
  if (!normalizedLabel) {
    return null;
  }

  return canonicalTeamKeyByLabel.get(normalizedLabel) ?? null;
}

function resolveWinnerTeamKey(game: GameResultRow): string | null {
  const explicitWinnerTeamKey = normalizeNonEmptyString(game.winnerTeamKey);
  if (explicitWinnerTeamKey) {
    return explicitWinnerTeamKey;
  }

  const winnerTeam = normalizeNonEmptyString(game.winnerTeam);
  if (!winnerTeam) {
    return null;
  }

  if (canonicalTeamKeySet.has(winnerTeam)) {
    return winnerTeam;
  }

  const homeTeamKey =
    normalizeNonEmptyString(game.homeTeamKey) ?? resolveTeamKeyFromLabel(game.homeTeam);
  const awayTeamKey =
    normalizeNonEmptyString(game.awayTeamKey) ?? resolveTeamKeyFromLabel(game.awayTeam);

  if (winnerTeam === normalizeNonEmptyString(game.homeTeam) && homeTeamKey) {
    return homeTeamKey;
  }

  if (winnerTeam === normalizeNonEmptyString(game.awayTeam) && awayTeamKey) {
    return awayTeamKey;
  }

  return resolveTeamKeyFromLabel(winnerTeam);
}

export function createGameResultsIndex(
  games: GameResultRow[],
): Map<string, GameResultSnapshot> {
  const byGameId = new Map<string, GameResultSnapshot>();

  for (const game of games) {
    let round: BracketRoundKey;

    try {
      round = getCanonicalGame(game.id).round;
    } catch {
      continue;
    }

    const homeTeamKey =
      normalizeNonEmptyString(game.homeTeamKey) ?? resolveTeamKeyFromLabel(game.homeTeam);
    const awayTeamKey =
      normalizeNonEmptyString(game.awayTeamKey) ?? resolveTeamKeyFromLabel(game.awayTeam);
    const winnerTeamKey = resolveWinnerTeamKey(game);

    byGameId.set(game.id, {
      id: game.id,
      round,
      isResolved: isFinalGameResultStatus(game.status),
      winnerTeamKey,
      homeTeamKey,
      awayTeamKey,
      homeScore: normalizeInteger(game.homeScore),
      awayScore: normalizeInteger(game.awayScore),
    });
  }

  return byGameId;
}

function scoreBracketGames({
  bracketType,
  pointsByRound,
  picksByGameId,
  gameResultsById,
}: {
  bracketType: "MAIN" | "SECOND_CHANCE_S16";
  pointsByRound: Partial<Record<BracketRoundKey, number>>;
  picksByGameId: PicksByGameId;
  gameResultsById: Map<string, GameResultSnapshot>;
}): BracketScoreSummary {
  let totalScore = 0;
  let correctPicks = 0;
  let maxPossibleScore = 0;

  for (const gameId of getTemplateGameIds(bracketType)) {
    const round = getCanonicalGame(gameId).round;
    const pointsForRound = pointsByRound[round];

    if (!pointsForRound) {
      continue;
    }

    const pickedWinnerTeamKey = picksByGameId[gameId]?.winnerTeamKey;
    if (!pickedWinnerTeamKey) {
      continue;
    }

    const gameResult = gameResultsById.get(gameId);

    if (!gameResult?.isResolved || !gameResult.winnerTeamKey) {
      maxPossibleScore += pointsForRound;
      continue;
    }

    if (pickedWinnerTeamKey === gameResult.winnerTeamKey) {
      totalScore += pointsForRound;
      correctPicks += 1;
      maxPossibleScore += pointsForRound;
    }
  }

  return {
    totalScore,
    correctPicks,
    maxPossibleScore,
  };
}

export function scoreMainBracketEntry({
  picksByGameId,
  gameResultsById,
}: {
  picksByGameId: PicksByGameId;
  gameResultsById: Map<string, GameResultSnapshot>;
}): BracketScoreSummary {
  return scoreBracketGames({
    bracketType: "MAIN",
    pointsByRound: MAIN_ROUND_POINTS,
    picksByGameId,
    gameResultsById,
  });
}

export function scoreSecondChanceEntry({
  picksByGameId,
  gameResultsById,
}: {
  picksByGameId: PicksByGameId;
  gameResultsById: Map<string, GameResultSnapshot>;
}): BracketScoreSummary {
  return scoreBracketGames({
    bracketType: "SECOND_CHANCE_S16",
    pointsByRound: SECOND_CHANCE_ROUND_POINTS,
    picksByGameId,
    gameResultsById,
  });
}

export function getChampionshipOutcome(
  gameResultsById: Map<string, GameResultSnapshot>,
): ChampionshipOutcome {
  const championshipResult = gameResultsById.get("CHAMPIONSHIP_G1");

  if (!championshipResult) {
    return {
      isResolved: false,
      winnerTeamKey: null,
      winningTeamScore: null,
      totalScore: null,
      finalistTeamKeys: [],
    };
  }

  const finalistTeamKeys = [
    championshipResult.homeTeamKey,
    championshipResult.awayTeamKey,
  ].filter((teamKey): teamKey is string => typeof teamKey === "string" && teamKey.length > 0);

  const actualScoresByTeamKey: Record<string, number> = {};

  if (championshipResult.homeTeamKey && championshipResult.homeScore !== null) {
    actualScoresByTeamKey[championshipResult.homeTeamKey] = championshipResult.homeScore;
  }

  if (championshipResult.awayTeamKey && championshipResult.awayScore !== null) {
    actualScoresByTeamKey[championshipResult.awayTeamKey] = championshipResult.awayScore;
  }

  const winnerTeamKey = championshipResult.winnerTeamKey;
  const winningTeamScore =
    winnerTeamKey && winnerTeamKey in actualScoresByTeamKey
      ? actualScoresByTeamKey[winnerTeamKey]
      : null;

  const totalScore =
    finalistTeamKeys.length === 2 &&
    finalistTeamKeys.every((teamKey) => teamKey in actualScoresByTeamKey)
      ? finalistTeamKeys.reduce((sum, teamKey) => sum + actualScoresByTeamKey[teamKey], 0)
      : null;

  return {
    isResolved: championshipResult.isResolved && winnerTeamKey !== null,
    winnerTeamKey,
    winningTeamScore,
    totalScore,
    finalistTeamKeys,
  };
}

function toDeltaSortValue(delta: number | null): number {
  return delta === null ? Number.POSITIVE_INFINITY : delta;
}

function compareChampionshipRankingResults(
  a: ChampionshipRankingResult,
  b: ChampionshipRankingResult,
): number {
  if (a.pickedCorrectWinner !== b.pickedCorrectWinner) {
    return a.pickedCorrectWinner ? -1 : 1;
  }

  const winnerScoreDeltaComparison =
    toDeltaSortValue(a.winnerScoreDelta) - toDeltaSortValue(b.winnerScoreDelta);
  if (winnerScoreDeltaComparison !== 0) {
    return winnerScoreDeltaComparison;
  }

  const totalScoreDeltaComparison =
    toDeltaSortValue(a.totalScoreDelta) - toDeltaSortValue(b.totalScoreDelta);
  if (totalScoreDeltaComparison !== 0) {
    return totalScoreDeltaComparison;
  }

  const participantComparison = a.participantName.localeCompare(b.participantName);
  if (participantComparison !== 0) {
    return participantComparison;
  }

  const entryNameComparison = a.name.localeCompare(b.name);
  if (entryNameComparison !== 0) {
    return entryNameComparison;
  }

  return a.id.localeCompare(b.id);
}

export function rankChampionshipEntries({
  entries,
  gameResultsById,
}: {
  entries: ChampionshipRankingInput[];
  gameResultsById: Map<string, GameResultSnapshot>;
}): ChampionshipRankingResult[] {
  const championshipOutcome = getChampionshipOutcome(gameResultsById);

  const rankedEntries = entries.map<ChampionshipRankingResult>((entry) => {
    const pickedCorrectWinner =
      championshipOutcome.winnerTeamKey !== null &&
      entry.pickedWinnerTeamKey === championshipOutcome.winnerTeamKey;

    const predictedWinnerTeamScore =
      championshipOutcome.winnerTeamKey !== null
        ? entry.predictedScoresByTeamKey[championshipOutcome.winnerTeamKey]
        : undefined;

    const winnerScoreDelta =
      championshipOutcome.winningTeamScore !== null &&
      typeof predictedWinnerTeamScore === "number" &&
      Number.isFinite(predictedWinnerTeamScore)
        ? Math.abs(predictedWinnerTeamScore - championshipOutcome.winningTeamScore)
        : null;

    const [teamKeyA, teamKeyB] = championshipOutcome.finalistTeamKeys;
    const predictedScoreA = teamKeyA ? entry.predictedScoresByTeamKey[teamKeyA] : undefined;
    const predictedScoreB = teamKeyB ? entry.predictedScoresByTeamKey[teamKeyB] : undefined;

    const totalScoreDelta =
      championshipOutcome.totalScore !== null &&
      typeof predictedScoreA === "number" &&
      Number.isFinite(predictedScoreA) &&
      typeof predictedScoreB === "number" &&
      Number.isFinite(predictedScoreB)
        ? Math.abs(predictedScoreA + predictedScoreB - championshipOutcome.totalScore)
        : null;

    return {
      ...entry,
      rank: 0,
      pickedCorrectWinner,
      winnerScoreDelta,
      totalScoreDelta,
    };
  });

  rankedEntries.sort(compareChampionshipRankingResults);

  return rankedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function calculateScore(picks: PickMap, games: ScorableGame[]): number {
  return games.reduce((total, game) => {
    if (!game.winnerTeam) {
      return total;
    }

    return picks[game.id] === game.winnerTeam ? total + ROUND_POINTS[game.round] : total;
  }, 0);
}
