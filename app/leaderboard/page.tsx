import Link from "next/link";
import { ScaffoldPage } from "@/components/scaffold-page";

const exampleEntries = [
  { id: "demo-1", rank: 1, name: "Marketing Mayhem", participant: "Jordan", score: 24 },
  { id: "demo-2", rank: 2, name: "Finance Full Court", participant: "Taylor", score: 18 },
];

export default function LeaderboardPage() {
  return (
    <ScaffoldPage
      title="Leaderboard"
      description="Public standings scaffold. Entry names link to read-only bracket placeholders."
      surface="public"
    >
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Entry</th>
              <th className="px-4 py-3 font-semibold">Participant</th>
              <th className="px-4 py-3 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exampleEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">{entry.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/bracket/${entry.id}`} className="font-medium">
                    {entry.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{entry.participant}</td>
                <td className="px-4 py-3">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScaffoldPage>
  );
}
