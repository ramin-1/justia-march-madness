import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function setLabelIfMissing(
  labelByKey: Record<string, string>,
  teamKey: string | null,
  teamLabel: string | null,
) {
  if (!teamKey || labelByKey[teamKey]) {
    return;
  }

  const normalizedLabel = toNonEmptyString(teamLabel);
  if (!normalizedLabel) {
    return;
  }

  labelByKey[teamKey] = normalizedLabel;
}

function isMissingTeamSlotAssignmentsTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

async function hasTeamSlotAssignmentsTable(): Promise<boolean> {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'TeamSlotAssignment'
    ) AS "exists"
  `);

  return result[0]?.exists === true;
}

export async function getManualTeamSlotAssignments() {
  const tableExists = await hasTeamSlotAssignmentsTable();
  if (!tableExists) {
    return [];
  }

  try {
    return await prisma.teamSlotAssignment.findMany({
      select: {
        teamKey: true,
        teamName: true,
      },
    });
  } catch (error) {
    if (isMissingTeamSlotAssignmentsTableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getTeamLabelOverridesByKey(): Promise<Record<string, string>> {
  const [manualAssignments, games] = await Promise.all([
    getManualTeamSlotAssignments(),
    prisma.game.findMany({
      select: {
        homeTeamKey: true,
        homeTeam: true,
        awayTeamKey: true,
        awayTeam: true,
        winnerTeamKey: true,
        winnerTeam: true,
      },
    }),
  ]);

  const teamLabelOverridesByKey: Record<string, string> = {};

  for (const assignment of manualAssignments) {
    const normalizedName = toNonEmptyString(assignment.teamName);
    if (!normalizedName) {
      continue;
    }

    teamLabelOverridesByKey[assignment.teamKey] = normalizedName;
  }

  for (const game of games) {
    setLabelIfMissing(teamLabelOverridesByKey, game.homeTeamKey, game.homeTeam);
    setLabelIfMissing(teamLabelOverridesByKey, game.awayTeamKey, game.awayTeam);
    setLabelIfMissing(teamLabelOverridesByKey, game.winnerTeamKey, game.winnerTeam);
  }

  return teamLabelOverridesByKey;
}
