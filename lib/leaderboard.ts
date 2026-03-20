import { getTeamLabel } from "@/lib/brackets/registry";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
import { BRACKET_TYPE_LABELS, type BracketType } from "@/lib/brackets/types";
import {
  getChampionshipOutcome,
  rankChampionshipEntries,
  scoreMainBracketEntry,
  scoreSecondChanceEntry,
  type GameResultSnapshot,
} from "@/lib/scoring";

const LEADERBOARD_VIEW_ORDER = ["main", "second-chance", "championship"] as const;

export type LeaderboardViewKey = (typeof LEADERBOARD_VIEW_ORDER)[number];

export type LeaderboardViewConfig = {
  key: LeaderboardViewKey;
  queryValue: string;
  label: string;
  bracketType: BracketType;
};

export const LEADERBOARD_VIEW_CONFIGS: Record<LeaderboardViewKey, LeaderboardViewConfig> = {
  main: {
    key: "main",
    queryValue: "main",
    label: "Main",
    bracketType: "MAIN",
  },
  "second-chance": {
    key: "second-chance",
    queryValue: "second-chance",
    label: "Second Chance",
    bracketType: "SECOND_CHANCE_S16",
  },
  championship: {
    key: "championship",
    queryValue: "championship",
    label: "Championship",
    bracketType: "CHAMPIONSHIP",
  },
};

export function parseLeaderboardViewKey(rawType: string | null | undefined): LeaderboardViewKey {
  const normalized = rawType?.trim().toLowerCase();

  if (!normalized) {
    return "main";
  }

  if (normalized in LEADERBOARD_VIEW_CONFIGS) {
    return normalized as LeaderboardViewKey;
  }

  return "main";
}

export function getLeaderboardTabData(activeViewKey: LeaderboardViewKey) {
  return LEADERBOARD_VIEW_ORDER.map((viewKey) => {
    const config = LEADERBOARD_VIEW_CONFIGS[viewKey];

    return {
      ...config,
      href: config.queryValue === "main" ? "/leaderboard" : `/leaderboard?type=${config.queryValue}`,
      isActive: viewKey === activeViewKey,
    };
  });
}

type EntryForLeaderboard = {
  id: string;
  name: string;
  participantName: string;
  bracketType: BracketType;
  picksJson: unknown;
  tiebreakerJson: unknown;
};

export type MainLeaderboardRow = {
  rank: number;
  id: string;
  name: string;
  participantName: string;
  score: number;
  correctPicks: number;
  maxPossibleScore: number;
};

export type SecondChanceLeaderboardRow = {
  rank: number;
  id: string;
  name: string;
  participantName: string;
  score: number;
};

export type ChampionshipLeaderboardRow = {
  rank: number;
  id: string;
  name: string;
  participantName: string;
  pickedWinnerLabel: string;
  predictedFinalScore: string;
  pickedCorrectWinner: boolean;
  winnerScoreDelta: number | null;
  totalScoreDelta: number | null;
};

function formatPredictedScores(predictedScoresByTeamKey: Record<string, number>): string {
  const predictions = Object.entries(predictedScoresByTeamKey);

  if (predictions.length === 0) {
    return "Not set";
  }

  return predictions
    .sort(([teamKeyA], [teamKeyB]) => getTeamLabel(teamKeyA).localeCompare(getTeamLabel(teamKeyB)))
    .map(([teamKey, score]) => `${getTeamLabel(teamKey)} ${score}`)
    .join(" • ");
}

export function buildMainLeaderboardRows({
  entries,
  gameResultsById,
}: {
  entries: EntryForLeaderboard[];
  gameResultsById: Map<string, GameResultSnapshot>;
}): MainLeaderboardRow[] {
  const scoredEntries = entries.map((entry) => {
    const picksByGameId = normalizeEntryPicksJson(entry.picksJson, entry.bracketType).picksByGameId;
    const score = scoreMainBracketEntry({ picksByGameId, gameResultsById });

    return {
      id: entry.id,
      name: entry.name,
      participantName: entry.participantName,
      score: score.totalScore,
      correctPicks: score.correctPicks,
      maxPossibleScore: score.maxPossibleScore,
    };
  });

  scoredEntries.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    if (a.correctPicks !== b.correctPicks) {
      return b.correctPicks - a.correctPicks;
    }

    const participantComparison = a.participantName.localeCompare(b.participantName);
    if (participantComparison !== 0) {
      return participantComparison;
    }

    return a.id.localeCompare(b.id);
  });

  return scoredEntries.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}

export function buildSecondChanceLeaderboardRows({
  entries,
  gameResultsById,
}: {
  entries: EntryForLeaderboard[];
  gameResultsById: Map<string, GameResultSnapshot>;
}): SecondChanceLeaderboardRow[] {
  const scoredEntries = entries.map((entry) => {
    const picksByGameId = normalizeEntryPicksJson(entry.picksJson, entry.bracketType).picksByGameId;
    const score = scoreSecondChanceEntry({ picksByGameId, gameResultsById });

    return {
      id: entry.id,
      name: entry.name,
      participantName: entry.participantName,
      score: score.totalScore,
    };
  });

  scoredEntries.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    const participantComparison = a.participantName.localeCompare(b.participantName);
    if (participantComparison !== 0) {
      return participantComparison;
    }

    return a.id.localeCompare(b.id);
  });

  return scoredEntries.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}

export function buildChampionshipLeaderboardRows({
  entries,
  gameResultsById,
}: {
  entries: EntryForLeaderboard[];
  gameResultsById: Map<string, GameResultSnapshot>;
}): {
  rows: ChampionshipLeaderboardRow[];
  isChampionshipResolved: boolean;
} {
  const rankingInput = entries.map((entry) => {
    const picksByGameId = normalizeEntryPicksJson(entry.picksJson, entry.bracketType).picksByGameId;
    const tiebreakerJson = normalizeEntryTiebreakerJson(entry.tiebreakerJson);

    return {
      id: entry.id,
      name: entry.name,
      participantName: entry.participantName,
      pickedWinnerTeamKey: picksByGameId.CHAMPIONSHIP_G1?.winnerTeamKey ?? null,
      predictedScoresByTeamKey: tiebreakerJson?.championship.predictedScoresByTeamKey ?? {},
    };
  });

  const rankedEntries = rankChampionshipEntries({
    entries: rankingInput,
    gameResultsById,
  });

  const rows = rankedEntries.map((entry) => ({
    rank: entry.rank,
    id: entry.id,
    name: entry.name,
    participantName: entry.participantName,
    pickedWinnerLabel: entry.pickedWinnerTeamKey
      ? getTeamLabel(entry.pickedWinnerTeamKey)
      : "Not selected",
    predictedFinalScore: formatPredictedScores(entry.predictedScoresByTeamKey),
    pickedCorrectWinner: entry.pickedCorrectWinner,
    winnerScoreDelta: entry.winnerScoreDelta,
    totalScoreDelta: entry.totalScoreDelta,
  }));

  return {
    rows,
    isChampionshipResolved: getChampionshipOutcome(gameResultsById).isResolved,
  };
}

export function getLeaderboardTypeDescription(viewKey: LeaderboardViewKey): string {
  const bracketType = LEADERBOARD_VIEW_CONFIGS[viewKey].bracketType;

  if (bracketType === "MAIN") {
    return `${BRACKET_TYPE_LABELS[bracketType]} standings with round-based scoring and correct picks.`;
  }

  if (bracketType === "SECOND_CHANCE_S16") {
    return `${BRACKET_TYPE_LABELS[bracketType]} standings with Sweet Sixteen onward scoring.`;
  }

  return `${BRACKET_TYPE_LABELS[bracketType]} ranking using winner and score-closeness tiebreak rules.`;
}
