import { ScaffoldPage } from "@/components/scaffold-page";

const exampleGames = [
  { id: "EAST_R1_G1", label: "East Round 1 Game 1", teams: ["Team A", "Team B"], status: "pending" },
  { id: "FINAL4_G1", label: "Final Four 1", teams: ["Team C", "Team D"], status: "resolved" },
];

export default function AdminResultsPage() {
  return (
    <ScaffoldPage
      title="Results"
      description="Admin results management scaffold route."
      surface="admin"
    >
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">NCAA Sync</h2>
            <p className="text-sm text-slate-600">
              Last synced: not yet implemented
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            disabled
          >
            Run Sync
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {exampleGames.map((game) => (
          <div key={game.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{game.label}</h3>
                <p className="text-xs text-slate-500">{game.id}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {game.status}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {game.teams.map((team) => (
                <label key={team} className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="radio" name={game.id} disabled />
                  <span>{team}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScaffoldPage>
  );
}
