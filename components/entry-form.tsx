"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  INITIAL_ENTRY_FORM_STATE,
  type EntryFormState,
} from "@/app/entries/action-state";
import { BracketEditor } from "@/components/bracket-editor";
import {
  BRACKET_TYPES,
  BRACKET_TYPE_LABELS,
  type BracketType,
  type PicksByGameId,
} from "@/lib/brackets/types";
import type { WinnerTeamKeyByGameId } from "@/lib/brackets/registry";

type EntryFormAction = (
  previousState: EntryFormState,
  formData: FormData,
) => Promise<EntryFormState>;

export function EntryForm({
  mode,
  submitAction,
  entryId,
  defaultParticipantName = "",
  defaultBracketType = "MAIN",
  defaultPicksByGameId = {},
  defaultScoresByTeamKey = {},
  teamLabelOverridesByKey = {},
  sourceWinnerTeamKeyByGameId = {},
}: {
  mode: "create" | "edit";
  submitAction: EntryFormAction;
  entryId?: string;
  defaultParticipantName?: string;
  defaultBracketType?: BracketType;
  defaultPicksByGameId?: PicksByGameId;
  defaultScoresByTeamKey?: Record<string, number>;
  teamLabelOverridesByKey?: Record<string, string>;
  sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
}) {
  const [state, formAction, isPending] = useActionState(
    submitAction,
    INITIAL_ENTRY_FORM_STATE,
  );

  const [selectedBracketType, setSelectedBracketType] = useState<BracketType>(
    defaultBracketType,
  );

  const submitLabel = mode === "create" ? "Create Entry" : "Save Changes";
  const participantNameError = state.fieldErrors?.participantName?.[0];
  const bracketTypeError = state.fieldErrors?.bracketType?.[0];
  const isCreateMode = mode === "create";

  const editorInitialPicks = useMemo(
    () => (isCreateMode ? {} : defaultPicksByGameId),
    [defaultPicksByGameId, isCreateMode],
  );

  const editorInitialScores = useMemo(
    () => (isCreateMode ? {} : defaultScoresByTeamKey),
    [defaultScoresByTeamKey, isCreateMode],
  );

  return (
    <form action={formAction} className="space-y-6 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
      {entryId ? <input type="hidden" name="id" value={entryId} /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="participant-name" className="mb-1 block text-sm font-medium">
            Participant name
          </label>
          <input
            id="participant-name"
            name="participantName"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={defaultParticipantName}
            required
            aria-invalid={participantNameError ? "true" : "false"}
            aria-describedby={participantNameError ? "participant-name-error" : undefined}
          />
          {participantNameError ? (
            <p id="participant-name-error" className="mt-1 text-sm text-red-700">
              {participantNameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="bracket-type" className="mb-1 block text-sm font-medium">
            Bracket type
          </label>

          {isCreateMode ? (
            <select
              id="bracket-type"
              name="bracketType"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={selectedBracketType}
              onChange={(event) => setSelectedBracketType(event.target.value as BracketType)}
              aria-invalid={bracketTypeError ? "true" : "false"}
              aria-describedby={bracketTypeError ? "bracket-type-error" : undefined}
            >
              {BRACKET_TYPES.map((bracketType) => (
                <option key={bracketType} value={bracketType}>
                  {BRACKET_TYPE_LABELS[bracketType]}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="bracketType" value={selectedBracketType} />
              <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                {BRACKET_TYPE_LABELS[selectedBracketType]}
              </div>
            </>
          )}

          {bracketTypeError ? (
            <p id="bracket-type-error" className="mt-1 text-sm text-red-700">
              {bracketTypeError}
            </p>
          ) : null}

          <p className="mt-1 text-xs text-slate-500">
            Entry name is generated automatically from participant name and bracket type.
          </p>
        </div>
      </div>

      <BracketEditor
        key={`${selectedBracketType}-${mode}`}
        mode="edit"
        bracketType={selectedBracketType}
        initialPicksByGameId={editorInitialPicks}
        initialScoresByTeamKey={editorInitialScores}
        fieldErrors={state.fieldErrors}
        teamLabelOverridesByKey={teamLabelOverridesByKey}
        sourceWinnerTeamKeyByGameId={sourceWinnerTeamKeyByGameId}
      />

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
          disabled={isPending}
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
        <Link href="/entries" className="text-sm font-medium text-slate-700">
          Cancel
        </Link>
      </div>
    </form>
  );
}
