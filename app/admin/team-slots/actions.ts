"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCanonicalTeamSlots } from "@/lib/brackets/registry";
import { prisma } from "@/lib/prisma";

const validTeamKeys = new Set(getCanonicalTeamSlots().map((slot) => slot.key));

type NoticeKey = "saved" | "cleared";
type ErrorKey = "invalid_team_key" | "missing_team_name";

function buildAdminTeamSlotsPath(options?: { notice?: NoticeKey; error?: ErrorKey }) {
  const params = new URLSearchParams();

  if (options?.notice) {
    params.set("notice", options.notice);
  }

  if (options?.error) {
    params.set("error", options.error);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/admin/team-slots?${queryString}` : "/admin/team-slots";
}

function normalizeFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateTeamSlotPaths() {
  revalidatePath("/admin/team-slots");
  revalidatePath("/entries", "layout");
  revalidatePath("/entries/new");
  revalidatePath("/entries/[id]/edit", "page");
  revalidatePath("/bracket/[id]", "page");
  revalidatePath("/admin/results");
}

export async function saveTeamSlotAssignmentAction(formData: FormData) {
  const teamKey = normalizeFormString(formData, "teamKey");
  const teamName = normalizeFormString(formData, "teamName");

  if (!validTeamKeys.has(teamKey)) {
    redirect(buildAdminTeamSlotsPath({ error: "invalid_team_key" }));
  }

  if (!teamName) {
    redirect(buildAdminTeamSlotsPath({ error: "missing_team_name" }));
  }

  await prisma.teamSlotAssignment.upsert({
    where: { teamKey },
    create: {
      teamKey,
      teamName,
    },
    update: {
      teamName,
    },
  });

  revalidateTeamSlotPaths();
  redirect(buildAdminTeamSlotsPath({ notice: "saved" }));
}

export async function clearTeamSlotAssignmentAction(formData: FormData) {
  const teamKey = normalizeFormString(formData, "teamKey");

  if (!validTeamKeys.has(teamKey)) {
    redirect(buildAdminTeamSlotsPath({ error: "invalid_team_key" }));
  }

  await prisma.teamSlotAssignment.deleteMany({
    where: { teamKey },
  });

  revalidateTeamSlotPaths();
  redirect(buildAdminTeamSlotsPath({ notice: "cleared" }));
}
