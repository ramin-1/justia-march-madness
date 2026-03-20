"use client";

import { useActionState, useState } from "react";
import {
  INITIAL_ADMIN_RESULT_FORM_STATE,
  type AdminResultFormState,
} from "@/app/admin/results/action-state";
import { GAME_RESULT_STATUSES, type GameResultStatus } from "@/lib/results/status";

const GAME_STATUS_LABELS: Record<GameResultStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  final: "Final",
};

type TeamOption = {
  key: string;
  label: string;
};

type ResultUpdateAction = (
  previousState: AdminResultFormState,
  formData: FormData,
) => Promise<AdminResultFormState>;

function formatScoreValue(score: number | null): string {
  return typeof score === "number" ? String(score) : "";
}

export function AdminResultGameCard({
  gameId,
  slotLabel,
  region,
  currentStatus,
  winnerTeamKey,
  homeScore,
  awayScore,
  homeScoreLabel,
  awayScoreLabel,
  participantOptions,
  submitAction,
}: {
  gameId: string;
  slotLabel: string;
  region: string | null;
  currentStatus: GameResultStatus;
  winnerTeamKey: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreLabel: string;
  awayScoreLabel: string;
  participantOptions: TeamOption[];
  submitAction: ResultUpdateAction;
}) {
  const [state, formAction, isPending] = useActionState(
    submitAction,
    INITIAL_ADMIN_RESULT_FORM_STATE,
  );
  const [selectedStatus, setSelectedStatus] = useState<GameResultStatus>(currentStatus);
  const [selectedWinnerTeamKey, setSelectedWinnerTeamKey] = useState(winnerTeamKey ?? "");
  const [homeScoreInput, setHomeScoreInput] = useState(formatScoreValue(homeScore));
  const [awayScoreInput, setAwayScoreInput] = useState(formatScoreValue(awayScore));
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  const savedValuesForCard =
    state.status === "success" && state.savedValues?.gameId === gameId ? state.savedValues : null;
  const shouldUseSavedValues = !hasLocalEdits && !isPending && Boolean(savedValuesForCard);
  const displayedStatus =
    shouldUseSavedValues && savedValuesForCard ? savedValuesForCard.status : selectedStatus;
  const displayedWinnerTeamKey =
    shouldUseSavedValues && savedValuesForCard
      ? (savedValuesForCard.winnerTeamKey ?? "")
      : selectedWinnerTeamKey;
  const displayedHomeScore =
    shouldUseSavedValues && savedValuesForCard
      ? formatScoreValue(savedValuesForCard.homeScore)
      : homeScoreInput;
  const displayedAwayScore =
    shouldUseSavedValues && savedValuesForCard
      ? formatScoreValue(savedValuesForCard.awayScore)
      : awayScoreInput;

  const statusError = state.fieldErrors?.status?.[0];
  const winnerError = state.fieldErrors?.winnerTeamKey?.[0];
  const homeScoreError = state.fieldErrors?.homeScore?.[0];
  const awayScoreError = state.fieldErrors?.awayScore?.[0];

  function onStatusChange(nextStatus: GameResultStatus) {
    setHasLocalEdits(true);
    setSelectedStatus(nextStatus);

    if (nextStatus !== "final") {
      setSelectedWinnerTeamKey("");
      setHomeScoreInput("");
      setAwayScoreInput("");
    }
  }

  function submitWithSync(formData: FormData) {
    setHasLocalEdits(false);
    formAction(formData);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 space-y-1">
        <h4 className="font-medium text-slate-900">{slotLabel}</h4>
        <p className="text-xs text-slate-500">
          {region ? `${region} • ` : ""}
          {gameId}
        </p>
      </div>

      <form action={submitWithSync} className="space-y-3">
        <input type="hidden" name="gameId" value={gameId} />

        <div>
          <label htmlFor={`${gameId}-status`} className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id={`${gameId}-status`}
            name="status"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={displayedStatus}
            onChange={(event) => onStatusChange(event.target.value as GameResultStatus)}
            aria-invalid={statusError ? "true" : "false"}
          >
            {GAME_RESULT_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {GAME_STATUS_LABELS[statusOption]}
              </option>
            ))}
          </select>
          {statusError ? <p className="mt-1 text-xs text-red-700">{statusError}</p> : null}
        </div>

        <div>
          <label
            htmlFor={`${gameId}-winner`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Winner team key
          </label>
          <select
            id={`${gameId}-winner`}
            name="winnerTeamKey"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={displayedWinnerTeamKey}
            onChange={(event) => {
              setHasLocalEdits(true);
              setSelectedWinnerTeamKey(event.target.value);
            }}
            aria-invalid={winnerError ? "true" : "false"}
          >
            <option value="">Not selected</option>
            {participantOptions.map((teamOption) => (
              <option key={teamOption.key} value={teamOption.key}>
                {teamOption.label} ({teamOption.key})
              </option>
            ))}
          </select>
          {winnerError ? <p className="mt-1 text-xs text-red-700">{winnerError}</p> : null}
          {participantOptions.length === 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              Participants are unavailable until upstream games are final.
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${gameId}-home-score`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {homeScoreLabel}
            </label>
            <input
              id={`${gameId}-home-score`}
              name="homeScore"
              type="number"
              min={0}
              step={1}
              value={displayedHomeScore}
              onChange={(event) => {
                setHasLocalEdits(true);
                setHomeScoreInput(event.target.value);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-invalid={homeScoreError ? "true" : "false"}
            />
            {homeScoreError ? <p className="mt-1 text-xs text-red-700">{homeScoreError}</p> : null}
          </div>

          <div>
            <label
              htmlFor={`${gameId}-away-score`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {awayScoreLabel}
            </label>
            <input
              id={`${gameId}-away-score`}
              name="awayScore"
              type="number"
              min={0}
              step={1}
              value={displayedAwayScore}
              onChange={(event) => {
                setHasLocalEdits(true);
                setAwayScoreInput(event.target.value);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-invalid={awayScoreError ? "true" : "false"}
            />
            {awayScoreError ? <p className="mt-1 text-xs text-red-700">{awayScoreError}</p> : null}
          </div>
        </div>

        {state.message ? (
          <p
            className={`rounded-md px-3 py-2 text-xs ${
              state.status === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-70"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Result"}
        </button>
      </form>
    </article>
  );
}
