import { notFound } from "next/navigation";
import { BracketEditor } from "@/components/bracket-editor";
import { BRACKET_TYPE_LABELS } from "@/lib/brackets/types";
import { PageShell } from "@/components/page-shell";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
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

  return (
    <PageShell
      title={entry.name}
      description={`Read-only saved ${BRACKET_TYPE_LABELS[entry.bracketType]}.`}
    >
      <BracketEditor
        mode="view"
        bracketType={entry.bracketType}
        initialPicksByGameId={normalizedPicksJson.picksByGameId}
        initialScoresByTeamKey={scoreMap}
      />
    </PageShell>
  );
}
