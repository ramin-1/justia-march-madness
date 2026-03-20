import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function AppLoading() {
  return (
    <PageShell title="Loading" description="Preparing the latest bracket challenge data.">
      <LoadingState />
    </PageShell>
  );
}
