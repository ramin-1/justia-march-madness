import { z } from "zod";
import {
  GAME_RESULT_STATUSES,
  isFinalGameResultStatus,
  type GameResultStatus,
} from "@/lib/results/status";

export const gameResultStatusSchema = z.enum(GAME_RESULT_STATUSES, {
  required_error: "Status is required.",
});

const gameResultUpdateInputSchema = z.object({
  gameId: z
    .string({ required_error: "Game id is required." })
    .trim()
    .min(1, "Game id is required."),
  status: gameResultStatusSchema,
  winnerTeamKey: z.string().trim().optional(),
  homeScore: z.string().trim().optional(),
  awayScore: z.string().trim().optional(),
});

type ResultFieldErrors = Record<string, string[]>;

export type ParsedGameResultUpdateData = {
  gameId: string;
  status: GameResultStatus;
  winnerTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type ParsedGameResultUpdateResult =
  | {
      success: true;
      data: ParsedGameResultUpdateData;
    }
  | {
      success: false;
      message: string;
      fieldErrors: ResultFieldErrors;
    };

function getFormStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function addFieldError(fieldErrors: ResultFieldErrors, key: string, message: string) {
  fieldErrors[key] = [...(fieldErrors[key] ?? []), message];
}

function parseOptionalScore(rawScore: string): number | null {
  if (rawScore.length === 0) {
    return null;
  }

  if (!/^\d+$/.test(rawScore)) {
    return Number.NaN;
  }

  const parsedValue = Number(rawScore);
  return Number.isSafeInteger(parsedValue) ? parsedValue : Number.NaN;
}

export function parseGameResultUpdateFormData(
  formData: FormData,
  options: {
    participantTeamKeys: string[];
    homeTeamKey: string | null;
    awayTeamKey: string | null;
  },
): ParsedGameResultUpdateResult {
  const parsedInput = gameResultUpdateInputSchema.safeParse({
    gameId: getFormStringValue(formData, "gameId"),
    status: getFormStringValue(formData, "status"),
    winnerTeamKey: getFormStringValue(formData, "winnerTeamKey"),
    homeScore: getFormStringValue(formData, "homeScore"),
    awayScore: getFormStringValue(formData, "awayScore"),
  });

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const fieldErrors: ResultFieldErrors = {};
  const isFinal = isFinalGameResultStatus(parsedInput.data.status);
  const winnerTeamKey = parsedInput.data.winnerTeamKey?.trim() ?? "";
  const parsedHomeScore = parseOptionalScore(parsedInput.data.homeScore ?? "");
  const parsedAwayScore = parseOptionalScore(parsedInput.data.awayScore ?? "");

  if (Number.isNaN(parsedHomeScore)) {
    addFieldError(fieldErrors, "homeScore", "Home score must be a whole number.");
  }

  if (Number.isNaN(parsedAwayScore)) {
    addFieldError(fieldErrors, "awayScore", "Away score must be a whole number.");
  }

  const homeScore = Number.isNaN(parsedHomeScore) ? null : parsedHomeScore;
  const awayScore = Number.isNaN(parsedAwayScore) ? null : parsedAwayScore;

  if (homeScore !== null && homeScore < 0) {
    addFieldError(fieldErrors, "homeScore", "Home score must be 0 or greater.");
  }

  if (awayScore !== null && awayScore < 0) {
    addFieldError(fieldErrors, "awayScore", "Away score must be 0 or greater.");
  }

  if (isFinal) {
    if (options.participantTeamKeys.length < 2) {
      addFieldError(
        fieldErrors,
        "winnerTeamKey",
        "Finalize upstream games first so both participant team keys are available.",
      );
    }

    if (winnerTeamKey.length === 0) {
      addFieldError(fieldErrors, "winnerTeamKey", "Winner team is required for a final result.");
    } else if (!options.participantTeamKeys.includes(winnerTeamKey)) {
      addFieldError(
        fieldErrors,
        "winnerTeamKey",
        "Winner must match one of the participating team keys for this game.",
      );
    }

    if (homeScore === null) {
      addFieldError(fieldErrors, "homeScore", "Home score is required for a final result.");
    }

    if (awayScore === null) {
      addFieldError(fieldErrors, "awayScore", "Away score is required for a final result.");
    }

    if (homeScore !== null && awayScore !== null && homeScore === awayScore) {
      addFieldError(fieldErrors, "homeScore", "Final scores cannot be tied.");
      addFieldError(fieldErrors, "awayScore", "Final scores cannot be tied.");
    }

    if (
      homeScore !== null &&
      awayScore !== null &&
      winnerTeamKey.length > 0 &&
      options.homeTeamKey &&
      options.awayTeamKey
    ) {
      if (winnerTeamKey === options.homeTeamKey && homeScore < awayScore) {
        addFieldError(
          fieldErrors,
          "winnerTeamKey",
          "Winner selection conflicts with scores (home score is lower).",
        );
      }

      if (winnerTeamKey === options.awayTeamKey && awayScore < homeScore) {
        addFieldError(
          fieldErrors,
          "winnerTeamKey",
          "Winner selection conflicts with scores (away score is lower).",
        );
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  if (!isFinal) {
    return {
      success: true,
      data: {
        gameId: parsedInput.data.gameId,
        status: parsedInput.data.status,
        winnerTeamKey: null,
        homeScore: null,
        awayScore: null,
      },
    };
  }

  return {
    success: true,
    data: {
      gameId: parsedInput.data.gameId,
      status: parsedInput.data.status,
      winnerTeamKey,
      homeScore,
      awayScore,
    },
  };
}
