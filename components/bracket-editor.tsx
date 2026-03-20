"use client";

import { useMemo, useState } from "react";
import {
  getAvailableTeamsForGame,
  getCanonicalGame,
  getTemplateGameIds,
  getTemplateRoundConfigs,
  sanitizePicksForTemplate,
} from "@/lib/brackets/registry";
import {
  BRACKET_TYPE_LABELS,
  type BracketType,
  type PicksByGameId,
} from "@/lib/brackets/types";

type BracketEditorMode = "edit" | "view";

type AvailabilityByGameId = Record<string, ReturnType<typeof getAvailableTeamsForGame>>;

function buildAvailability({
  bracketType,
  picksByGameId,
}: {
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
}): {
  sanitizedPicks: PicksByGameId;
  availableTeamsByGameId: AvailabilityByGameId;
} {
  const sanitizedPicks = sanitizePicksForTemplate({ bracketType, picksByGameId });
  const availableTeamsByGameId: AvailabilityByGameId = {};
  const progressivePicks: PicksByGameId = {};

  for (const gameId of getTemplateGameIds(bracketType)) {
    const availableTeams = getAvailableTeamsForGame({
      bracketType,
      gameId,
      picksByGameId: progressivePicks,
    });

    availableTeamsByGameId[gameId] = availableTeams;

    const selectedPick = sanitizedPicks[gameId];
    if (!selectedPick) {
      continue;
    }

    if (availableTeams.some((teamOption) => teamOption.key === selectedPick.winnerTeamKey)) {
      progressivePicks[gameId] = selectedPick;
    }
  }

  return {
    sanitizedPicks: progressivePicks,
    availableTeamsByGameId,
  };
}

function toInitialScoreInputs(initialScoresByTeamKey: Record<string, number>) {
  const scoreInputs: Record<string, string> = {};

  for (const [teamKey, score] of Object.entries(initialScoresByTeamKey)) {
    scoreInputs[teamKey] = Number.isFinite(score) ? String(score) : "";
  }

  return scoreInputs;
}

export function BracketEditor({
  mode,
  bracketType,
  initialPicksByGameId,
  fieldErrors,
  initialScoresByTeamKey,
}: {
  mode: BracketEditorMode;
  bracketType: BracketType;
  initialPicksByGameId: PicksByGameId;
  fieldErrors?: Record<string, string[]>;
  initialScoresByTeamKey?: Record<string, number>;
}) {
  const isEditMode = mode === "edit";

  const [picksByGameId, setPicksByGameId] = useState<PicksByGameId>(
    sanitizePicksForTemplate({
      bracketType,
      picksByGameId: initialPicksByGameId,
    }),
  );

  const [scoreInputsByTeamKey, setScoreInputsByTeamKey] = useState<Record<string, string>>(
    toInitialScoreInputs(initialScoresByTeamKey ?? {}),
  );

  const { sanitizedPicks, availableTeamsByGameId } = useMemo(
    () =>
      buildAvailability({
        bracketType,
        picksByGameId,
      }),
    [bracketType, picksByGameId],
  );

  const rounds = getTemplateRoundConfigs(bracketType);

  const championshipRound = rounds.find((round) => round.key === "championship");
  const championshipGameId = championshipRound?.gameIds[0];
  const championshipTeams = championshipGameId
    ? availableTeamsByGameId[championshipGameId] ?? []
    : [];

  function onSelectWinner(gameId: string, winnerTeamKey: string) {
    if (!isEditMode) {
      return;
    }

    const nextPicks = sanitizePicksForTemplate({
      bracketType,
      picksByGameId: {
        ...picksByGameId,
        [gameId]: { winnerTeamKey },
      },
    });

    setPicksByGameId(nextPicks);
  }

  return (
    <section className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{BRACKET_TYPE_LABELS[bracketType]}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {mode}
        </span>
      </div>

      {rounds.map((round) => (
        <section key={round.key} className="space-y-3">
          <header>
            <h3 className="text-base font-semibold text-slate-900">
              {round.label}
              <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                ({round.gameIds.length} games)
              </span>
            </h3>
            <p className="text-xs text-slate-600">{round.description}</p>
          </header>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {round.gameIds.map((gameId) => {
              const game = getCanonicalGame(gameId);
              const availableTeams = availableTeamsByGameId[gameId] ?? [];
              const selectedWinnerTeamKey = sanitizedPicks[gameId]?.winnerTeamKey;
              const pickFieldKey = `pick.${gameId}`;
              const pickError = fieldErrors?.[pickFieldKey]?.[0];

              return (
                <article key={gameId} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 space-y-1">
                    <h4 className="font-medium text-slate-900">{game.slotLabel}</h4>
                    <p className="text-xs text-slate-500">
                      {game.region ? `${game.region} • ` : ""}
                      {game.id}
                    </p>
                  </div>

                  {availableTeams.length === 0 ? (
                    <p className="text-xs text-amber-700">
                      Select upstream winners to unlock this game.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableTeams.map((teamOption) => {
                        const checked = selectedWinnerTeamKey === teamOption.key;

                        if (isEditMode) {
                          return (
                            <label
                              key={teamOption.key}
                              className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm"
                            >
                              <input
                                type="radio"
                                name={pickFieldKey}
                                value={teamOption.key}
                                checked={checked}
                                onChange={() => onSelectWinner(gameId, teamOption.key)}
                              />
                              <span>{teamOption.label}</span>
                            </label>
                          );
                        }

                        return (
                          <div
                            key={teamOption.key}
                            className={`rounded-md border p-2 text-sm ${
                              checked
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-slate-200"
                            }`}
                          >
                            {teamOption.label}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {mode === "view" ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Winner: {selectedWinnerTeamKey ?? "Not selected"}
                    </p>
                  ) : null}

                  {pickError ? (
                    <p className="mt-2 text-xs text-red-700">{pickError}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {bracketType === "CHAMPIONSHIP" ? (
        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">Championship Score Guess</h3>
          <p className="mt-1 text-xs text-slate-600">
            Enter predicted final scores for both finalist team keys.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {championshipTeams.map((teamOption) => {
              const scoreFieldKey = `score.${teamOption.key}`;
              const scoreError = fieldErrors?.[scoreFieldKey]?.[0];

              if (isEditMode) {
                return (
                  <label key={teamOption.key} className="space-y-1 text-sm">
                    <span className="font-medium text-slate-800">{teamOption.label}</span>
                    <input
                      type="number"
                      name={scoreFieldKey}
                      min={0}
                      step={1}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                      value={scoreInputsByTeamKey[teamOption.key] ?? ""}
                      onChange={(event) =>
                        setScoreInputsByTeamKey((currentValue) => ({
                          ...currentValue,
                          [teamOption.key]: event.target.value,
                        }))
                      }
                    />
                    {scoreError ? (
                      <span className="block text-xs text-red-700">{scoreError}</span>
                    ) : null}
                  </label>
                );
              }

              const scoreValue =
                scoreInputsByTeamKey[teamOption.key] ??
                (typeof initialScoresByTeamKey?.[teamOption.key] === "number"
                  ? String(initialScoresByTeamKey[teamOption.key])
                  : "Not set");

              return (
                <div key={teamOption.key} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{teamOption.label}</p>
                  <p className="mt-1 text-slate-700">Predicted score: {scoreValue}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
