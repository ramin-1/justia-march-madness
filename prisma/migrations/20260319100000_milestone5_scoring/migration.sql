-- AlterTable
ALTER TABLE "Game"
ADD COLUMN "homeTeamKey" TEXT,
ADD COLUMN "homeScore" INTEGER,
ADD COLUMN "awayTeamKey" TEXT,
ADD COLUMN "awayScore" INTEGER,
ADD COLUMN "winnerTeamKey" TEXT;
