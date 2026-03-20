export const GAME_RESULT_STATUSES = [
  "pending",
  "in_progress",
  "final",
] as const;

export type GameResultStatus = (typeof GAME_RESULT_STATUSES)[number];

const LEGACY_FINAL_STATUS = "resolved";
const GAME_RESULT_STATUS_SET = new Set<string>(GAME_RESULT_STATUSES);

export function normalizeGameResultStatus(status: string | null | undefined): GameResultStatus {
  const normalizedStatus = status?.trim().toLowerCase();

  if (!normalizedStatus) {
    return "pending";
  }

  if (normalizedStatus === LEGACY_FINAL_STATUS) {
    return "final";
  }

  if (GAME_RESULT_STATUS_SET.has(normalizedStatus)) {
    return normalizedStatus as GameResultStatus;
  }

  return "pending";
}

export function isFinalGameResultStatus(status: string | null | undefined): boolean {
  return normalizeGameResultStatus(status) === "final";
}

