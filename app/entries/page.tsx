import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { PageShell } from "@/components/page-shell";
import { BRACKET_TYPES, BRACKET_TYPE_LABELS } from "@/lib/brackets/types";
import { entrySearchSchema, entryTypeFilterSchema } from "@/lib/entries/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const noticeMessages = {
  created: "Entry created successfully.",
  updated: "Entry updated successfully.",
  deleted: "Entry deleted successfully.",
} as const;

const errorMessages = {
  invalid_entry: "Unable to delete entry because the entry id was invalid.",
  entry_not_found: "That entry no longer exists.",
  delete_failed: "Unable to delete the entry right now. Please try again.",
} as const;

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

type EntriesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    type?: string | string[];
    notice?: string | string[];
    error?: string | string[];
  }>;
};

export default async function EntriesPage({ searchParams }: EntriesPageProps) {
  const params = await searchParams;
  const rawQuery = getSingleSearchParam(params.q);
  const rawBracketType = getSingleSearchParam(params.type);
  const parsedQuery = entrySearchSchema.safeParse(rawQuery);
  const parsedBracketType = entryTypeFilterSchema.safeParse(rawBracketType);
  const query = parsedQuery.success ? parsedQuery.data : undefined;
  const bracketType = parsedBracketType.success ? parsedBracketType.data : undefined;
  const noticeKey = getSingleSearchParam(params.notice);
  const errorKey = getSingleSearchParam(params.error);
  const noticeMessage =
    noticeKey && noticeKey in noticeMessages
      ? noticeMessages[noticeKey as keyof typeof noticeMessages]
      : null;
  const errorMessage =
    errorKey && errorKey in errorMessages
      ? errorMessages[errorKey as keyof typeof errorMessages]
      : null;

  const textSearchFilters: Prisma.EntryWhereInput[] | undefined = query
    ? [
        { name: { contains: query, mode: "insensitive" } },
        { participantName: { contains: query, mode: "insensitive" } },
      ]
    : undefined;

  const whereClause =
    textSearchFilters && bracketType
      ? {
          bracketType,
          OR: textSearchFilters,
        }
      : textSearchFilters
        ? {
            OR: textSearchFilters,
          }
        : bracketType
          ? { bracketType }
          : undefined;

  const entries = await prisma.entry.findMany({
    where: whereClause,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      participantName: true,
      bracketType: true,
      totalScore: true,
      updatedAt: true,
    },
  });

  return (
    <PageShell
      title="Entries"
      description="Manage bracket entries. Search, add, edit, and delete entries from this admin page."
    >
      <div className="mb-4 flex flex-col items-stretch gap-3 xl:flex-row xl:items-end xl:justify-between">
        <form className="grid w-full max-w-2xl gap-3 md:grid-cols-2" method="GET">
          <div>
            <label htmlFor="entry-search" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="entry-search"
              name="q"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Entry or participant name"
              defaultValue={query ?? ""}
            />
          </div>

          <div>
            <label htmlFor="entry-type" className="mb-1 block text-sm font-medium text-slate-700">
              Bracket type
            </label>
            <select
              id="entry-type"
              name="type"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue={bracketType ?? ""}
            >
              <option value="">All bracket types</option>
              {BRACKET_TYPES.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {BRACKET_TYPE_LABELS[typeOption]}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <Link
          href="/entries/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Bracket
        </Link>
      </div>

      {noticeMessage ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {noticeMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Entry</th>
                <th className="px-4 py-3 font-semibold">Participant</th>
                <th className="px-4 py-3 font-semibold">Bracket Type</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-600">
                    {query
                      ? `No entries found for "${query}".`
                      : "No entries yet. Add your first bracket entry."}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">
                      <Link href={`/bracket/${entry.id}`} className="font-medium">
                        {entry.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{entry.participantName}</td>
                    <td className="px-4 py-3">{BRACKET_TYPE_LABELS[entry.bracketType]}</td>
                    <td className="px-4 py-3">{entry.totalScore}</td>
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(entry.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/bracket/${entry.id}`}>View</Link>
                        <Link href={`/entries/${entry.id}/edit`}>Edit</Link>
                        <DeleteEntryButton
                          entryId={entry.id}
                          entryName={entry.name}
                          query={query}
                          bracketType={bracketType}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
