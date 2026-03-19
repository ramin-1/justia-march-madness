"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EntryFormState } from "@/app/entries/action-state";
import { prisma } from "@/lib/prisma";
import {
  entryIdSchema,
  entryInputSchema,
  entrySearchSchema,
  getFormStringValue,
} from "@/lib/entries/validation";

function buildEntriesPath(options?: {
  query?: string;
  notice?: "created" | "updated" | "deleted";
  error?: "invalid_entry" | "entry_not_found" | "delete_failed";
}) {
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.notice) {
    params.set("notice", options.notice);
  }

  if (options?.error) {
    params.set("error", options.error);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/entries?${queryString}` : "/entries";
}

function isPrismaRecordNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function revalidateEntryPaths(entryId?: string) {
  revalidatePath("/entries");
  revalidatePath("/entries/new");

  if (entryId) {
    revalidatePath(`/entries/${entryId}/edit`);
    revalidatePath(`/bracket/${entryId}`);
  }
}

export async function createEntryAction(
  _previousState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const parsedInput = entryInputSchema.safeParse({
    name: getFormStringValue(formData, "name"),
    participantName: getFormStringValue(formData, "participantName"),
  });

  if (!parsedInput.success) {
    return {
      message: "Please correct the highlighted fields.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.entry.create({
      data: {
        name: parsedInput.data.name,
        participantName: parsedInput.data.participantName,
        picksJson: {},
      },
    });
  } catch {
    return {
      message: "Unable to create the entry right now. Please try again.",
    };
  }

  revalidateEntryPaths();
  redirect(buildEntriesPath({ notice: "created" }));
}

export async function updateEntryAction(
  _previousState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const parsedEntryId = entryIdSchema.safeParse(getFormStringValue(formData, "id"));

  if (!parsedEntryId.success) {
    return {
      message: "Unable to update entry because the entry id is invalid.",
    };
  }

  const parsedInput = entryInputSchema.safeParse({
    name: getFormStringValue(formData, "name"),
    participantName: getFormStringValue(formData, "participantName"),
  });

  if (!parsedInput.success) {
    return {
      message: "Please correct the highlighted fields.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.entry.update({
      where: { id: parsedEntryId.data },
      data: {
        name: parsedInput.data.name,
        participantName: parsedInput.data.participantName,
      },
    });
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      return {
        message: "That entry no longer exists.",
      };
    }

    return {
      message: "Unable to update the entry right now. Please try again.",
    };
  }

  revalidateEntryPaths(parsedEntryId.data);
  redirect(buildEntriesPath({ notice: "updated" }));
}

export async function deleteEntryAction(formData: FormData) {
  const parsedEntryId = entryIdSchema.safeParse(getFormStringValue(formData, "id"));
  const parsedQuery = entrySearchSchema.safeParse(getFormStringValue(formData, "q"));
  const query = parsedQuery.success ? parsedQuery.data : undefined;

  if (!parsedEntryId.success) {
    redirect(buildEntriesPath({ query, error: "invalid_entry" }));
  }

  try {
    await prisma.entry.delete({
      where: { id: parsedEntryId.data },
    });
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      redirect(buildEntriesPath({ query, error: "entry_not_found" }));
    }

    redirect(buildEntriesPath({ query, error: "delete_failed" }));
  }

  revalidateEntryPaths(parsedEntryId.data);
  redirect(buildEntriesPath({ query, notice: "deleted" }));
}
