import { notFound } from "next/navigation";
import { BracketEditor } from "@/components/bracket-editor";
import { PrintBracketButton } from "@/components/print-bracket-button";
import { BRACKET_TYPE_LABELS } from "@/lib/brackets/types";
import { PageShell } from "@/components/page-shell";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
import { getTeamLabelOverridesByKey } from "@/lib/brackets/team-labels";
import { prisma } from "@/lib/prisma";

export default async function BracketViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    select: {
      name: true,
      bracketType: true,
      picksJson: true,
      tiebreakerJson: true,
    },
  });

  if (!entry) {
    notFound();
  }

  const normalizedPicksJson = normalizeEntryPicksJson(entry.picksJson, entry.bracketType);
  const normalizedTiebreakerJson = normalizeEntryTiebreakerJson(entry.tiebreakerJson);
  const scoreMap = normalizedTiebreakerJson?.championship.predictedScoresByTeamKey ?? {};
  const [teamLabelOverridesByKey, gameResults] = await Promise.all([
    getTeamLabelOverridesByKey(),
    prisma.game.findMany({
      select: {
        id: true,
        status: true,
        winnerTeamKey: true,
        winnerTeam: true,
      },
    }),
  ]);

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
    >
      <div className="mb-4 flex justify-end print:hidden">
        <PrintBracketButton />
      </div>
      <BracketEditor
        mode="view"
        bracketType={entry.bracketType}
        initialPicksByGameId={normalizedPicksJson.picksByGameId}
        initialScoresByTeamKey={scoreMap}
        teamLabelOverridesByKey={teamLabelOverridesByKey}
        actualGameResultsByGameId={actualGameResultsByGameId}
      />
    </PageShell>
  );
}
