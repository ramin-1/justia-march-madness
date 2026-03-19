import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";

type ScaffoldSurface = "public" | "admin" | "auth";

function getStatusMessage(surface: ScaffoldSurface) {
  if (surface === "admin") {
    return "Admin placeholder route for Milestone 1. Authentication and route protection are scheduled for Milestone 2.";
  }

  if (surface === "auth") {
    return "Login placeholder route for Milestone 1. Full Auth.js-based authentication is scheduled for Milestone 2.";
  }

  return "Public scaffold route for Milestone 1. Live data and full behavior will be added in later milestones.";
}

export function ScaffoldPage({
  title,
  description,
  surface,
  children,
}: {
  title: string;
  description: string;
  surface: ScaffoldSurface;
  children: ReactNode;
}) {
  return (
    <PageShell title={title} description={description}>
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Milestone 1 Placeholder</p>
        <p className="mt-1">{getStatusMessage(surface)}</p>
      </div>
      {children}
    </PageShell>
  );
}
