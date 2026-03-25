import { notFound } from "next/navigation";
import { updateEntryAction } from "@/app/entries/actions";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";
import { buildEntryName } from "@/lib/entries/validation";
import { normalizeEntryPicksJson, normalizeEntryTiebreakerJson } from "@/lib/brackets/serialization";
import {
  getFinalWinnerTeamKeyByGameId,
  getTeamLabelOverridesByKey,
} from "@/lib/brackets/team-labels";
import { prisma } from "@/lib/prisma";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    select: {
      id: true,
      participantName: true,
      bracketType: true,
      picksJson: true,
      tiebreakerJson: true,
    },
  });

  if (!entry) {
    notFound();
  }

  const [teamLabelOverridesByKey, sourceWinnerTeamKeyByGameId] = await Promise.all([
    getTeamLabelOverridesByKey(),
    getFinalWinnerTeamKeyByGameId(),
  ]);
  const generatedName = buildEntryName(entry.participantName, entry.bracketType);
  const normalizedPicksJson = normalizeEntryPicksJson(entry.picksJson, entry.bracketType, {
    sourceWinnerTeamKeyByGameId,
  });
  const normalizedTiebreakerJson = normalizeEntryTiebreakerJson(entry.tiebreakerJson);
  const defaultScoresByTeamKey =
    normalizedTiebreakerJson?.championship.predictedScoresByTeamKey ?? {};

  return (
    <PageShell
      title={`Edit Entry: ${generatedName}`}
      description="Update participant details and saved bracket picks."
      size="wide"
    >
      <EntryForm
        mode="edit"
        submitAction={updateEntryAction}
        entryId={entry.id}
        defaultParticipantName={entry.participantName}
        defaultBracketType={entry.bracketType}
        defaultPicksByGameId={normalizedPicksJson.picksByGameId}
        defaultScoresByTeamKey={defaultScoresByTeamKey}
        teamLabelOverridesByKey={teamLabelOverridesByKey}
        sourceWinnerTeamKeyByGameId={sourceWinnerTeamKeyByGameId}
      />
    </PageShell>
  );
}
