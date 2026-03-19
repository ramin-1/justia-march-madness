"use client";

import type { FormEvent } from "react";
import { deleteEntryAction } from "@/app/entries/actions";

export function DeleteEntryButton({
  entryId,
  entryName,
  query,
}: {
  entryId: string;
  entryName: string;
  query?: string;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const isConfirmed = window.confirm(
      `Delete "${entryName}"? This action cannot be undone.`,
    );

    if (!isConfirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteEntryAction} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={entryId} />
      {query ? <input type="hidden" name="q" value={query} /> : null}
      <button type="submit" className="text-red-700 hover:text-red-800">
        Delete
      </button>
    </form>
  );
}
