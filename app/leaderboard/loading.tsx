import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";

export default function LeaderboardLoading() {
  return (
    <PageShell title="Leaderboard" description="Loading standings for the selected bracket type.">
      <LoadingState title="Loading leaderboard" description="Fetching entries and standings..." />
    </PageShell>
  );
}
