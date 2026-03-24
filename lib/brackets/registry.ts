import {
  BRACKET_TYPE_LABELS,
  type BracketType,
  type PicksByGameId,
  type WinnerPick,
} from "@/lib/brackets/types";

export type BracketRoundKey =
  | "playIn"
  | "round1"
  | "round2"
  | "sweet16"
  | "elite8"
  | "final4"
  | "championship";

type RegionKey = "EAST" | "WEST" | "SOUTH" | "MIDWEST";

const REGION_KEYS: RegionKey[] = ["EAST", "WEST", "SOUTH", "MIDWEST"];

const REGION_LABELS: Record<RegionKey, string> = {
  EAST: "East",
  WEST: "West",
  SOUTH: "South",
  MIDWEST: "Midwest",
};

export type TeamOption = {
  key: string;
  label: string;
};

export type WinnerTeamKeyByGameId = Record<string, string>;

export type CanonicalGameConfig = {
  id: string;
  round: BracketRoundKey;
  region?: string;
  slotLabel: string;
  initialTeams?: readonly TeamOption[];
  fixedTeams?: readonly TeamOption[];
  sourceGameIds?: readonly string[];
};

export type BracketRoundConfig = {
  key: BracketRoundKey;
  label: string;
  description: string;
  gameIds: readonly string[];
};

export type BracketTemplateConfig = {
  bracketType: BracketType;
  label: string;
  description: string;
  dependencyMode: "strict" | "allow-initial-fallback";
  rounds: readonly BracketRoundConfig[];
};

function team(key: string, label: string): TeamOption {
  return { key, label };
}

function seededTeam(region: RegionKey, seedLabel: string): TeamOption {
  return team(`${region}_${seedLabel}`, `${REGION_LABELS[region]} ${seedLabel}`);
}

function sweet16FallbackTeams(region: RegionKey, gameNumber: 1 | 2): TeamOption[] {
  return gameNumber === 1
    ? [
        team(`${region}_S16_A`, `${REGION_LABELS[region]} Team A`),
        team(`${region}_S16_B`, `${REGION_LABELS[region]} Team B`),
      ]
    : [
        team(`${region}_S16_C`, `${REGION_LABELS[region]} Team C`),
        team(`${region}_S16_D`, `${REGION_LABELS[region]} Team D`),
      ];
}

type RegionTopology = {
  round1Games: CanonicalGameConfig[];
  round2Games: CanonicalGameConfig[];
  sweet16Games: CanonicalGameConfig[];
  elite8Game: CanonicalGameConfig;
};

function createRegionTopology({
  region,
  playIn16GameId,
  playIn11GameId,
}: {
  region: RegionKey;
  playIn16GameId?: string;
  playIn11GameId?: string;
}): RegionTopology {
  const round1Game1: CanonicalGameConfig =
    playIn16GameId
      ? {
          id: `${region}_R1_G1`,
          round: "round1",
          region: REGION_LABELS[region],
          slotLabel: `${REGION_LABELS[region]} First Round - Game 1`,
          fixedTeams: [seededTeam(region, "1")],
          sourceGameIds: [playIn16GameId],
        }
      : {
          id: `${region}_R1_G1`,
          round: "round1",
          region: REGION_LABELS[region],
          slotLabel: `${REGION_LABELS[region]} First Round - Game 1`,
          initialTeams: [seededTeam(region, "1"), seededTeam(region, "16")],
        };

  const round1Game5: CanonicalGameConfig =
    playIn11GameId
      ? {
          id: `${region}_R1_G5`,
          round: "round1",
          region: REGION_LABELS[region],
          slotLabel: `${REGION_LABELS[region]} First Round - Game 5`,
          fixedTeams: [seededTeam(region, "6")],
          sourceGameIds: [playIn11GameId],
        }
      : {
          id: `${region}_R1_G5`,
          round: "round1",
          region: REGION_LABELS[region],
          slotLabel: `${REGION_LABELS[region]} First Round - Game 5`,
          initialTeams: [seededTeam(region, "6"), seededTeam(region, "11")],
        };

  const round1Games: CanonicalGameConfig[] = [
    round1Game1,
    {
      id: `${region}_R1_G2`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 2`,
      initialTeams: [seededTeam(region, "8"), seededTeam(region, "9")],
    },
    {
      id: `${region}_R1_G3`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 3`,
      initialTeams: [seededTeam(region, "5"), seededTeam(region, "12")],
    },
    {
      id: `${region}_R1_G4`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 4`,
      initialTeams: [seededTeam(region, "4"), seededTeam(region, "13")],
    },
    round1Game5,
    {
      id: `${region}_R1_G6`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 6`,
      initialTeams: [seededTeam(region, "3"), seededTeam(region, "14")],
    },
    {
      id: `${region}_R1_G7`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 7`,
      initialTeams: [seededTeam(region, "7"), seededTeam(region, "10")],
    },
    {
      id: `${region}_R1_G8`,
      round: "round1",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} First Round - Game 8`,
      initialTeams: [seededTeam(region, "2"), seededTeam(region, "15")],
    },
  ];

  const round2Games: CanonicalGameConfig[] = [
    {
      id: `${region}_R2_G1`,
      round: "round2",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Second Round - Game 1`,
      sourceGameIds: [`${region}_R1_G1`, `${region}_R1_G2`],
    },
    {
      id: `${region}_R2_G2`,
      round: "round2",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Second Round - Game 2`,
      sourceGameIds: [`${region}_R1_G3`, `${region}_R1_G4`],
    },
    {
      id: `${region}_R2_G3`,
      round: "round2",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Second Round - Game 3`,
      sourceGameIds: [`${region}_R1_G5`, `${region}_R1_G6`],
    },
    {
      id: `${region}_R2_G4`,
      round: "round2",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Second Round - Game 4`,
      sourceGameIds: [`${region}_R1_G7`, `${region}_R1_G8`],
    },
  ];

  const sweet16Games: CanonicalGameConfig[] = [
    {
      id: `${region}_S16_G1`,
      round: "sweet16",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Sweet Sixteen - Game 1`,
      sourceGameIds: [`${region}_R2_G1`, `${region}_R2_G2`],
      initialTeams: sweet16FallbackTeams(region, 1),
    },
    {
      id: `${region}_S16_G2`,
      round: "sweet16",
      region: REGION_LABELS[region],
      slotLabel: `${REGION_LABELS[region]} Sweet Sixteen - Game 2`,
      sourceGameIds: [`${region}_R2_G3`, `${region}_R2_G4`],
      initialTeams: sweet16FallbackTeams(region, 2),
    },
  ];

  const elite8Game: CanonicalGameConfig = {
    id: `${region}_E8_G1`,
    round: "elite8",
    region: REGION_LABELS[region],
    slotLabel: `${REGION_LABELS[region]} Elite Eight`,
    sourceGameIds: [`${region}_S16_G1`, `${region}_S16_G2`],
  };

  return {
    round1Games,
    round2Games,
    sweet16Games,
    elite8Game,
  };
}

const PLAY_IN_GAMES: CanonicalGameConfig[] = [
  {
    id: "PLAYIN_G1",
    round: "playIn",
    region: REGION_LABELS.MIDWEST,
    slotLabel: "Play-In 1 (Midwest 16-seed qualifier)",
    initialTeams: [seededTeam("MIDWEST", "16A"), seededTeam("MIDWEST", "16B")],
  },
  {
    id: "PLAYIN_G2",
    round: "playIn",
    region: REGION_LABELS.WEST,
    slotLabel: "Play-In 2 (West 11-seed qualifier)",
    initialTeams: [seededTeam("WEST", "11A"), seededTeam("WEST", "11B")],
  },
  {
    id: "PLAYIN_G3",
    round: "playIn",
    region: REGION_LABELS.SOUTH,
    slotLabel: "Play-In 3 (South 16-seed qualifier)",
    initialTeams: [seededTeam("SOUTH", "16A"), seededTeam("SOUTH", "16B")],
  },
  {
    id: "PLAYIN_G4",
    round: "playIn",
    region: REGION_LABELS.MIDWEST,
    slotLabel: "Play-In 4 (Midwest 11-seed qualifier)",
    initialTeams: [seededTeam("MIDWEST", "11A"), seededTeam("MIDWEST", "11B")],
  },
];

const REGION_TOPOLOGY = {
  EAST: createRegionTopology({
    region: "EAST",
  }),
  WEST: createRegionTopology({
    region: "WEST",
    playIn11GameId: "PLAYIN_G2",
  }),
  SOUTH: createRegionTopology({
    region: "SOUTH",
    playIn16GameId: "PLAYIN_G3",
  }),
  MIDWEST: createRegionTopology({
    region: "MIDWEST",
    playIn16GameId: "PLAYIN_G1",
    playIn11GameId: "PLAYIN_G4",
  }),
} as const;

const ROUND1_GAMES = REGION_KEYS.flatMap((region) => REGION_TOPOLOGY[region].round1Games);
const ROUND2_GAMES = REGION_KEYS.flatMap((region) => REGION_TOPOLOGY[region].round2Games);
const SWEET16_GAMES = REGION_KEYS.flatMap((region) => REGION_TOPOLOGY[region].sweet16Games);
const ELITE8_GAMES = REGION_KEYS.map((region) => REGION_TOPOLOGY[region].elite8Game);

const FINAL4_GAMES: CanonicalGameConfig[] = [
  {
    id: "FINAL4_G1",
    round: "final4",
    slotLabel: "Final Four - Semifinal 1",
    sourceGameIds: ["EAST_E8_G1", "SOUTH_E8_G1"],
  },
  {
    id: "FINAL4_G2",
    round: "final4",
    slotLabel: "Final Four - Semifinal 2",
    sourceGameIds: ["WEST_E8_G1", "MIDWEST_E8_G1"],
  },
];

const CHAMPIONSHIP_GAME: CanonicalGameConfig = {
  id: "CHAMPIONSHIP_G1",
  round: "championship",
  slotLabel: "Championship",
  sourceGameIds: ["FINAL4_G1", "FINAL4_G2"],
  initialTeams: [team("TEAM_X", "Team X"), team("TEAM_Z", "Team Z")],
};

export const CANONICAL_GAMES: CanonicalGameConfig[] = [
  ...PLAY_IN_GAMES,
  ...ROUND1_GAMES,
  ...ROUND2_GAMES,
  ...SWEET16_GAMES,
  ...ELITE8_GAMES,
  ...FINAL4_GAMES,
  CHAMPIONSHIP_GAME,
];

const MAIN_ROUNDS: readonly BracketRoundConfig[] = [
  {
    key: "playIn",
    label: "Play-In",
    description: "First Four play-in picks.",
    gameIds: PLAY_IN_GAMES.map((game) => game.id),
  },
  {
    key: "round1",
    label: "First Round",
    description: "Round of 64 opening games.",
    gameIds: ROUND1_GAMES.map((game) => game.id),
  },
  {
    key: "round2",
    label: "Second Round",
    description: "Round of 32 matchups based on first-round winners.",
    gameIds: ROUND2_GAMES.map((game) => game.id),
  },
  {
    key: "sweet16",
    label: "Sweet Sixteen",
    description: "Sweet Sixteen regional semifinal games.",
    gameIds: SWEET16_GAMES.map((game) => game.id),
  },
  {
    key: "elite8",
    label: "Elite Eight",
    description: "Regional finals based on Sweet Sixteen winners.",
    gameIds: ELITE8_GAMES.map((game) => game.id),
  },
  {
    key: "final4",
    label: "Final Four",
    description: "National semifinal games based on Elite Eight winners.",
    gameIds: FINAL4_GAMES.map((game) => game.id),
  },
  {
    key: "championship",
    label: "Championship",
    description: "National championship game based on Final Four winners.",
    gameIds: [CHAMPIONSHIP_GAME.id],
  },
];

const SECOND_CHANCE_ROUNDS: readonly BracketRoundConfig[] = [
  {
    key: "sweet16",
    label: "Sweet Sixteen",
    description: "Second Chance starts at the Sweet Sixteen.",
    gameIds: SWEET16_GAMES.map((game) => game.id),
  },
  {
    key: "elite8",
    label: "Elite Eight",
    description: "Regional finals based on Sweet Sixteen winners.",
    gameIds: ELITE8_GAMES.map((game) => game.id),
  },
  {
    key: "final4",
    label: "Final Four",
    description: "National semifinal games based on Elite Eight winners.",
    gameIds: FINAL4_GAMES.map((game) => game.id),
  },
  {
    key: "championship",
    label: "Championship",
    description: "Championship game based on Final Four winners.",
    gameIds: [CHAMPIONSHIP_GAME.id],
  },
];

const CHAMPIONSHIP_ROUNDS: readonly BracketRoundConfig[] = [
  {
    key: "championship",
    label: "Championship",
    description: "Championship winner plus final score prediction.",
    gameIds: [CHAMPIONSHIP_GAME.id],
  },
];

export const BRACKET_TEMPLATE_REGISTRY: Record<BracketType, BracketTemplateConfig> = {
  MAIN: {
    bracketType: "MAIN",
    label: BRACKET_TYPE_LABELS.MAIN,
    description: "Full tournament bracket including play-in through championship.",
    dependencyMode: "strict",
    rounds: MAIN_ROUNDS,
  },
  SECOND_CHANCE_S16: {
    bracketType: "SECOND_CHANCE_S16",
    label: BRACKET_TYPE_LABELS.SECOND_CHANCE_S16,
    description: "Sweet Sixteen onward reduced bracket.",
    dependencyMode: "strict",
    rounds: SECOND_CHANCE_ROUNDS,
  },
  CHAMPIONSHIP: {
    bracketType: "CHAMPIONSHIP",
    label: BRACKET_TYPE_LABELS.CHAMPIONSHIP,
    description: "Championship-only bracket with winner and score prediction.",
    dependencyMode: "allow-initial-fallback",
    rounds: CHAMPIONSHIP_ROUNDS,
  },
};

const gameById = new Map(CANONICAL_GAMES.map((game) => [game.id, game]));

const teamLabelByKey = new Map<string, string>();
for (const game of CANONICAL_GAMES) {
  for (const teamOption of [...(game.initialTeams ?? []), ...(game.fixedTeams ?? [])]) {
    teamLabelByKey.set(teamOption.key, teamOption.label);
  }
}
const canonicalTeamSlots = [...teamLabelByKey.entries()]
  .map(([key, label]) => ({ key, label }))
  .sort((slotA, slotB) => slotA.label.localeCompare(slotB.label));

function dedupeTeamOptions(options: readonly TeamOption[]): TeamOption[] {
  const seen = new Set<string>();
  const deduped: TeamOption[] = [];

  for (const option of options) {
    if (seen.has(option.key)) {
      continue;
    }

    seen.add(option.key);
    deduped.push(option);
  }

  return deduped;
}

function withResolvedTeamLabels(
  options: readonly TeamOption[],
  teamLabelOverridesByKey?: Record<string, string>,
): TeamOption[] {
  return options.map((option) => ({
    ...option,
    label: getTeamLabel(option.key, teamLabelOverridesByKey),
  }));
}

export function getBracketTemplate(bracketType: BracketType): BracketTemplateConfig {
  return BRACKET_TEMPLATE_REGISTRY[bracketType];
}

export function getTemplateRoundConfigs(bracketType: BracketType): readonly BracketRoundConfig[] {
  return getBracketTemplate(bracketType).rounds;
}

export function getTemplateGameIds(bracketType: BracketType): string[] {
  return getTemplateRoundConfigs(bracketType).flatMap((round) => round.gameIds);
}

export function getCanonicalGame(gameId: string): CanonicalGameConfig {
  const game = gameById.get(gameId);

  if (!game) {
    throw new Error(`Unknown canonical game id: ${gameId}`);
  }

  return game;
}

export function getCanonicalTeamSlots(): TeamOption[] {
  return canonicalTeamSlots.map((slot) => ({ ...slot }));
}

export function getTeamLabel(
  teamKey: string,
  teamLabelOverridesByKey?: Record<string, string>,
): string {
  const overrideLabel = teamLabelOverridesByKey?.[teamKey];

  if (typeof overrideLabel === "string" && overrideLabel.trim().length > 0) {
    return overrideLabel.trim();
  }

  return teamLabelByKey.get(teamKey) ?? teamKey;
}

function toWinnerPick(winnerTeamKey: string): WinnerPick {
  return { winnerTeamKey };
}

function isWinnerPick(value: WinnerPick | undefined): value is WinnerPick {
  return typeof value?.winnerTeamKey === "string" && value.winnerTeamKey.length > 0;
}

export function getAvailableTeamsForGame({
  bracketType,
  gameId,
  picksByGameId,
  teamLabelOverridesByKey,
  sourceWinnerTeamKeyByGameId,
}: {
  bracketType: BracketType;
  gameId: string;
  picksByGameId: PicksByGameId;
  teamLabelOverridesByKey?: Record<string, string>;
  sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
}): TeamOption[] {
  const game = getCanonicalGame(gameId);
  const template = getBracketTemplate(bracketType);

  if (!game.sourceGameIds || game.sourceGameIds.length === 0) {
    return withResolvedTeamLabels(
      dedupeTeamOptions(game.initialTeams ?? []),
      teamLabelOverridesByKey,
    );
  }

  const templateGameIds = new Set(getTemplateGameIds(bracketType));
  const sourceWinnerTeams: TeamOption[] = [];
  let missingTemplateSourceWinner = false;

  for (const sourceGameId of game.sourceGameIds) {
    const sourcePick = picksByGameId[sourceGameId];

    if (isWinnerPick(sourcePick)) {
      sourceWinnerTeams.push({
        key: sourcePick.winnerTeamKey,
        label: getTeamLabel(sourcePick.winnerTeamKey, teamLabelOverridesByKey),
      });
      continue;
    }

    const sourceWinnerTeamKey = sourceWinnerTeamKeyByGameId?.[sourceGameId];
    if (typeof sourceWinnerTeamKey === "string" && sourceWinnerTeamKey.length > 0) {
      sourceWinnerTeams.push({
        key: sourceWinnerTeamKey,
        label: getTeamLabel(sourceWinnerTeamKey, teamLabelOverridesByKey),
      });
      continue;
    }

    if (templateGameIds.has(sourceGameId)) {
      missingTemplateSourceWinner = true;
    }
  }

  if (missingTemplateSourceWinner) {
    if (template.dependencyMode === "allow-initial-fallback") {
      return withResolvedTeamLabels(
        dedupeTeamOptions([...(game.fixedTeams ?? []), ...(game.initialTeams ?? [])]),
        teamLabelOverridesByKey,
      );
    }

    return [];
  }

  if (sourceWinnerTeams.length === game.sourceGameIds.length) {
    const resolvedTeams = dedupeTeamOptions([
      ...(game.fixedTeams ?? []),
      ...sourceWinnerTeams,
    ]);

    return withResolvedTeamLabels(
      resolvedTeams.length > 0 ? resolvedTeams : dedupeTeamOptions(game.initialTeams ?? []),
      teamLabelOverridesByKey,
    );
  }

  const fallbackTeams = dedupeTeamOptions([
    ...(game.fixedTeams ?? []),
    ...sourceWinnerTeams,
    ...(game.initialTeams ?? []),
  ]);

  if (fallbackTeams.length > 0) {
    return withResolvedTeamLabels(fallbackTeams, teamLabelOverridesByKey);
  }

  if (template.dependencyMode === "allow-initial-fallback") {
    return withResolvedTeamLabels(
      dedupeTeamOptions(game.initialTeams ?? []),
      teamLabelOverridesByKey,
    );
  }

  return [];
}

export function sanitizePicksForTemplate({
  bracketType,
  picksByGameId,
  sourceWinnerTeamKeyByGameId,
}: {
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
  sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
}): PicksByGameId {
  const sanitized: PicksByGameId = {};

  for (const gameId of getTemplateGameIds(bracketType)) {
    const selectedKey = picksByGameId[gameId]?.winnerTeamKey;
    if (!selectedKey) {
      continue;
    }

    const availableTeams = getAvailableTeamsForGame({
      bracketType,
      gameId,
      picksByGameId: sanitized,
      sourceWinnerTeamKeyByGameId,
    });

    if (availableTeams.some((teamOption) => teamOption.key === selectedKey)) {
      sanitized[gameId] = toWinnerPick(selectedKey);
    }
  }

  return sanitized;
}
