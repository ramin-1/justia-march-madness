export function BracketPlaceholder({
  mode,
  entryName,
}: {
  mode: "view" | "edit";
  entryName?: string;
}) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Bracket Layout Placeholder {entryName ? `- ${entryName}` : ""}
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          {mode}
        </span>
      </div>
      <p className="max-w-3xl text-sm text-slate-600">
        This is the placeholder container for the fixed-layout NCAA bracket
        component. The final implementation should map canonical game IDs to
        positioned slots so the public and admin views share the same structure.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["East", "West", "South", "Midwest"].map((region) => (
          <div key={region} className="rounded-lg bg-slate-50 p-4">
            <h3 className="mb-2 font-medium">{region}</h3>
            <p className="text-xs text-slate-500">
              Region column placeholder for Round 1 through Elite 8.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
