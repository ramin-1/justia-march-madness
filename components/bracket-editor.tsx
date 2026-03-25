"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  type BracketRoundKey,
  type CanonicalGameConfig,
  type TeamOption,
  type WinnerTeamKeyByGameId,
  getAvailableTeamsForGame,
  getCanonicalGame,
  getTeamLabel,
  getTemplateGameIds,
  getTemplateRoundConfigs,
  sanitizePicksForTemplate,
} from "@/lib/brackets/registry";
import {
  BRACKET_TYPE_LABELS,
  type BracketType,
  type PicksByGameId,
} from "@/lib/brackets/types";
import { isFinalGameResultStatus } from "@/lib/results/status";

type BracketEditorMode = "edit" | "view";
type RegionLayoutKey = "EAST" | "WEST" | "SOUTH" | "MIDWEST";

type AvailabilityByGameId = Record<string, ReturnType<typeof getAvailableTeamsForGame>>;
type GameResultByGameId = Record<
  string,
  {
    status: string | null;
    winnerTeamKey: string | null;
    winnerTeam: string | null;
  }
>;

type GameCardModel = {
  gameId: string;
  game: CanonicalGameConfig;
  availableTeams: TeamOption[];
  selectedWinnerTeamKey: string | null;
  pickFieldKey: string;
  pickError: string | null;
  isGameFinal: boolean;
  actualWinnerLabel: string | null;
  actualWinnerTeamKey: string | null;
};

type GameCardOptions = {
  compact?: boolean;
  connectorDirection?: "left" | "right" | "both" | null;
  className?: string;
  style?: CSSProperties;
};

const REGION_LAYOUTS: readonly { key: RegionLayoutKey; label: string }[] = [
  { key: "EAST", label: "East" },
  { key: "WEST", label: "West" },
  { key: "SOUTH", label: "South" },
  { key: "MIDWEST", label: "Midwest" },
];

type ConnectorPath = {
  id: string;
  d: string;
};

type TreeLayout = {
  width: number;
  height: number;
  positionedByGameId: Record<
    string,
    {
      gameId: string;
      left: number;
      top: number;
      centerX: number;
      centerY: number;
      cardWidth: number;
      cardHeight: number;
      columnIndex: number;
    }
  >;
  connectorPaths: ConnectorPath[];
};

const REGION_COLUMN_WIDTH = 172;
const REGION_CARD_WIDTH = 158;
const REGION_CARD_HEIGHT = 146;
const REGION_VERTICAL_STEP = 75;
const REGION_HEADER_OFFSET = 30;

const CENTER_CARD_WIDTH = 192;
const CENTER_CARD_HEIGHT = 126;
const CENTER_HEADER_OFFSET = 30;
const CENTER_FINALS_GAP = 36;
const TREE_LAYOUT_BOTTOM_PADDING = 18;

const BOARD_CONNECTOR_STROKE = "#cbd5e1";

const ROUND_LABEL_OVERRIDES: Partial<Record<BracketRoundKey, string>> = {
  round1: "R1",
  round2: "R2",
};

function buildAvailability({
  bracketType,
  picksByGameId,
  teamLabelOverridesByKey,
  sourceWinnerTeamKeyByGameId,
}: {
  bracketType: BracketType;
  picksByGameId: PicksByGameId;
  teamLabelOverridesByKey?: Record<string, string>;
  sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
}): {
  sanitizedPicks: PicksByGameId;
  availableTeamsByGameId: AvailabilityByGameId;
} {
  const sanitizedPicks = sanitizePicksForTemplate({
    bracketType,
    picksByGameId,
    sourceWinnerTeamKeyByGameId,
  });
  const availableTeamsByGameId: AvailabilityByGameId = {};
  const progressivePicks: PicksByGameId = {};

  for (const gameId of getTemplateGameIds(bracketType)) {
    const availableTeams = getAvailableTeamsForGame({
      bracketType,
      gameId,
      picksByGameId: progressivePicks,
      teamLabelOverridesByKey,
      sourceWinnerTeamKeyByGameId,
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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toInitialScoreInputs(initialScoresByTeamKey: Record<string, number>) {
  const scoreInputs: Record<string, string> = {};

  for (const [teamKey, score] of Object.entries(initialScoresByTeamKey)) {
    scoreInputs[teamKey] = Number.isFinite(score) ? String(score) : "";
  }

  return scoreInputs;
}

function useIsXlViewport() {
  const [isXlViewport, setIsXlViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const updateViewport = () => setIsXlViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  return isXlViewport;
}

function getCenterIndex({
  depth,
  gameIndex,
}: {
  depth: number;
  gameIndex: number;
}) {
  return (2 ** depth - 1) + gameIndex * 2 ** (depth + 1);
}

function buildTreeLayout({
  displayRoundKeys,
  canonicalRoundKeys,
  gameIdsByRoundKey,
  gameCardsById,
  columnWidth,
  cardWidth,
  cardHeight,
  verticalStep,
}: {
  displayRoundKeys: readonly BracketRoundKey[];
  canonicalRoundKeys: readonly BracketRoundKey[];
  gameIdsByRoundKey: Partial<Record<BracketRoundKey, string[]>>;
  gameCardsById: Record<string, GameCardModel>;
  columnWidth: number;
  cardWidth: number;
  cardHeight: number;
  verticalStep: number;
}): TreeLayout {
  const positionedByGameId: TreeLayout["positionedByGameId"] = {};
  const depthByRoundKey = new Map<BracketRoundKey, number>();
  const columnByRoundKey = new Map<BracketRoundKey, number>();

  canonicalRoundKeys.forEach((roundKey, depthIndex) => {
    depthByRoundKey.set(roundKey, depthIndex);
  });

  displayRoundKeys.forEach((roundKey, columnIndex) => {
    columnByRoundKey.set(roundKey, columnIndex);
  });

  for (const roundKey of canonicalRoundKeys) {
    const roundGameIds = gameIdsByRoundKey[roundKey] ?? [];
    const depth = depthByRoundKey.get(roundKey) ?? 0;
    const columnIndex = columnByRoundKey.get(roundKey) ?? 0;
    const left = columnIndex * columnWidth + (columnWidth - cardWidth) / 2;

    roundGameIds.forEach((gameId, gameIndex) => {
      if (!gameCardsById[gameId]) {
        return;
      }

      const centerIndex = getCenterIndex({
        depth,
        gameIndex,
      });
      const top = centerIndex * verticalStep;

      positionedByGameId[gameId] = {
        gameId,
        left,
        top,
        centerX: left + cardWidth / 2,
        centerY: top + cardHeight / 2,
        cardWidth,
        cardHeight,
        columnIndex,
      };
    });
  }

  const maxDepth = Math.max(canonicalRoundKeys.length - 1, 0);
  const maxCenterIndex = 2 ** (maxDepth + 1) - 2;
  const width = Math.max(displayRoundKeys.length, 1) * columnWidth;
  const theoreticalHeight = Math.max(cardHeight, maxCenterIndex * verticalStep + cardHeight);
  const positionedGames = Object.values(positionedByGameId);
  const maxCardBottom = positionedGames.reduce((maxBottom, positionedGame) => {
    return Math.max(maxBottom, positionedGame.top + positionedGame.cardHeight);
  }, cardHeight);
  const height = Math.max(theoreticalHeight, maxCardBottom) + TREE_LAYOUT_BOTTOM_PADDING;
  const connectorPaths: ConnectorPath[] = [];

  for (const positionedGame of Object.values(positionedByGameId)) {
    const game = gameCardsById[positionedGame.gameId]?.game;
    if (!game?.sourceGameIds || game.sourceGameIds.length === 0) {
      continue;
    }

    for (const sourceGameId of game.sourceGameIds) {
      const sourceGame = positionedByGameId[sourceGameId];
      if (!sourceGame || sourceGame.columnIndex === positionedGame.columnIndex) {
        continue;
      }

      const sourceIsLeft = sourceGame.centerX < positionedGame.centerX;
      const sourceX = sourceIsLeft
        ? sourceGame.left + sourceGame.cardWidth
        : sourceGame.left;
      const targetX = sourceIsLeft
        ? positionedGame.left
        : positionedGame.left + positionedGame.cardWidth;
      const elbowX = sourceIsLeft
        ? sourceX + (targetX - sourceX) * 0.55
        : sourceX - (sourceX - targetX) * 0.55;

      connectorPaths.push({
        id: `${sourceGameId}->${positionedGame.gameId}`,
        d: `M ${sourceX} ${sourceGame.centerY} H ${elbowX} V ${positionedGame.centerY} H ${targetX}`,
      });
    }
  }

  return {
    width,
    height,
    positionedByGameId,
    connectorPaths,
  };
}

export function BracketEditor({
  mode,
  bracketType,
  initialPicksByGameId,
  fieldErrors,
  initialScoresByTeamKey,
  teamLabelOverridesByKey,
  actualGameResultsByGameId,
  sourceWinnerTeamKeyByGameId,
}: {
  mode: BracketEditorMode;
  bracketType: BracketType;
  initialPicksByGameId: PicksByGameId;
  fieldErrors?: Record<string, string[]>;
  initialScoresByTeamKey?: Record<string, number>;
  teamLabelOverridesByKey?: Record<string, string>;
  actualGameResultsByGameId?: GameResultByGameId;
  sourceWinnerTeamKeyByGameId?: WinnerTeamKeyByGameId;
}) {
  const isEditMode = mode === "edit";
  const isXlViewport = useIsXlViewport();

  const resolvedSourceWinnerTeamKeyByGameId = useMemo(() => {
    const resolved: WinnerTeamKeyByGameId = {
      ...(sourceWinnerTeamKeyByGameId ?? {}),
    };

    for (const [gameId, gameResult] of Object.entries(actualGameResultsByGameId ?? {})) {
      if (!isFinalGameResultStatus(gameResult.status)) {
        continue;
      }

      if (typeof gameResult.winnerTeamKey === "string" && gameResult.winnerTeamKey.length > 0) {
        resolved[gameId] = gameResult.winnerTeamKey;
      }
    }

    return resolved;
  }, [actualGameResultsByGameId, sourceWinnerTeamKeyByGameId]);

  const [picksByGameId, setPicksByGameId] = useState<PicksByGameId>(
    sanitizePicksForTemplate({
      bracketType,
      picksByGameId: initialPicksByGameId,
      sourceWinnerTeamKeyByGameId: resolvedSourceWinnerTeamKeyByGameId,
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
        teamLabelOverridesByKey,
        sourceWinnerTeamKeyByGameId: resolvedSourceWinnerTeamKeyByGameId,
      }),
    [
      bracketType,
      picksByGameId,
      resolvedSourceWinnerTeamKeyByGameId,
      teamLabelOverridesByKey,
    ],
  );

  const rounds = getTemplateRoundConfigs(bracketType);
  const gameIds = useMemo(() => getTemplateGameIds(bracketType), [bracketType]);

  const roundByKey = useMemo(() => {
    const nextRoundByKey: Partial<Record<BracketRoundKey, string[]>> = {};

    for (const round of rounds) {
      nextRoundByKey[round.key] = [...round.gameIds];
    }

    return nextRoundByKey;
  }, [rounds]);

  const gameCardsById = useMemo(() => {
    const nextGameCardsById: Record<string, GameCardModel> = {};

    for (const gameId of gameIds) {
      const game = getCanonicalGame(gameId);
      const availableTeams = availableTeamsByGameId[gameId] ?? [];
      const selectedWinnerTeamKey = sanitizedPicks[gameId]?.winnerTeamKey ?? null;
      const gameResult = actualGameResultsByGameId?.[gameId];
      const isGameFinal = isFinalGameResultStatus(gameResult?.status);
      const actualWinnerTeamKey = gameResult?.winnerTeamKey ?? null;
      const actualWinnerLabel = isGameFinal
        ? actualWinnerTeamKey
          ? getTeamLabel(actualWinnerTeamKey, teamLabelOverridesByKey)
          : gameResult?.winnerTeam?.trim() || null
        : null;
      const pickFieldKey = `pick.${gameId}`;
      const pickError = fieldErrors?.[pickFieldKey]?.[0] ?? null;

      nextGameCardsById[gameId] = {
        gameId,
        game,
        availableTeams,
        selectedWinnerTeamKey,
        pickFieldKey,
        pickError,
        isGameFinal,
        actualWinnerLabel,
        actualWinnerTeamKey,
      };
    }

    return nextGameCardsById;
  }, [
    actualGameResultsByGameId,
    availableTeamsByGameId,
    fieldErrors,
    gameIds,
    sanitizedPicks,
    teamLabelOverridesByKey,
  ]);

  const championshipRound = rounds.find((round) => round.key === "championship");
  const championshipGameId = championshipRound?.gameIds[0];
  const championshipTeams = championshipGameId
    ? availableTeamsByGameId[championshipGameId] ?? []
    : [];
  const championshipScoreError = fieldErrors?.championshipScore?.[0] ?? null;
  const isTraditionalLayout = bracketType !== "CHAMPIONSHIP";
  const showDesktopBoard = isTraditionalLayout && isXlViewport;
  const showStackedLayout = !isTraditionalLayout || !isXlViewport;
  const regionRoundKeys: readonly BracketRoundKey[] = bracketType === "MAIN"
    ? ["round1", "round2", "sweet16", "elite8"]
    : ["sweet16", "elite8"];

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
      sourceWinnerTeamKeyByGameId: resolvedSourceWinnerTeamKeyByGameId,
    });

    setPicksByGameId(nextPicks);
  }

  function getRoundGameIds(roundKey: BracketRoundKey) {
    return roundByKey[roundKey] ?? [];
  }

  function getRoundLabel(roundKey: BracketRoundKey) {
    return rounds.find((round) => round.key === roundKey)?.label ?? roundKey;
  }

  function getRoundDisplayLabel(roundKey: BracketRoundKey) {
    return ROUND_LABEL_OVERRIDES[roundKey] ?? getRoundLabel(roundKey);
  }

  function getRegionGameIds(regionLabel: string, roundKey: BracketRoundKey) {
    return getRoundGameIds(roundKey).filter(
      (gameId) => gameCardsById[gameId]?.game.region === regionLabel,
    );
  }

  function renderGameCard(gameId: string, options?: GameCardOptions) {
    const gameCard = gameCardsById[gameId];

    if (!gameCard) {
      return null;
    }

    const compact = options?.compact ?? false;
    const connectorDirection = options?.connectorDirection ?? null;
    const wrapperClassName = options?.className ?? "";
    const wrapperStyle = options?.style;
    const usesAbsolutePosition = wrapperClassName.split(/\s+/).includes("absolute");

    return (
      <div
        key={gameId}
        className={cx(!usesAbsolutePosition && "relative", wrapperClassName)}
        style={wrapperStyle}
      >
          <article
            className={cx(
              "print-break-avoid rounded-md border border-slate-300/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)]",
              compact ? "h-full p-3 print:p-2" : "p-3 sm:p-4 print:p-2",
            )}
          >
          <div className={cx("space-y-1", compact ? "mb-2" : "mb-2.5")}>
            <h4 className={cx("font-semibold text-slate-900", compact ? "text-xs leading-tight" : "text-sm")}>
              {gameCard.game.slotLabel}
            </h4>
            {!compact ? (
              <p className={cx("text-slate-500", "text-xs")}>
                {gameCard.game.region ? `${gameCard.game.region} • ` : ""}
                {gameCard.game.id}
              </p>
            ) : null}
          </div>

          {gameCard.availableTeams.length === 0 ? (
            <p className="text-xs text-amber-700">
              Select upstream winners to unlock this game.
            </p>
          ) : (
            <div className={cx("space-y-2", compact && "space-y-1")}>
              {gameCard.availableTeams.map((teamOption) => {
                const checked = gameCard.selectedWinnerTeamKey === teamOption.key;

                if (isEditMode) {
                  return (
                    <label
                      key={teamOption.key}
                      className={cx(
                        "flex items-center gap-2 rounded border border-slate-200/90 text-slate-900",
                        compact ? "p-2 text-xs leading-tight" : "p-2 text-sm print:p-1",
                      )}
                    >
                      <input
                        type="radio"
                        name={gameCard.pickFieldKey}
                        value={teamOption.key}
                        checked={checked}
                        onChange={() => onSelectWinner(gameCard.gameId, teamOption.key)}
                      />
                      <span>{teamOption.label}</span>
                    </label>
                  );
                }

                const selectedClass = checked
                  ? !gameCard.isGameFinal || !gameCard.actualWinnerTeamKey
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : gameCard.actualWinnerTeamKey === teamOption.key
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-rose-300 bg-rose-50 text-rose-900"
                  : "border-slate-200";

                return (
                  <div
                    key={teamOption.key}
                    className={cx(
                      "rounded border text-slate-900",
                      compact ? "p-2 text-xs leading-tight" : "p-2 text-sm print:p-1",
                      selectedClass,
                    )}
                  >
                    {teamOption.label}
                  </div>
                );
              })}
            </div>
          )}

          {mode === "view" && gameCard.actualWinnerLabel ? (
            <p className={cx("text-slate-600 print:mt-1", compact ? "mt-1 text-[11px]" : "mt-1 text-xs")}>
              Winner: {gameCard.actualWinnerLabel}
            </p>
          ) : null}

          {gameCard.pickError ? (
            <p className="mt-2 text-xs text-red-700">{gameCard.pickError}</p>
          ) : null}
        </article>

        {connectorDirection && connectorDirection !== "left" ? (
          <span
            className={cx(
              "pointer-events-none absolute top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 2xl:block print:block",
              "-right-5",
            )}
          />
        ) : null}

        {connectorDirection && connectorDirection !== "right" ? (
          <span
            className="pointer-events-none absolute top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 2xl:block print:block -left-5"
          />
        ) : null}
      </div>
    );
  }

  function renderRegionBracket({
    regionKey,
    mirrored,
  }: {
    regionKey: RegionLayoutKey;
    mirrored: boolean;
  }) {
    const region = REGION_LAYOUTS.find((layoutRegion) => layoutRegion.key === regionKey);
    if (!region) {
      return null;
    }

    const displayRoundKeys = mirrored
      ? [...regionRoundKeys].reverse()
      : [...regionRoundKeys];

    const gameIdsByRoundKey: Partial<Record<BracketRoundKey, string[]>> = {};
    for (const roundKey of regionRoundKeys) {
      gameIdsByRoundKey[roundKey] = getRegionGameIds(region.label, roundKey);
    }

    const treeLayout = buildTreeLayout({
      displayRoundKeys,
      canonicalRoundKeys: regionRoundKeys,
      gameIdsByRoundKey,
      gameCardsById,
      columnWidth: REGION_COLUMN_WIDTH,
      cardWidth: REGION_CARD_WIDTH,
      cardHeight: REGION_CARD_HEIGHT,
      verticalStep: REGION_VERTICAL_STEP,
    });

    return (
      <section className="mx-auto w-fit rounded-xl border border-slate-200/80 bg-white/70 p-4 print:border-slate-300 print:bg-white">
        <header className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            {region.label} Region
          </h3>
        </header>

        <div
          className="relative mx-auto"
          style={{
            width: treeLayout.width,
            height: treeLayout.height + REGION_HEADER_OFFSET,
          }}
        >
          <div
            className="absolute left-0 top-0 grid gap-0"
            style={{
              width: treeLayout.width,
              gridTemplateColumns: `repeat(${displayRoundKeys.length}, ${REGION_COLUMN_WIDTH}px)`,
            }}
          >
            {displayRoundKeys.map((roundKey) => (
              <p
                key={`${region.key}-${roundKey}-label`}
                className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                {getRoundDisplayLabel(roundKey)}
              </p>
            ))}
          </div>

          <svg
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: treeLayout.width,
              height: treeLayout.height + REGION_HEADER_OFFSET,
            }}
            viewBox={`0 0 ${treeLayout.width} ${treeLayout.height + REGION_HEADER_OFFSET}`}
            aria-hidden="true"
          >
            {treeLayout.connectorPaths.map((connectorPath) => (
              <path
                key={`${region.key}-${connectorPath.id}`}
                d={connectorPath.d}
                transform={`translate(0 ${REGION_HEADER_OFFSET})`}
                fill="none"
                stroke={BOARD_CONNECTOR_STROKE}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          <div className="absolute left-0 top-0" style={{ width: treeLayout.width }}>
            {Object.values(treeLayout.positionedByGameId).map((positionedGame) =>
              renderGameCard(positionedGame.gameId, {
                compact: true,
                className: "absolute z-10",
                style: {
                  top: positionedGame.top + REGION_HEADER_OFFSET,
                  left: positionedGame.left,
                  width: positionedGame.cardWidth,
                  height: positionedGame.cardHeight,
                },
              }),
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderCenterFinalsColumn() {
    const semifinalGameIds = getRoundGameIds("final4");
    const championshipGameId = getRoundGameIds("championship")[0] ?? null;
    const semifinal1GameId = semifinalGameIds[0] ?? null;
    const semifinal2GameId = semifinalGameIds[1] ?? null;

    if (!semifinal1GameId || !semifinal2GameId || !championshipGameId) {
      return null;
    }

    const semifinal1Left = 0;
    const championshipLeft = CENTER_CARD_WIDTH + CENTER_FINALS_GAP;
    const semifinal2Left = championshipLeft + CENTER_CARD_WIDTH + CENTER_FINALS_GAP;
    const cardsTop = CENTER_HEADER_OFFSET;
    const boardWidth = semifinal2Left + CENTER_CARD_WIDTH;
    const boardHeight = cardsTop + CENTER_CARD_HEIGHT + TREE_LAYOUT_BOTTOM_PADDING;
    const centerY = cardsTop + CENTER_CARD_HEIGHT / 2;

    const connectorPaths: ConnectorPath[] = [
      {
        id: `${semifinal1GameId}->${championshipGameId}`,
        d: `M ${semifinal1Left + CENTER_CARD_WIDTH} ${centerY} H ${championshipLeft}`,
      },
      {
        id: `${semifinal2GameId}->${championshipGameId}`,
        d: `M ${semifinal2Left} ${centerY} H ${championshipLeft + CENTER_CARD_WIDTH}`,
      },
    ];

    return (
      <section className="rounded-xl border border-slate-300 bg-white/90 p-4 shadow-sm print:border-slate-300 print:bg-white">
        <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
          Final Four & Championship
        </h3>

        <div
          className="relative mx-auto"
          style={{
            width: boardWidth,
            height: boardHeight,
          }}
        >
          <div
            className="absolute left-0 top-0 grid gap-0"
            style={{
              width: boardWidth,
              gridTemplateColumns: `repeat(3, ${CENTER_CARD_WIDTH}px)`,
              columnGap: CENTER_FINALS_GAP,
            }}
          >
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Semifinal 1
            </p>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {getRoundDisplayLabel("championship")}
            </p>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Semifinal 2
            </p>
          </div>

          <svg
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: boardWidth,
              height: boardHeight,
            }}
            viewBox={`0 0 ${boardWidth} ${boardHeight}`}
            aria-hidden="true"
          >
            {connectorPaths.map((connectorPath) => (
              <path
                key={`center-${connectorPath.id}`}
                d={connectorPath.d}
                fill="none"
                stroke={BOARD_CONNECTOR_STROKE}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          <div className="absolute left-0 top-0" style={{ width: boardWidth }}>
            {renderGameCard(semifinal1GameId, {
              compact: true,
              className: "absolute z-10",
              style: {
                top: cardsTop,
                left: semifinal1Left,
                width: CENTER_CARD_WIDTH,
                height: CENTER_CARD_HEIGHT,
              },
            })}
            {renderGameCard(championshipGameId, {
              compact: true,
              className: "absolute z-10",
              style: {
                top: cardsTop,
                left: championshipLeft,
                width: CENTER_CARD_WIDTH,
                height: CENTER_CARD_HEIGHT,
              },
            })}
            {renderGameCard(semifinal2GameId, {
              compact: true,
              className: "absolute z-10",
              style: {
                top: cardsTop,
                left: semifinal2Left,
                width: CENTER_CARD_WIDTH,
                height: CENTER_CARD_HEIGHT,
              },
            })}
          </div>
        </div>
      </section>
    );
  }

  function renderTraditionalDesktopLayout() {
    const playInGameIds = bracketType === "MAIN" ? getRoundGameIds("playIn") : [];

    return (
      <div className="hidden xl:block print:block">
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-100/60 to-white p-4 sm:p-5 print:border-slate-300 print:bg-white">
          {playInGameIds.length > 0 ? (
            <section className="mx-auto mb-7 max-w-6xl rounded-xl border border-slate-200/80 bg-white/80 p-3 print:mb-4">
              <header className="mb-3 flex items-center justify-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  {getRoundLabel("playIn")}
                </h3>
              </header>
              <div className="grid grid-cols-4 gap-3 print:gap-2">
                {playInGameIds.map((gameId) =>
                  renderGameCard(gameId, { compact: true }),
                )}
              </div>
            </section>
          ) : null}

          <div className="relative">
            <div className="grid grid-cols-2 gap-x-12 gap-y-64 print:gap-x-4 print:gap-y-36">
              <div className="flex justify-center">{renderRegionBracket({ regionKey: "EAST", mirrored: false })}</div>
              <div className="flex justify-center">{renderRegionBracket({ regionKey: "WEST", mirrored: true })}</div>
              <div className="flex justify-center">{renderRegionBracket({ regionKey: "SOUTH", mirrored: false })}</div>
              <div className="flex justify-center">{renderRegionBracket({ regionKey: "MIDWEST", mirrored: true })}</div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-auto">{renderCenterFinalsColumn()}</div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderStackedRoundLayout() {
    return (
      <div className={cx(isTraditionalLayout && "xl:hidden")}>
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-2">
              {round.gameIds.map((gameId) => renderGameCard(gameId))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-xl border bg-white p-4 shadow-sm sm:p-6 print:space-y-4 print:border-0 print:bg-transparent print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold print:text-base">{BRACKET_TYPE_LABELS[bracketType]}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 print-hide">
          {mode}
        </span>
      </div>

      {showDesktopBoard ? renderTraditionalDesktopLayout() : null}
      {showStackedLayout ? renderStackedRoundLayout() : null}

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

          {championshipScoreError ? (
            <p className="mt-3 text-sm text-red-700">{championshipScoreError}</p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
