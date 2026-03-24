import { z } from "zod";
import {
  getAvailableTeamsForGame,
  getBracketTemplate,
  getTemplateGameIds,
  getTemplateRoundConfigs,
  sanitizePicksForTemplate,
  type WinnerTeamKeyByGameId,
} from "@/lib/brackets/registry";
import {
  BRACKET_TYPES,
  BRACKET_TYPE_LABELS,
  BRACKET_TYPE_NAME_SUFFIX,
  PICKS_SCHEMA_VERSION,
  TIEBREAKER_SCHEMA_VERSION,
  type BracketType,
  type EntryPicksJson,
  type EntryTiebreakerJson,
  type PicksByGameId,
} from "@/lib/brackets/types";

const participantNameSchema = z
  .string({ required_error: "Participant name is required." })
  .trim()
  .min(1, "Participant name is required.")
  .max(120, "Participant name must be 120 characters or fewer.");

export const bracketTypeSchema = z.enum(BRACKET_TYPES, {
  required_error: "Bracket type is required.",
});

export const entryInputSchema = z.object({
  participantName: participantNameSchema,
  bracketType: bracketTypeSchema,
});

export const entryIdSchema = z
  .string({ required_error: "Entry id is required." })
  .trim()
  .min(1, "Entry id is required.");

export const entrySearchSchema = z
  .string()
  .trim()
  .max(120, "Search query is too long.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const entryTypeFilterSchema = bracketTypeSchema.optional();

export type EntryInput = z.infer<typeof entryInputSchema>;

export type EntryFieldErrors = Record<string, string[]>;

export type ParsedEntryFormData = {
  participantName: string;
  bracketType: BracketType;
  picksJson: EntryPicksJson;
  tiebreakerJson: EntryTiebreakerJson;
};

export type ParsedEntryFormResult =
  | { success: true; data: ParsedEntryFormData }
  | {
      success: false;
      message: string;
      fieldErrors: EntryFieldErrors;
    };

function addFieldError(
  fieldErrors: EntryFieldErrors,
  key: string,
  message: string,
) {
  const currentErrors = fieldErrors[key] ?? [];
  fieldErrors[key] = [...currentErrors, message];
}

function hasFieldErrors(fieldErrors: EntryFieldErrors): boolean {
  return Object.keys(fieldErrors).length > 0;
}

function parseIntegerScore(rawScore: string): number | null {
  if (!/^\d+$/.test(rawScore)) {
    return null;
  }

  const value = Number(rawScore);
  if (!Number.isInteger(value)) {
    return null;
  }

  return value;
}

function getChampionshipGameId(bracketType: BracketType): string {
  const championshipRound = getTemplateRoundConfigs(bracketType).find(
    (round) => round.key === "championship",
  );

  return championshipRound?.gameIds[0] ?? "CHAMPIONSHIP_G1";
}

export function getFormStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function buildEntryName(participantName: string, bracketType: BracketType) {
  const trimmedParticipantName = participantName.trim();
  return `${trimmedParticipantName}'s ${BRACKET_TYPE_NAME_SUFFIX[bracketType]}`;
}

export function getBracketTypeLabel(bracketType: BracketType) {
  return BRACKET_TYPE_LABELS[bracketType];
}

export function parseEntryFormData(
  formData: FormData,
  options?: {
    expectedBracketType?: BracketType;
    sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
  },
): ParsedEntryFormResult {
  const parsedInput = entryInputSchema.safeParse({
    participantName: getFormStringValue(formData, "participantName"),
    bracketType: getFormStringValue(formData, "bracketType"),
  });

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const { participantName, bracketType } = parsedInput.data;
  const fieldErrors: EntryFieldErrors = {};

  if (options?.expectedBracketType && options.expectedBracketType !== bracketType) {
    addFieldError(
      fieldErrors,
      "bracketType",
      "Bracket type cannot be changed for an existing entry.",
    );
  }

  const picksByGameId: PicksByGameId = {};

  for (const gameId of getTemplateGameIds(bracketType)) {
    const fieldKey = `pick.${gameId}`;
    const selectedWinnerTeamKey = getFormStringValue(formData, fieldKey).trim();
    const availableTeams = getAvailableTeamsForGame({
      bracketType,
      gameId,
      picksByGameId,
      sourceWinnerTeamKeyByGameId: options?.sourceWinnerTeamKeyByGameId,
    });

    if (availableTeams.length === 0) {
      if (selectedWinnerTeamKey.length > 0) {
        addFieldError(
          fieldErrors,
          fieldKey,
          "This game cannot be selected until upstream winners are chosen.",
        );
      }
      continue;
    }

    if (selectedWinnerTeamKey.length === 0) {
      addFieldError(fieldErrors, fieldKey, "Please select a winner.");
      continue;
    }

    const isValidSelection = availableTeams.some(
      (teamOption) => teamOption.key === selectedWinnerTeamKey,
    );

    if (!isValidSelection) {
      addFieldError(fieldErrors, fieldKey, "Invalid winner selection for this game.");
      continue;
    }

    picksByGameId[gameId] = { winnerTeamKey: selectedWinnerTeamKey };
  }

  const sanitizedPicks = sanitizePicksForTemplate({
    bracketType,
    picksByGameId,
    sourceWinnerTeamKeyByGameId: options?.sourceWinnerTeamKeyByGameId,
  });

  const picksJson: EntryPicksJson = {
    schemaVersion: PICKS_SCHEMA_VERSION,
    bracketType,
    picksByGameId: sanitizedPicks,
  };

  let tiebreakerJson: EntryTiebreakerJson = null;

  if (bracketType === "CHAMPIONSHIP") {
    const championshipGameId = getChampionshipGameId(bracketType);
    const championshipTeams = getAvailableTeamsForGame({
      bracketType,
      gameId: championshipGameId,
      picksByGameId: sanitizedPicks,
      sourceWinnerTeamKeyByGameId: options?.sourceWinnerTeamKeyByGameId,
    });

    if (championshipTeams.length !== 2) {
      addFieldError(
        fieldErrors,
        "bracketType",
        "Championship teams are not available yet. Update finalists before saving.",
      );
    } else {
      const predictedScoresByTeamKey: Record<string, number> = {};

      for (const teamOption of championshipTeams) {
        const scoreFieldKey = `score.${teamOption.key}`;
        const rawScore = getFormStringValue(formData, scoreFieldKey).trim();

        if (rawScore.length === 0) {
          addFieldError(fieldErrors, scoreFieldKey, "Please enter a predicted score.");
          continue;
        }

        const parsedScore = parseIntegerScore(rawScore);

        if (parsedScore === null) {
          addFieldError(fieldErrors, scoreFieldKey, "Score must be a whole number.");
          continue;
        }

        if (parsedScore < 0 || parsedScore > 250) {
          addFieldError(fieldErrors, scoreFieldKey, "Score must be between 0 and 250.");
          continue;
        }

        predictedScoresByTeamKey[teamOption.key] = parsedScore;
      }

      if (Object.keys(predictedScoresByTeamKey).length === championshipTeams.length) {
        tiebreakerJson = {
          schemaVersion: TIEBREAKER_SCHEMA_VERSION,
          championship: {
            championshipGameId,
            predictedScoresByTeamKey,
          },
        };
      }
    }
  }

  if (hasFieldErrors(fieldErrors)) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      participantName,
      bracketType,
      picksJson,
      tiebreakerJson,
    },
  };
}

export function getDefaultPicksJson(bracketType: BracketType): EntryPicksJson {
  return {
    schemaVersion: PICKS_SCHEMA_VERSION,
    bracketType,
    picksByGameId: {},
  };
}

export function getTemplateSummaryText(bracketType: BracketType): string {
  const template = getBracketTemplate(bracketType);
  return template.description;
}
