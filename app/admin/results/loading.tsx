import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function AdminResultsLoading() {
  return (
    <PageShell title="Admin Results" description="Loading tournament results management.">
      <LoadingState title="Loading results dashboard" description="Fetching games and sync metadata..." />
    </PageShell>
  );
}
