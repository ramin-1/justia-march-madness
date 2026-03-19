import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";

type ScaffoldSurface = "public" | "admin" | "auth";

function getStatusMessage(surface: ScaffoldSurface) {
  if (surface === "admin") {
    return "Admin route under active development. Authentication is enabled, while some workflows are placeholders for later milestones.";
  }

  if (surface === "auth") {
    return "Admin credentials login route. Configure ADMIN_USERNAME and ADMIN_PASSWORD_HASH in environment variables.";
  }

  return "Public scaffold route. Live data and full behavior will be added in later milestones.";
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
        <p className="font-semibold">Scaffold Route</p>
        <p className="mt-1">{getStatusMessage(surface)}</p>
      </div>
      {children}
    </PageShell>
  );
}
