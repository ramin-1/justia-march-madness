import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function EntriesLoading() {
  return (
    <PageShell title="Entries" description="Loading admin entries and filters.">
      <LoadingState title="Loading entries" description="Fetching entry records..." />
    </PageShell>
  );
}
