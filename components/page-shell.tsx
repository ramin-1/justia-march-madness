import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm text-slate-600">{description}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
