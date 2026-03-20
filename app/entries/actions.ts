"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EntryFormState } from "@/app/entries/action-state";
import { prisma } from "@/lib/prisma";
import {
  buildEntryName,
  entryIdSchema,
  entrySearchSchema,
  entryTypeFilterSchema,
  getFormStringValue,
  parseEntryFormData,
} from "@/lib/entries/validation";

function buildEntriesPath(options?: {
  query?: string;
  bracketType?: string;
  notice?: "created" | "updated" | "deleted";
  error?: "invalid_entry" | "entry_not_found" | "delete_failed";
}) {
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.bracketType) {
    params.set("type", options.bracketType);
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
  const parsedFormData = parseEntryFormData(formData);

  if (!parsedFormData.success) {
    return {
      message: parsedFormData.message,
      fieldErrors: parsedFormData.fieldErrors,
    };
  }

  try {
    const tiebreakerJsonValue =
      parsedFormData.data.tiebreakerJson === null
        ? Prisma.DbNull
        : parsedFormData.data.tiebreakerJson;

    await prisma.entry.create({
      data: {
        participantName: parsedFormData.data.participantName,
        bracketType: parsedFormData.data.bracketType,
        name: buildEntryName(
          parsedFormData.data.participantName,
          parsedFormData.data.bracketType,
        ),
        picksJson: parsedFormData.data.picksJson,
        tiebreakerJson: tiebreakerJsonValue,
      },
    });
  } catch {
    return {
      message: "Unable to create the entry right now. Please try again.",
    };
  }

  revalidateEntryPaths();
  redirect(
    buildEntriesPath({
      notice: "created",
      bracketType: parsedFormData.data.bracketType,
    }),
  );
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

  const existingEntry = await prisma.entry.findUnique({
    where: { id: parsedEntryId.data },
    select: { bracketType: true },
  });

  if (!existingEntry) {
    return {
      message: "That entry no longer exists.",
    };
  }

  const parsedFormData = parseEntryFormData(formData, {
    expectedBracketType: existingEntry.bracketType,
  });

  if (!parsedFormData.success) {
    return {
      message: parsedFormData.message,
      fieldErrors: parsedFormData.fieldErrors,
    };
  }

  try {
    const tiebreakerJsonValue =
      parsedFormData.data.tiebreakerJson === null
        ? Prisma.DbNull
        : parsedFormData.data.tiebreakerJson;

    await prisma.entry.update({
      where: { id: parsedEntryId.data },
      data: {
        participantName: parsedFormData.data.participantName,
        bracketType: parsedFormData.data.bracketType,
        name: buildEntryName(
          parsedFormData.data.participantName,
          parsedFormData.data.bracketType,
        ),
        picksJson: parsedFormData.data.picksJson,
        tiebreakerJson: tiebreakerJsonValue,
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
  redirect(
    buildEntriesPath({
      notice: "updated",
      bracketType: parsedFormData.data.bracketType,
    }),
  );
}

export async function deleteEntryAction(formData: FormData) {
  const parsedEntryId = entryIdSchema.safeParse(getFormStringValue(formData, "id"));
  const parsedQuery = entrySearchSchema.safeParse(getFormStringValue(formData, "q"));
  const parsedBracketType = entryTypeFilterSchema.safeParse(
    getFormStringValue(formData, "type"),
  );
  const query = parsedQuery.success ? parsedQuery.data : undefined;
  const bracketType = parsedBracketType.success ? parsedBracketType.data : undefined;

  if (!parsedEntryId.success) {
    redirect(buildEntriesPath({ query, bracketType, error: "invalid_entry" }));
  }

  try {
    await prisma.entry.delete({
      where: { id: parsedEntryId.data },
    });
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      redirect(buildEntriesPath({ query, bracketType, error: "entry_not_found" }));
    }

    redirect(buildEntriesPath({ query, bracketType, error: "delete_failed" }));
  }

  revalidateEntryPaths(parsedEntryId.data);
  redirect(buildEntriesPath({ query, bracketType, notice: "deleted" }));
}
