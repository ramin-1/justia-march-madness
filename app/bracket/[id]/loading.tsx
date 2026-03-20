import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function BracketViewLoading() {
  return (
    <PageShell title="Bracket" description="Loading saved bracket view.">
      <LoadingState title="Loading bracket" description="Preparing picks and game results..." />
    </PageShell>
  );
}
