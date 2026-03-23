"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminResultFormState } from "@/app/admin/results/action-state";
import { getAvailableTeamsForGame, getTeamLabel, type TeamOption } from "@/lib/brackets/registry";
import type { PicksByGameId } from "@/lib/brackets/types";
import { prisma } from "@/lib/prisma";
import { parseGameResultUpdateFormData } from "@/lib/results/validation";
import { normalizeGameResultStatus } from "@/lib/results/status";
import { syncNcaaResultsBackfill } from "@/lib/result-sync/sync-service";
import { createGameResultsIndex, type GameResultRow } from "@/lib/scoring";
import { recalculateEntryStandings, SCORE_GAME_RESULT_SELECT } from "@/lib/standings";

function dedupeTeamOptions(teamOptions: TeamOption[]): TeamOption[] {
  const seen = new Set<string>();
  const deduped: TeamOption[] = [];

  for (const teamOption of teamOptions) {
    if (seen.has(teamOption.key)) {
      continue;
    }

    seen.add(teamOption.key);
    deduped.push(teamOption);
  }

  return deduped;
}

function getExistingTeamOptions(game: GameResultRow): TeamOption[] {
  const options: TeamOption[] = [];

  if (game.homeTeamKey) {
    options.push({
      key: game.homeTeamKey,
      label: game.homeTeam ?? getTeamLabel(game.homeTeamKey),
    });
  }

  if (game.awayTeamKey) {
    options.push({
      key: game.awayTeamKey,
      label: game.awayTeam ?? getTeamLabel(game.awayTeamKey),
    });
  }

  return options;
}

function buildCompletedPicksByGameId(games: GameResultRow[]): PicksByGameId {
  const gameResultsById = createGameResultsIndex(games);
  const picksByGameId: PicksByGameId = {};

  for (const [gameId, gameResult] of gameResultsById) {
    if (!gameResult.winnerTeamKey) {
      continue;
    }

    picksByGameId[gameId] = {
      winnerTeamKey: gameResult.winnerTeamKey,
    };
  }

  return picksByGameId;
}

function isPrismaRecordNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function buildAdminResultsPath(options?: {
  syncStatus?: "success" | "error";
  syncMessage?: string;
}) {
  const params = new URLSearchParams();

  if (options?.syncStatus) {
    params.set("sync", options.syncStatus);
  }

  if (options?.syncMessage) {
    params.set("syncMessage", options.syncMessage);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/admin/results?${queryString}` : "/admin/results";
}

export async function updateGameResultAction(
  _previousState: AdminResultFormState,
  formData: FormData,
): Promise<AdminResultFormState> {
  const submittedGameId = formData.get("gameId");
  const gameId = typeof submittedGameId === "string" ? submittedGameId.trim() : "";

  if (!gameId) {
    return {
      status: "error",
      message: "Unable to update result because the game id is invalid.",
    };
  }

  const games = await prisma.game.findMany({
    select: SCORE_GAME_RESULT_SELECT,
  });
  const gameRows = games as GameResultRow[];
  const game = gameRows.find((row) => row.id === gameId);

  if (!game) {
    return {
      status: "error",
      message: "That game no longer exists.",
    };
  }

  const completedPicksByGameId = buildCompletedPicksByGameId(gameRows);
  const availableTeams = getAvailableTeamsForGame({
    bracketType: "MAIN",
    gameId,
    picksByGameId: completedPicksByGameId,
  });
  const existingTeams = getExistingTeamOptions(game);
  const participatingTeams = dedupeTeamOptions(
    availableTeams.length > 0 ? availableTeams : existingTeams,
  );

  const homeTeamContext = availableTeams[0] ?? existingTeams[0] ?? null;
  const awayTeamContext = availableTeams[1] ?? existingTeams[1] ?? null;

  const parsedInput = parseGameResultUpdateFormData(formData, {
    participantTeamKeys: participatingTeams.map((teamOption) => teamOption.key),
    homeTeamKey: homeTeamContext?.key ?? null,
    awayTeamKey: awayTeamContext?.key ?? null,
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.message,
      fieldErrors: parsedInput.fieldErrors,
    };
  }

  if (parsedInput.data.gameId !== gameId) {
    return {
      status: "error",
      message: "Unable to update result because the game id did not match.",
    };
  }

  const teamLabelByKey = new Map<string, string>();
  for (const teamOption of [...availableTeams, ...existingTeams]) {
    teamLabelByKey.set(teamOption.key, teamOption.label);
  }

  const winnerTeamLabel = parsedInput.data.winnerTeamKey
    ? (teamLabelByKey.get(parsedInput.data.winnerTeamKey) ?? getTeamLabel(parsedInput.data.winnerTeamKey))
    : null;

  const shouldSyncParticipantTeams = availableTeams.length === 2;

  let updatedGame:
    | {
        id: string;
        status: string;
        winnerTeamKey: string | null;
        homeScore: number | null;
        awayScore: number | null;
      }
    | null = null;

  try {
    updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: parsedInput.data.status,
        winnerTeamKey: parsedInput.data.winnerTeamKey,
        winnerTeam: winnerTeamLabel,
        homeScore: parsedInput.data.homeScore,
        awayScore: parsedInput.data.awayScore,
        homeTeamKey: shouldSyncParticipantTeams ? availableTeams[0]?.key ?? game.homeTeamKey : game.homeTeamKey,
        homeTeam: shouldSyncParticipantTeams ? availableTeams[0]?.label ?? game.homeTeam : game.homeTeam,
        awayTeamKey: shouldSyncParticipantTeams ? availableTeams[1]?.key ?? game.awayTeamKey : game.awayTeamKey,
        awayTeam: shouldSyncParticipantTeams ? availableTeams[1]?.label ?? game.awayTeam : game.awayTeam,
        syncSource: "manual",
        lastSyncedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        winnerTeamKey: true,
        homeScore: true,
        awayScore: true,
      },
    });
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      return {
        status: "error",
        message: "That game no longer exists.",
      };
    }

    return {
      status: "error",
      message: "Unable to save this result right now. Please try again.",
    };
  }

  await recalculateEntryStandings();

  revalidatePath("/admin/results");
  revalidatePath("/entries");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: `${gameId} updated successfully.`,
    savedValues: updatedGame
      ? {
          gameId: updatedGame.id,
          status: normalizeGameResultStatus(updatedGame.status),
          winnerTeamKey: updatedGame.winnerTeamKey,
          homeScore: updatedGame.homeScore,
          awayScore: updatedGame.awayScore,
        }
      : undefined,
  };
}

export async function runNcaaSyncAction() {
  let syncResult: Awaited<ReturnType<typeof syncNcaaResultsBackfill>>;

  try {
    syncResult = await syncNcaaResultsBackfill();
  } catch (error) {
    console.error("NCAA sync failed from admin trigger:", error);

    revalidatePath("/admin/results");
    revalidatePath("/leaderboard");
    revalidatePath("/entries");

    const syncErrorMessage =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "NCAA sync failed. Please review sync logs and try again.";

    redirect(
      buildAdminResultsPath({
        syncStatus: "error",
        syncMessage: syncErrorMessage,
      }),
    );
  }

  revalidatePath("/admin/results");
  revalidatePath("/leaderboard");
  revalidatePath("/entries");

  redirect(
    buildAdminResultsPath({
      syncStatus: "success",
      syncMessage: `Backfill sync complete for ${syncResult.datesProcessed} date(s) (${syncResult.startDate} to ${syncResult.targetDate}). Parsed ${syncResult.parsedGames}, matched ${syncResult.matchedGames}, updated ${syncResult.updatedGames}, unchanged ${syncResult.unchangedGames}.`,
    }),
  );
}
