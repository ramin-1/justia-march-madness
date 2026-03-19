import { notFound } from "next/navigation";
import { updateEntryAction } from "@/app/entries/actions";
import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";
import { buildEntryName } from "@/lib/entries/validation";
import { prisma } from "@/lib/prisma";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    select: {
      id: true,
      participantName: true,
    },
  });

  if (!entry) {
    notFound();
  }

  const generatedName = buildEntryName(entry.participantName);

  return (
    <PageShell
      title={`Edit Entry: ${generatedName}`}
      description="Update participant name. Entry name is generated automatically."
    >
      <EntryForm
        mode="edit"
        submitAction={updateEntryAction}
        entryId={entry.id}
        defaultParticipantName={entry.participantName}
      />

      <div className="mt-8">
        <BracketPlaceholder mode="edit" entryName={generatedName} />
      </div>
    </PageShell>
  );
}
