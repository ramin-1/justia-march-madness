-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "picksJson" JSONB NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "maxPossibleScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "region" TEXT,
    "slotLabel" TEXT NOT NULL,
    "homeTeam" TEXT,
    "awayTeam" TEXT,
    "winnerTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledDate" TIMESTAMP(3),
    "syncSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);
