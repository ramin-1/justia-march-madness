import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function LoginLoading() {
  return (
    <PageShell title="Admin Login" description="Loading authentication form.">
      <LoadingState title="Loading login" description="Preparing admin sign-in..." />
    </PageShell>
  );
}
