import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function NotFoundPage() {
  return (
    <PageShell
      title="Page Not Found"
      description="The page or bracket you requested does not exist."
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        <p className="mb-3">
          Check the URL or return to the leaderboard to keep exploring entries.
        </p>
        <Link
          href="/leaderboard"
          className="inline-flex rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Leaderboard
        </Link>
      </div>
    </PageShell>
  );
}
