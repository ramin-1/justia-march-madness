import { createEntryAction } from "@/app/entries/actions";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";
import {
  getFinalWinnerTeamKeyByGameId,
  getTeamLabelOverridesByKey,
} from "@/lib/brackets/team-labels";

export default async function NewEntryPage() {
  const [teamLabelOverridesByKey, sourceWinnerTeamKeyByGameId] = await Promise.all([
    getTeamLabelOverridesByKey(),
    getFinalWinnerTeamKeyByGameId(),
  ]);

  return (
    <PageShell
      title="Add Bracket"
      description="Create a new entry by choosing a bracket type and selecting winners in the bracket editor."
      size="wide"
    >
      <EntryForm
        mode="create"
        submitAction={createEntryAction}
        teamLabelOverridesByKey={teamLabelOverridesByKey}
        sourceWinnerTeamKeyByGameId={sourceWinnerTeamKeyByGameId}
      />
    </PageShell>
  );
}
