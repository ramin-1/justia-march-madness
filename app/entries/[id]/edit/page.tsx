import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { PageShell } from "@/components/page-shell";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell
      title={`Edit Entry: ${id}`}
      description="Admin bracket editing flow."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Entry name</label>
          <input
            defaultValue={id}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Participant name</label>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
      </div>

      <BracketPlaceholder mode="edit" entryName={id} />
    </PageShell>
  );
}
