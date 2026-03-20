import { PrismaClient } from "@prisma/client";
import { CANONICAL_GAMES } from "../lib/brackets/registry";

const prisma = new PrismaClient();

async function main() {
  for (const game of CANONICAL_GAMES) {
    const homeTeam = game.initialTeams?.[0]?.label ?? null;
    const homeTeamKey = game.initialTeams?.[0]?.key ?? null;
    const awayTeam = game.initialTeams?.[1]?.label ?? null;
    const awayTeamKey = game.initialTeams?.[1]?.key ?? null;

    await prisma.game.upsert({
      where: { id: game.id },
      update: {
        round: game.round,
        region: game.region,
        slotLabel: game.slotLabel,
        homeTeam,
        homeTeamKey,
        awayTeam,
        awayTeamKey,
      },
      create: {
        id: game.id,
        round: game.round,
        region: game.region,
        slotLabel: game.slotLabel,
        homeTeam,
        homeTeamKey,
        awayTeam,
        awayTeamKey,
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
