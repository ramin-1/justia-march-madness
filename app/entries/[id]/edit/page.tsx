import { notFound } from "next/navigation";
import { updateEntryAction } from "@/app/entries/actions";
import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";
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
      name: true,
      participantName: true,
    },
  });

  if (!entry) {
    notFound();
  }

  return (
    <PageShell
      title={`Edit Entry: ${entry.name}`}
      description="Update entry details. Bracket picks remain a placeholder in this milestone."
    >
      <EntryForm
        mode="edit"
        submitAction={updateEntryAction}
        entryId={entry.id}
        defaultName={entry.name}
        defaultParticipantName={entry.participantName}
      />

      <div className="mt-8">
        <BracketPlaceholder mode="edit" entryName={entry.name} />
      </div>
    </PageShell>
  );
}
