import type { GameResultStatus } from "@/lib/results/status";

export type SavedGameResultValues = {
  gameId: string;
  status: GameResultStatus;
  winnerTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type AdminResultFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors?: Record<string, string[]>;
  savedValues?: SavedGameResultValues;
};

export const INITIAL_ADMIN_RESULT_FORM_STATE: AdminResultFormState = {
  status: "idle",
  message: null,
};
