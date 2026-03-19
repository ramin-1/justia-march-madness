import { BracketPlaceholder } from "@/components/bracket-placeholder";
import { ScaffoldPage } from "@/components/scaffold-page";
import { prisma } from "@/lib/prisma";

export default async function BracketViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    select: { name: true },
  });
  const entryLabel = entry?.name ?? id;

  return (
    <ScaffoldPage
      title={`Bracket: ${entryLabel}`}
      description="Public read-only bracket scaffold route."
      surface="public"
    >
      <BracketPlaceholder mode="view" entryName={entryLabel} />
    </ScaffoldPage>
  );
}
