"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageShell } from "@/components/page-shell";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <PageShell
      title="Something went wrong"
      description="We hit an unexpected error while loading this page."
    >
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p>Please try again. If the issue continues, refresh or return to the leaderboard.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
          <Link
            href="/leaderboard"
            className="rounded-md border border-red-300 px-3 py-2 font-medium text-red-800 hover:bg-red-100"
          >
            Go to Leaderboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
