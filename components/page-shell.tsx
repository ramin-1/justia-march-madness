import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
  className,
  size = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
}) {
  const maxWidthClass = size === "wide" ? "max-w-[1700px]" : "max-w-7xl";

  return (
    <main
      className={`mx-auto ${maxWidthClass} px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-2 print:py-3 ${className ?? ""}`}
    >
      <header className="mb-6 space-y-2 print:mb-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm text-slate-600">{description}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
