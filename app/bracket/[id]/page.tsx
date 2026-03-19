import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { PageShell } from "@/components/page-shell";

export default async function BracketViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell
      title={`Bracket: ${id}`}
      description="Public read-only bracket page."
    >
      <BracketPlaceholder mode="view" entryName={id} />
    </PageShell>
  );
}
