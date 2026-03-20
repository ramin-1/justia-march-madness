import Link from "next/link";
import {
  LEADERBOARD_VIEW_CONFIGS,
  buildChampionshipLeaderboardRows,
  buildMainLeaderboardRows,
  buildSecondChanceLeaderboardRows,
  getLeaderboardTabData,
  getLeaderboardTypeDescription,
  parseLeaderboardViewKey,
} from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { createGameResultsIndex, type GameResultRow } from "@/lib/scoring";
import { SCORE_GAME_RESULT_SELECT } from "@/lib/standings";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

type LeaderboardPageProps = {
  searchParams: Promise<{
    type?: string | string[];
  }>;
};

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const viewKey = parseLeaderboardViewKey(getSingleSearchParam(params.type));
  const viewConfig = LEADERBOARD_VIEW_CONFIGS[viewKey];
  const tabData = getLeaderboardTabData(viewKey);

  const [entries, games] = await Promise.all([
    prisma.entry.findMany({
      where: { bracketType: viewConfig.bracketType },
      select: {
        id: true,
        name: true,
        participantName: true,
        bracketType: true,
        picksJson: true,
        tiebreakerJson: true,
      },
    }),
    prisma.game.findMany({
      select: SCORE_GAME_RESULT_SELECT,
    }),
  ]);

  const gameResultsById = createGameResultsIndex(games as GameResultRow[]);
  const description = getLeaderboardTypeDescription(viewKey);

  return (
    <PageShell title="Leaderboard" description={description}>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabData.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab.isActive
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {viewKey === "main" ? (
        <MainLeaderboardTable
          rows={buildMainLeaderboardRows({
            entries,
            gameResultsById,
          })}
        />
      ) : null}

      {viewKey === "second-chance" ? (
        <SecondChanceLeaderboardTable
          rows={buildSecondChanceLeaderboardRows({
            entries,
            gameResultsById,
          })}
        />
      ) : null}

      {viewKey === "championship" ? (
        <ChampionshipLeaderboardTable
          {...buildChampionshipLeaderboardRows({
            entries,
            gameResultsById,
          })}
        />
      ) : null}
    </PageShell>
  );
}

function MainLeaderboardTable({
  rows,
}: {
  rows: ReturnType<typeof buildMainLeaderboardRows>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Rank</th>
            <th className="px-4 py-3 font-semibold">Entry</th>
            <th className="px-4 py-3 font-semibold">Participant</th>
            <th className="px-4 py-3 font-semibold">Score</th>
            <th className="px-4 py-3 font-semibold">Correct Picks</th>
            <th className="px-4 py-3 font-semibold">Max Possible</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-600">
                No main bracket entries yet.
              </td>
            </tr>
          ) : (
            rows.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">{entry.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/bracket/${entry.id}`} className="font-medium text-slate-900 hover:underline">
                    {entry.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{entry.participantName}</td>
                <td className="px-4 py-3">{entry.score}</td>
                <td className="px-4 py-3">{entry.correctPicks}</td>
                <td className="px-4 py-3">{entry.maxPossibleScore}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SecondChanceLeaderboardTable({
  rows,
}: {
  rows: ReturnType<typeof buildSecondChanceLeaderboardRows>;
}) {
  return (
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                No second chance entries yet.
              </td>
            </tr>
          ) : (
            rows.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">{entry.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/bracket/${entry.id}`} className="font-medium text-slate-900 hover:underline">
                    {entry.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{entry.participantName}</td>
                <td className="px-4 py-3">{entry.score}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ChampionshipLeaderboardTable({
  rows,
  isChampionshipResolved,
}: ReturnType<typeof buildChampionshipLeaderboardRows>) {
  return (
    <div className="space-y-3">
      {!isChampionshipResolved ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Championship game result is unresolved. Rankings are provisional until final winner and scores
          are available.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Rank</th>
              <th className="px-4 py-3 font-semibold">Entry</th>
              <th className="px-4 py-3 font-semibold">Participant</th>
              <th className="px-4 py-3 font-semibold">Picked Winner</th>
              <th className="px-4 py-3 font-semibold">Predicted Final Score</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
                  No championship entries yet.
                </td>
              </tr>
            ) : (
              rows.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <Link href={`/bracket/${entry.id}`} className="font-medium text-slate-900 hover:underline">
                      {entry.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{entry.participantName}</td>
                  <td className="px-4 py-3">{entry.pickedWinnerLabel}</td>
                  <td className="px-4 py-3">{entry.predictedFinalScore}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
