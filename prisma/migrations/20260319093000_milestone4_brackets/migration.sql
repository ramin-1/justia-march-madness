-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('MAIN', 'SECOND_CHANCE_S16', 'CHAMPIONSHIP');

-- AlterTable
ALTER TABLE "Entry"
ADD COLUMN "bracketType" "BracketType" NOT NULL DEFAULT 'MAIN',
ADD COLUMN "tiebreakerJson" JSONB,
ADD COLUMN "correctPicks" INTEGER NOT NULL DEFAULT 0;
