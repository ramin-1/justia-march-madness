import { createEntryAction } from "@/app/entries/actions";
import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { EntryForm } from "@/components/entry-form";
import { PageShell } from "@/components/page-shell";

export default function NewEntryPage() {
  return (
    <PageShell
      title="Add Bracket"
      description="Create a new bracket entry. Bracket picks remain a placeholder in this milestone."
    >
      <EntryForm mode="create" submitAction={createEntryAction} />

      <div className="mt-8">
        <BracketPlaceholder mode="edit" />
      </div>
    </PageShell>
  );
}
