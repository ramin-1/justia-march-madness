import {
  BRACKET_TYPES,
  PICKS_SCHEMA_VERSION,
  TIEBREAKER_SCHEMA_VERSION,
  type BracketType,
  type EntryPicksJson,
  type EntryTiebreakerJson,
  type PicksByGameId,
} from "@/lib/brackets/types";
import { sanitizePicksForTemplate } from "@/lib/brackets/registry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBracketType(value: unknown): value is BracketType {
  return typeof value === "string" && BRACKET_TYPES.includes(value as BracketType);
}

function normalizePicksByGameId(value: unknown): PicksByGameId {
  if (!isRecord(value)) {
    return {};
  }

  const picksByGameId: PicksByGameId = {};

  for (const [gameId, rawPick] of Object.entries(value)) {
    if (typeof rawPick === "string" && rawPick.length > 0) {
      picksByGameId[gameId] = { winnerTeamKey: rawPick };
      continue;
    }

    if (!isRecord(rawPick)) {
      continue;
    }

    const winnerTeamKey = rawPick.winnerTeamKey;
    if (typeof winnerTeamKey === "string" && winnerTeamKey.length > 0) {
      picksByGameId[gameId] = { winnerTeamKey };
    }
  }

  return picksByGameId;
}

export function createEmptyPicksJson(bracketType: BracketType): EntryPicksJson {
  return {
    schemaVersion: PICKS_SCHEMA_VERSION,
    bracketType,
    picksByGameId: {},
  };
}

export function normalizeEntryPicksJson(
  raw: unknown,
  fallbackBracketType: BracketType,
): EntryPicksJson {
  if (!isRecord(raw)) {
    return createEmptyPicksJson(fallbackBracketType);
  }

  const bracketType = isBracketType(raw.bracketType)
    ? raw.bracketType
    : fallbackBracketType;

  const picksByGameId = normalizePicksByGameId(
    isRecord(raw.picksByGameId) ? raw.picksByGameId : raw,
  );

  return {
    schemaVersion: PICKS_SCHEMA_VERSION,
    bracketType,
    picksByGameId: sanitizePicksForTemplate({ bracketType, picksByGameId }),
  };
}

export function normalizeEntryTiebreakerJson(raw: unknown): EntryTiebreakerJson {
  if (!isRecord(raw)) {
    return null;
  }

  const schemaVersion = raw.schemaVersion;
  const championship = raw.championship;

  if (schemaVersion !== TIEBREAKER_SCHEMA_VERSION || !isRecord(championship)) {
    return null;
  }

  const championshipGameId = championship.championshipGameId;
  const predictedScoresByTeamKey = championship.predictedScoresByTeamKey;

  if (
    typeof championshipGameId !== "string" ||
    championshipGameId.length === 0 ||
    !isRecord(predictedScoresByTeamKey)
  ) {
    return null;
  }

  const scoreMap: Record<string, number> = {};

  for (const [teamKey, value] of Object.entries(predictedScoresByTeamKey)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }

    scoreMap[teamKey] = value;
  }

  return {
    schemaVersion: TIEBREAKER_SCHEMA_VERSION,
    championship: {
      championshipGameId,
      predictedScoresByTeamKey: scoreMap,
    },
  };
}
