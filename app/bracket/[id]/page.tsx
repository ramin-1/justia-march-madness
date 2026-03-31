import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BracketEditor } from "@/components/bracket-editor";
import { PrintBracketButton } from "@/components/print-bracket-button";
import { BRACKET_TYPE_LABELS } from "@/lib/brackets/types";
import { PageShell } from "@/components/page-shell";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
import { getTeamLabelOverridesByKey } from "@/lib/brackets/team-labels";
import { prisma } from "@/lib/prisma";
import {
  buildFinalWinnerTeamKeyByGameId,
  createGameResultsIndex,
  scoreMainBracketEntry,
  scoreSecondChanceEntry,
  type GameResultRow,
} from "@/lib/scoring";
import { SCORE_GAME_RESULT_SELECT } from "@/lib/standings";

export default async function BracketViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, entry] = await Promise.all([
    auth(),
    prisma.entry.findUnique({
      where: { id },
      select: {
        name: true,
        bracketType: true,
        picksJson: true,
        tiebreakerJson: true,
      },
    }),
  ]);

  if (!entry) {
    notFound();
  }

  const [teamLabelOverridesByKey, gameResults] = await Promise.all([
    getTeamLabelOverridesByKey(),
    prisma.game.findMany({
      select: SCORE_GAME_RESULT_SELECT,
    }),
  ]);
  const gameResultsById = createGameResultsIndex(gameResults as GameResultRow[]);
  const sourceWinnerTeamKeyByGameId = buildFinalWinnerTeamKeyByGameId(gameResultsById);
  const normalizedPicksJson = normalizeEntryPicksJson(entry.picksJson, entry.bracketType, {
    sourceWinnerTeamKeyByGameId,
  });
  const normalizedTiebreakerJson = normalizeEntryTiebreakerJson(entry.tiebreakerJson);
  const scoreMap = normalizedTiebreakerJson?.championship.predictedScoresByTeamKey ?? {};
  const isChampionshipBracket = entry.bracketType === "CHAMPIONSHIP";
  const mainScoreSummary =
    entry.bracketType === "MAIN"
      ? scoreMainBracketEntry({
          picksByGameId: normalizeEntryPicksJson(entry.picksJson, entry.bracketType).picksByGameId,
          gameResultsById,
        })
      : null;
  const secondChanceScoreSummary =
    entry.bracketType === "SECOND_CHANCE_S16"
      ? scoreSecondChanceEntry({
          picksByGameId: normalizeEntryPicksJson(entry.picksJson, entry.bracketType, {
            sourceWinnerTeamKeyByGameId,
          }).picksByGameId,
          gameResultsById,
        })
      : null;

  const actualGameResultsByGameId = Object.fromEntries(
    gameResults.map((gameResult) => [
      gameResult.id,
      {
        status: gameResult.status,
        winnerTeamKey: gameResult.winnerTeamKey,
        winnerTeam: gameResult.winnerTeam,
      },
    ]),
  );

  return (
    <PageShell
      title={entry.name}
      description={`Read-only saved ${BRACKET_TYPE_LABELS[entry.bracketType]}.`}
      size="wide"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between print:hidden">
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm md:min-w-[260px]">
          {isChampionshipBracket ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Championship Ranking</p>
              <p className="mt-1 text-sm text-slate-700">
                Ranked by winner pick and final-score tiebreak closeness.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Score</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {mainScoreSummary?.totalScore ?? secondChanceScoreSummary?.totalScore ?? 0}
              </p>
              {entry.bracketType === "MAIN" ? (
                <p className="mt-1 text-xs text-slate-600">
                  Correct Picks: {mainScoreSummary?.correctPicks ?? 0} • Max Possible:{" "}
                  {mainScoreSummary?.maxPossibleScore ?? 0}
                </p>
              ) : null}
              {entry.bracketType === "SECOND_CHANCE_S16" ? (
                <p className="mt-1 text-xs text-slate-600">
                  Max Possible: {secondChanceScoreSummary?.maxPossibleScore ?? 0}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {session?.user ? (
            <Link
              href={`/entries/${id}/edit`}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Bracket
            </Link>
          ) : null}
          <PrintBracketButton />
        </div>
      </div>
      <BracketEditor
        mode="view"
        bracketType={entry.bracketType}
        initialPicksByGameId={normalizedPicksJson.picksByGameId}
        initialScoresByTeamKey={scoreMap}
        teamLabelOverridesByKey={teamLabelOverridesByKey}
        actualGameResultsByGameId={actualGameResultsByGameId}
        sourceWinnerTeamKeyByGameId={sourceWinnerTeamKeyByGameId}
      />
    </PageShell>
  );
}
