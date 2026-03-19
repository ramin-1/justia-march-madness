"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  INITIAL_ENTRY_FORM_STATE,
  type EntryFormState,
} from "@/app/entries/action-state";

type EntryFormAction = (
  previousState: EntryFormState,
  formData: FormData,
) => Promise<EntryFormState>;

export function EntryForm({
  mode,
  submitAction,
  entryId,
  defaultParticipantName = "",
}: {
  mode: "create" | "edit";
  submitAction: EntryFormAction;
  entryId?: string;
  defaultParticipantName?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    submitAction,
    INITIAL_ENTRY_FORM_STATE,
  );

  const submitLabel = mode === "create" ? "Create Entry" : "Save Changes";
  const participantNameError = state.fieldErrors?.participantName?.[0];

  return (
    <form action={formAction} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      {entryId ? <input type="hidden" name="id" value={entryId} /> : null}

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
        <p className="mt-1 text-xs text-slate-500">
          Entry name is generated automatically from participant name (for example:
          {" "}
          <span className="font-medium">&quot;Colin Murphy&apos;s Bracket&quot;</span>).
        </p>
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
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
