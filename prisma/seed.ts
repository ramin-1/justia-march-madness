import { PrismaClient } from "@prisma/client";
import { BRACKET_GAMES } from "../lib/bracket-config";

const prisma = new PrismaClient();

async function main() {
  for (const game of BRACKET_GAMES) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: {},
      create: {
        id: game.id,
        round: game.round,
        region: game.region,
        slotLabel: game.slotLabel,
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
