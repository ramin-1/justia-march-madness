import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { ScaffoldPage } from "@/components/scaffold-page";

export default async function BracketViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ScaffoldPage
      title={`Bracket: ${id}`}
      description="Public read-only bracket scaffold route."
      surface="public"
    >
      <BracketPlaceholder mode="view" entryName={id} />
    </ScaffoldPage>
  );
}
