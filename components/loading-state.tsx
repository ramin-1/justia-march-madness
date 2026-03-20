export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
