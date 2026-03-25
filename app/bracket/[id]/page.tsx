import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BracketEditor } from "@/components/bracket-editor";
import { PrintBracketButton } from "@/components/print-bracket-button";
import { BRACKET_TYPE_LABELS } from "@/lib/brackets/types";
import { PageShell } from "@/components/page-shell";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
import {
  getFinalWinnerTeamKeyByGameId,
  getTeamLabelOverridesByKey,
} from "@/lib/brackets/team-labels";
import { prisma } from "@/lib/prisma";

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

  const [teamLabelOverridesByKey, sourceWinnerTeamKeyByGameId, gameResults] = await Promise.all([
    getTeamLabelOverridesByKey(),
    getFinalWinnerTeamKeyByGameId(),
    prisma.game.findMany({
      select: {
        id: true,
        status: true,
        winnerTeamKey: true,
        winnerTeam: true,
      },
    }),
  ]);
  const normalizedPicksJson = normalizeEntryPicksJson(entry.picksJson, entry.bracketType, {
    sourceWinnerTeamKeyByGameId,
  });
  const normalizedTiebreakerJson = normalizeEntryTiebreakerJson(entry.tiebreakerJson);
  const scoreMap = normalizedTiebreakerJson?.championship.predictedScoresByTeamKey ?? {};

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
      <div className="mb-4 flex justify-end gap-2 print:hidden">
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
