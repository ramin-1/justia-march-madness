import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function EditEntryLoading() {
  return (
    <PageShell title="Edit Entry" description="Loading the saved entry and bracket editor." size="wide">
      <LoadingState title="Loading entry" description="Fetching participant picks..." />
    </PageShell>
  );
}
