import Link from "next/link";
import { PageShell } from "@/components/page-shell";

const exampleEntries = [
  { id: "demo-1", name: "Marketing Mayhem", participant: "Jordan", score: 24 },
  { id: "demo-2", name: "Finance Full Court", participant: "Taylor", score: 18 },
];

export default function EntriesPage() {
  return (
    <PageShell
      title="Entries"
      description="Admin list view for bracket entries. This route should be protected by authentication."
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="max-w-sm">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search entries"
          />
        </div>
        <Link
          href="/entries/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Bracket
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Entry</th>
              <th className="px-4 py-3 font-semibold">Participant</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exampleEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <Link href={`/bracket/${entry.id}`} className="font-medium">
                    {entry.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{entry.participant}</td>
                <td className="px-4 py-3">{entry.score}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/entries/${entry.id}/edit`}>Edit</Link>
                    <button type="button" className="text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
