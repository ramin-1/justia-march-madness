import { createEntryAction } from "@/app/entries/actions";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";

export default function NewEntryPage() {
  return (
    <PageShell
      title="Add Bracket"
      description="Create a new entry by choosing a bracket type and selecting winners in the bracket editor."
    >
      <EntryForm mode="create" submitAction={createEntryAction} />
    </PageShell>
  );
}
