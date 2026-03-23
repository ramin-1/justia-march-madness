import { runNcaaSyncAction, updateGameResultAction } from "@/app/admin/results/actions";
import { AdminResultGameCard } from "@/components/admin-result-game-card";
import { PageShell } from "@/components/page-shell";
import {
  getAvailableTeamsForGame,
  getCanonicalGame,
  getTeamLabel,
  getTemplateRoundConfigs,
  type TeamOption,
} from "@/lib/brackets/registry";
import type { PicksByGameId } from "@/lib/brackets/types";
import { prisma } from "@/lib/prisma";
import { normalizeGameResultStatus } from "@/lib/results/status";
import { createGameResultsIndex, type GameResultRow } from "@/lib/scoring";
import { SCORE_GAME_RESULT_SELECT } from "@/lib/standings";

export const dynamic = "force-dynamic";

type GameRow = GameResultRow & {
  round: string;
  region: string | null;
  slotLabel: string;
};

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "n/a";
  }

  return value.toLocaleString();
}

function readSummaryNumber(summary: unknown, key: string): number | null {
  if (typeof summary !== "object" || summary === null) {
    return null;
  }

  const value = (summary as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function readSummaryString(summary: unknown, key: string): string | null {
  if (typeof summary !== "object" || summary === null) {
    return null;
  }

  const value = (summary as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCanonicalParticipantFallbackLabels(gameId: string): [string, string] {
  const canonicalGame = getCanonicalGame(gameId);
  const labels: string[] = [];

  for (const fixedTeam of canonicalGame.fixedTeams ?? []) {
    labels.push(fixedTeam.label);
  }

  for (const sourceGameId of canonicalGame.sourceGameIds ?? []) {
    const sourceGame = getCanonicalGame(sourceGameId);
    labels.push(`Winner of ${sourceGame.slotLabel}`);
  }

  for (const initialTeam of canonicalGame.initialTeams ?? []) {
    labels.push(initialTeam.label);
  }

  while (labels.length < 2) {
    labels.push(`Participant ${labels.length + 1}`);
  }

  return [labels[0], labels[1]];
}

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

function getExistingTeamOptions(game: GameRow): TeamOption[] {
  const options: TeamOption[] = [];

  if (game.homeTeamKey) {
    options.push({
      key: game.homeTeamKey,
      label: game.homeTeam ?? game.homeTeamKey,
    });
  }

  if (game.awayTeamKey) {
    options.push({
      key: game.awayTeamKey,
      label: game.awayTeam ?? game.awayTeamKey,
    });
  }

  return options;
}

function buildScoreInputLabels({
  game,
  availableTeams,
  existingTeams,
}: {
  game: GameRow;
  availableTeams: TeamOption[];
  existingTeams: TeamOption[];
}) {
  const [fallbackHomeLabel, fallbackAwayLabel] = buildCanonicalParticipantFallbackLabels(game.id);

  const homeLabel =
    normalizeNonEmptyString(game.homeTeam) ??
    normalizeNonEmptyString(availableTeams[0]?.label) ??
    normalizeNonEmptyString(existingTeams[0]?.label) ??
    (game.homeTeamKey ? getTeamLabel(game.homeTeamKey) : null) ??
    fallbackHomeLabel;

  const awayLabel =
    normalizeNonEmptyString(game.awayTeam) ??
    normalizeNonEmptyString(availableTeams[1]?.label) ??
    normalizeNonEmptyString(existingTeams[1]?.label) ??
    (game.awayTeamKey ? getTeamLabel(game.awayTeamKey) : null) ??
    fallbackAwayLabel;

  return {
    homeScoreLabel: `${homeLabel} score`,
    awayScoreLabel: `${awayLabel} score`,
  };
}

function groupGamesByRegion(games: GameRow[]) {
  const groupedGames = new Map<string, GameRow[]>();

  for (const game of games) {
    const region = game.region ?? "National";
    const existingGroup = groupedGames.get(region) ?? [];
    groupedGames.set(region, [...existingGroup, game]);
  }

  return groupedGames;
}

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

type AdminResultsPageProps = {
  searchParams: Promise<{
    sync?: string | string[];
    syncMessage?: string | string[];
  }>;
};

export default async function AdminResultsPage({ searchParams }: AdminResultsPageProps) {
  const params = await searchParams;
  const syncStatus = getSingleSearchParam(params.sync);
  const syncMessage = getSingleSearchParam(params.syncMessage);
  const rounds = getTemplateRoundConfigs("MAIN");

  const [games, latestSyncRun] = await Promise.all([
    prisma.game.findMany({
      select: {
        ...SCORE_GAME_RESULT_SELECT,
        round: true,
        region: true,
        slotLabel: true,
      },
    }),
    prisma.syncRun.findFirst({
      where: { source: "ncaa" },
      orderBy: { startedAt: "desc" },
      select: {
        status: true,
        startedAt: true,
        finishedAt: true,
        summaryJson: true,
      },
    }),
  ]);
  const gameRows = games as GameRow[];
  const gameById = new Map<string, GameRow>(gameRows.map((game) => [game.id, game]));
  const completedPicksByGameId = buildCompletedPicksByGameId(gameRows);
  const latestSyncSourceUrl = readSummaryString(latestSyncRun?.summaryJson, "sourceUrl");
  const latestSyncSourceMode = readSummaryString(latestSyncRun?.summaryJson, "sourceMode");
  const latestParsedGames = readSummaryNumber(latestSyncRun?.summaryJson, "parsedGames");
  const latestParserPath = readSummaryString(latestSyncRun?.summaryJson, "parserPath");
  const latestJsonBlocksFound = readSummaryNumber(latestSyncRun?.summaryJson, "jsonBlocksFound");
  const latestJsonCandidates = readSummaryNumber(latestSyncRun?.summaryJson, "jsonCandidates");
  const latestHtmlFallbackCandidates = readSummaryNumber(
    latestSyncRun?.summaryJson,
    "htmlFallbackCandidates",
  );
  const latestHtmlFallbackParsedCandidates = readSummaryNumber(
    latestSyncRun?.summaryJson,
    "htmlFallbackParsedCandidates",
  );
  const latestNormalizedParsedGames = readSummaryNumber(
    latestSyncRun?.summaryJson,
    "normalizedParsedGames",
  );
  const latestParsedGamesWithRegion = readSummaryNumber(
    latestSyncRun?.summaryJson,
    "parsedGamesWithRegion",
  );
  const latestParsedGamesMissingRegion = readSummaryNumber(
    latestSyncRun?.summaryJson,
    "parsedGamesMissingRegion",
  );
  const latestMatchedGames = readSummaryNumber(latestSyncRun?.summaryJson, "matchedGames");
  const latestUpdatedGames = readSummaryNumber(latestSyncRun?.summaryJson, "updatedGames");
  const latestUnmatchedGames = readSummaryNumber(latestSyncRun?.summaryJson, "unmatchedGames");
  const latestAmbiguousGames = readSummaryNumber(latestSyncRun?.summaryJson, "ambiguousGames");
  const latestSkippedGames = readSummaryNumber(latestSyncRun?.summaryJson, "skippedGames");

  return (
    <PageShell
      title="Admin Results"
      description="Update canonical game outcomes and recalculate standings across all bracket types."
    >
      {syncStatus === "success" && syncMessage ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {syncMessage}
        </p>
      ) : null}

      {syncStatus === "error" && syncMessage ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {syncMessage}
        </p>
      ) : null}

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        Mark a game as <span className="font-semibold">Final</span> when winner and scores are known.
        Saving a result triggers standings recalculation for Main, Second Chance, and Championship
        leaderboards.
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">NCAA Sync</h2>
            <p className="text-sm text-slate-600">
              Backfill tournament dates through the current target date and sync completed NCAA games
              into canonical `Game` rows using final-only status semantics.
            </p>
          </div>

          <form action={runNcaaSyncAction} className="w-full md:w-auto">
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 md:w-auto"
            >
              Sync NCAA Results
            </button>
          </form>
        </div>

        <div className="mt-3 space-y-1 text-xs text-slate-600">
          {latestSyncRun ? (
            <>
              <p>
                Last run: <span className="font-medium text-slate-800">{latestSyncRun.status}</span> •{" "}
                started {formatDateTime(latestSyncRun.startedAt)} • finished{" "}
                {formatDateTime(latestSyncRun.finishedAt)}
              </p>
              <p>
                Parsed: {latestParsedGames ?? "n/a"} • Matched: {latestMatchedGames ?? "n/a"} • Updated:{" "}
                {latestUpdatedGames ?? "n/a"} • Unmatched: {latestUnmatchedGames ?? "n/a"} • Ambiguous:{" "}
                {latestAmbiguousGames ?? "n/a"} • Skipped: {latestSkippedGames ?? "n/a"}
              </p>
              <p>
                Parser: {latestParserPath ?? "n/a"} • JSON blocks: {latestJsonBlocksFound ?? "n/a"} •
                JSON candidates: {latestJsonCandidates ?? "n/a"} • HTML fallback candidates:{" "}
                {latestHtmlFallbackCandidates ?? "n/a"} • HTML parsed:{" "}
                {latestHtmlFallbackParsedCandidates ?? "n/a"} • Normalized parsed:{" "}
                {latestNormalizedParsedGames ?? "n/a"}
              </p>
              <p>
                Parsed with region: {latestParsedGamesWithRegion ?? "n/a"} • Parsed missing region:{" "}
                {latestParsedGamesMissingRegion ?? "n/a"}
              </p>
              <p>
                Source URL: {latestSyncSourceUrl ?? "n/a"} ({latestSyncSourceMode ?? "n/a"})
              </p>
            </>
          ) : (
            <p>No NCAA sync runs yet.</p>
          )}
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No tournament rounds are configured yet. Check bracket configuration before managing results.
        </div>
      ) : null}

      <div className="space-y-8">
        {rounds.map((round) => {
          const roundGames = round.gameIds
            .map((gameId) => {
              const game = gameById.get(gameId);
              const canonicalGame = getCanonicalGame(gameId);

              return (
                game ?? {
                  id: gameId,
                  round: canonicalGame.round,
                  region: canonicalGame.region ?? null,
                  slotLabel: canonicalGame.slotLabel,
                  status: "pending",
                  winnerTeam: null,
                  winnerTeamKey: null,
                  homeTeam: null,
                  awayTeam: null,
                  homeTeamKey: null,
                  awayTeamKey: null,
                  homeScore: null,
                  awayScore: null,
                }
              );
            })
            .filter((game): game is GameRow => Boolean(game));
          const gamesByRegion = groupGamesByRegion(roundGames);

          return (
            <section key={round.key} className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-slate-900">
                  {round.label}
                  <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    ({round.gameIds.length} games)
                  </span>
                </h2>
                <p className="text-sm text-slate-600">{round.description}</p>
              </header>

              <div className="space-y-5">
                {Array.from(gamesByRegion.entries()).map(([region, regionGames]) => (
                  <section key={`${round.key}-${region}`} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                      {region}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {regionGames.map((game) => {
                        const availableTeams = getAvailableTeamsForGame({
                          bracketType: "MAIN",
                          gameId: game.id,
                          picksByGameId: completedPicksByGameId,
                        });
                        const existingTeamOptions = getExistingTeamOptions(game);
                        const participantOptions = dedupeTeamOptions(
                          availableTeams.length > 0
                            ? availableTeams
                            : existingTeamOptions,
                        );
                        const scoreInputLabels = buildScoreInputLabels({
                          game,
                          availableTeams,
                          existingTeams: existingTeamOptions,
                        });

                        return (
                          <AdminResultGameCard
                            key={game.id}
                            gameId={game.id}
                            slotLabel={game.slotLabel}
                            region={game.region}
                            currentStatus={normalizeGameResultStatus(game.status)}
                            winnerTeamKey={game.winnerTeamKey}
                            homeScore={game.homeScore}
                            awayScore={game.awayScore}
                            homeScoreLabel={scoreInputLabels.homeScoreLabel}
                            awayScoreLabel={scoreInputLabels.awayScoreLabel}
                            participantOptions={participantOptions}
                            submitAction={updateGameResultAction}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
