import { PrismaClient } from "@prisma/client";
import { CANONICAL_GAMES } from "../lib/brackets/registry";

const prisma = new PrismaClient();

async function main() {
  for (const game of CANONICAL_GAMES) {
    const homeTeam = game.initialTeams?.[0]?.label ?? null;
    const awayTeam = game.initialTeams?.[1]?.label ?? null;

    await prisma.game.upsert({
      where: { id: game.id },
      update: {
        round: game.round,
        region: game.region,
        slotLabel: game.slotLabel,
        homeTeam,
        awayTeam,
      },
      create: {
        id: game.id,
        round: game.round,
        region: game.region,
        slotLabel: game.slotLabel,
        homeTeam,
        awayTeam,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
