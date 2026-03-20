-- CreateTable
CREATE TABLE "TeamSlotAssignment" (
    "teamKey" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSlotAssignment_pkey" PRIMARY KEY ("teamKey")
);
