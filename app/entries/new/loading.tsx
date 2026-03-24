import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function NewEntryLoading() {
  return (
    <PageShell title="Add Bracket" description="Loading bracket editor for a new entry." size="wide">
      <LoadingState title="Loading bracket editor" description="Preparing bracket options..." />
    </PageShell>
  );
}
