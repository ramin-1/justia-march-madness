import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function AdminTeamSlotsLoading() {
  return (
    <PageShell title="Admin Team Slots" description="Loading manual team-slot assignment data.">
      <LoadingState title="Loading team slots" description="Fetching canonical slot labels..." />
    </PageShell>
  );
}
