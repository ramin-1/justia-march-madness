export const BRACKET_TYPES = [
  "MAIN",
  "SECOND_CHANCE_S16",
  "CHAMPIONSHIP",
] as const;

export type BracketType = (typeof BRACKET_TYPES)[number];

export const BRACKET_TYPE_LABELS: Record<BracketType, string> = {
  MAIN: "Main Bracket",
  SECOND_CHANCE_S16: "Second Chance Sweet Sixteen",
  CHAMPIONSHIP: "Championship Bracket",
};

export const BRACKET_TYPE_NAME_SUFFIX: Record<BracketType, string> = {
  MAIN: "Main Bracket",
  SECOND_CHANCE_S16: "Second Chance Bracket",
  CHAMPIONSHIP: "Championship Bracket",
};

export const PICKS_SCHEMA_VERSION = 1;
export const TIEBREAKER_SCHEMA_VERSION = 1;

export type WinnerPick = {
  winnerTeamKey: string;
};

export type PicksByGameId = Record<string, WinnerPick>;

export type EntryPicksJson = {
  schemaVersion: typeof PICKS_SCHEMA_VERSION;
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
};

export type ChampionshipTiebreakerJson = {
  schemaVersion: typeof TIEBREAKER_SCHEMA_VERSION;
  championship: {
    championshipGameId: string;
    predictedScoresByTeamKey: Record<string, number>;
  };
};

export type EntryTiebreakerJson = ChampionshipTiebreakerJson | null;
