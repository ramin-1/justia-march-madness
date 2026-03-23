type RegionValue = "East" | "West" | "South" | "Midwest";

type TeamExtraction = {
  name: string;
  seed: number | null;
  score: number | null;
  isWinner: boolean | null;
};

type GameExtraction = {
  externalId?: string;
  status: "final";
  playedAt?: string;
  roundLabel?: string;
  regionLabel?: RegionValue | null;
  winnerTeam: string;
  teams: [TeamExtraction, TeamExtraction];
};

const DEFAULT_NCAA_SCORES_BASE_URL = "https://www.ncaa.com/march-madness-live/scores/";
const DEFAULT_NCAA_FETCH_TIMEOUT_MS = 15000;
const FINAL_STATUS_PATTERNS = ["final", "completed", "complete", "post", "ended"] as const;
const TEAM_ARRAY_KEYS = ["competitors", "teams", "participants", "contestants", "opponents"] as const;
const TEAM_NAME_KEYS = ["name", "displayName", "shortName", "fullName", "teamName", "school"] as const;
const ROUND_KEYS = ["round", "roundName", "stage", "stageName"] as const;
const REGION_KEYS = ["region", "regionName", "bracketRegion", "conference"] as const;
const FINAL_LINK_PREFIX_PATTERN = /^final\b/i;
const SEEDED_FINAL_LINK_PATTERN =
  /^final(?:\s*-\s*[a-z0-9 ]+)?\s+(\d{1,2})\s+(.+?)\s+(\d{1,3})\s+(\d{1,2})\s+(.+?)\s+(\d{1,3})(?:\s+(.*))?$/i;
const UNSEEDED_FINAL_LINK_PATTERN =
  /^final(?:\s*-\s*[a-z0-9 ]+)?\s+(.+?)\s+(\d{1,3})\s+(.+?)\s+(\d{1,3})(?:\s+(.*))?$/i;

const ROUND_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bfirst four\b|\bplay[- ]?in\b/i, label: "First Four" },
  { pattern: /\bfirst round\b|\bround of 64\b/i, label: "First Round" },
  { pattern: /\bsecond round\b|\bround of 32\b/i, label: "Second Round" },
  { pattern: /\bsweet 16\b|\bsweet sixteen\b/i, label: "Sweet 16" },
  { pattern: /\belite 8\b|\belite eight\b/i, label: "Elite Eight" },
  { pattern: /\bfinal four\b|\bsemifinal\b/i, label: "Final Four" },
  { pattern: /\bchampionship\b|\btitle game\b/i, label: "Championship" },
];

export type ScrapedResult = {
  externalId?: string;
  homeTeam: string;
  awayTeam: string;
  homeSeed: number | null;
  awaySeed: number | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeam: string;
  status: "final";
  playedAt?: string;
  roundLabel?: string;
  regionLabel?: RegionValue | null;
};

export type ParsedGamesDebugInfo = {
  parserPath: "json" | "html-fallback" | "none";
  jsonBlocksFound: number;
  jsonCandidates: number;
  htmlFallbackCandidates: number;
  htmlFallbackParsedCandidates: number;
  normalizedParsedGames: number;
};

export type ParsedGamesResult = {
  games: ScrapedResult[];
  debug: ParsedGamesDebugInfo;
};

export type NcaaScoresFetchOptions = {
  targetDate?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseSafeInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseSeed(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/(\d{1,2})/);
  return match ? Number(match[1]) : null;
}

function normalizeRegionLabel(value: string | null): RegionValue | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("midwest")) {
    return "Midwest";
  }

  if (normalized.includes("east")) {
    return "East";
  }

  if (normalized.includes("west")) {
    return "West";
  }

  if (normalized.includes("south")) {
    return "South";
  }

  return null;
}

function getStringFromKeys(record: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = toNonEmptyString(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function parseTeamEntity(raw: unknown): TeamExtraction | null {
  if (!isRecord(raw)) {
    const asString = toNonEmptyString(raw);
    if (!asString) {
      return null;
    }

    return {
      name: asString,
      seed: null,
      score: null,
      isWinner: null,
    };
  }

  const nestedTeam = isRecord(raw.team) ? raw.team : null;
  const name =
    getStringFromKeys(raw, TEAM_NAME_KEYS) ??
    (nestedTeam ? getStringFromKeys(nestedTeam, TEAM_NAME_KEYS) : null);

  if (!name) {
    return null;
  }

  const seed =
    parseSeed(raw.seed) ??
    parseSeed(raw.rank) ??
    parseSeed(raw.seedNumber) ??
    (nestedTeam ? parseSeed(nestedTeam.seed) ?? parseSeed(nestedTeam.rank) : null);

  const score =
    parseSafeInteger(raw.score) ??
    parseSafeInteger(raw.points) ??
    parseSafeInteger(raw.totalScore) ??
    (isRecord(raw.score) ? parseSafeInteger(raw.score.value) : null) ??
    (nestedTeam ? parseSafeInteger(nestedTeam.score) ?? parseSafeInteger(nestedTeam.points) : null);

  const winnerFlagRaw =
    raw.isWinner ??
    raw.winner ??
    raw.won ??
    (nestedTeam ? nestedTeam.isWinner ?? nestedTeam.winner ?? nestedTeam.won : null);
  const isWinner =
    typeof winnerFlagRaw === "boolean"
      ? winnerFlagRaw
      : typeof winnerFlagRaw === "string"
        ? winnerFlagRaw.trim().toLowerCase() === "true"
        : null;

  return {
    name,
    seed,
    score,
    isWinner,
  };
}

function parseHomeAwayTeams(record: Record<string, unknown>): [TeamExtraction, TeamExtraction] | null {
  const homeRaw = record.homeTeam ?? record.home ?? record.team1;
  const awayRaw = record.awayTeam ?? record.away ?? record.team2;

  if (homeRaw === undefined || awayRaw === undefined) {
    return null;
  }

  const homeTeam = parseTeamEntity(homeRaw);
  const awayTeam = parseTeamEntity(awayRaw);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const homeScore = parseSafeInteger(record.homeScore) ?? homeTeam.score;
  const awayScore = parseSafeInteger(record.awayScore) ?? awayTeam.score;

  return [
    { ...homeTeam, score: homeScore },
    { ...awayTeam, score: awayScore },
  ];
}

function parseTeamArray(record: Record<string, unknown>): [TeamExtraction, TeamExtraction] | null {
  for (const key of TEAM_ARRAY_KEYS) {
    const arrayValue = record[key];
    if (!Array.isArray(arrayValue) || arrayValue.length < 2) {
      continue;
    }

    const firstTeam = parseTeamEntity(arrayValue[0]);
    const secondTeam = parseTeamEntity(arrayValue[1]);

    if (!firstTeam || !secondTeam) {
      continue;
    }

    const firstRecord = isRecord(arrayValue[0]) ? arrayValue[0] : null;
    const secondRecord = isRecord(arrayValue[1]) ? arrayValue[1] : null;
    const firstHomeAway = toNonEmptyString(firstRecord?.homeAway)?.toLowerCase();
    const secondHomeAway = toNonEmptyString(secondRecord?.homeAway)?.toLowerCase();

    if (firstHomeAway === "away" && secondHomeAway === "home") {
      return [secondTeam, firstTeam];
    }

    return [firstTeam, secondTeam];
  }

  return null;
}

function extractStatusText(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const directStatus =
    toNonEmptyString(value.status) ??
    toNonEmptyString(value.state) ??
    toNonEmptyString(value.phase) ??
    toNonEmptyString(value.displayStatus);

  if (directStatus) {
    return directStatus;
  }

  if (isRecord(value.status)) {
    const nestedStatus =
      toNonEmptyString(value.status.description) ??
      toNonEmptyString(value.status.detail) ??
      toNonEmptyString(value.status.type) ??
      toNonEmptyString(value.status.state);

    if (nestedStatus) {
      return nestedStatus;
    }
  }

  return null;
}

function isFinalStatus(statusText: string | null, record: Record<string, unknown>): boolean {
  if (statusText) {
    const normalized = statusText.toLowerCase();
    if (FINAL_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      return true;
    }
  }

  return (
    record.completed === true ||
    record.isCompleted === true ||
    record.final === true ||
    record.isFinal === true
  );
}

function resolveWinnerName(
  record: Record<string, unknown>,
  teams: [TeamExtraction, TeamExtraction],
): string | null {
  const [homeTeam, awayTeam] = teams;

  const explicitWinnerName =
    toNonEmptyString(record.winnerTeam) ??
    toNonEmptyString(record.winner) ??
    toNonEmptyString(record.winningTeam) ??
    (isRecord(record.winnerTeam) ? getStringFromKeys(record.winnerTeam, TEAM_NAME_KEYS) : null) ??
    (isRecord(record.winner) ? getStringFromKeys(record.winner, TEAM_NAME_KEYS) : null);

  if (explicitWinnerName) {
    return explicitWinnerName;
  }

  if (homeTeam.isWinner === true && awayTeam.isWinner !== true) {
    return homeTeam.name;
  }

  if (awayTeam.isWinner === true && homeTeam.isWinner !== true) {
    return awayTeam.name;
  }

  if (
    typeof homeTeam.score === "number" &&
    typeof awayTeam.score === "number" &&
    homeTeam.score !== awayTeam.score
  ) {
    return homeTeam.score > awayTeam.score ? homeTeam.name : awayTeam.name;
  }

  return null;
}

function extractGameFromRecord(record: Record<string, unknown>): GameExtraction | null {
  const teams = parseHomeAwayTeams(record) ?? parseTeamArray(record);
  if (!teams) {
    return null;
  }

  const statusText = extractStatusText(record.status ?? record);

  if (!isFinalStatus(statusText, record)) {
    return null;
  }

  const winnerName = resolveWinnerName(record, teams);
  if (!winnerName) {
    return null;
  }

  const roundLabel = getStringFromKeys(record, ROUND_KEYS) ?? undefined;
  const regionRaw = getStringFromKeys(record, REGION_KEYS);
  const regionLabel = normalizeRegionLabel(regionRaw);
  const playedAt =
    toNonEmptyString(record.playedAt) ??
    toNonEmptyString(record.startDate) ??
    toNonEmptyString(record.gameDate) ??
    undefined;
  const externalId =
    toNonEmptyString(record.externalId) ??
    toNonEmptyString(record.gameId) ??
    toNonEmptyString(record.id) ??
    undefined;

  const [homeTeam, awayTeam] = teams;
  const homeScore = homeTeam.score;
  const awayScore = awayTeam.score;

  if (homeScore === null || awayScore === null) {
    return null;
  }

  if (homeScore === awayScore) {
    return null;
  }

  return {
    externalId,
    status: "final",
    playedAt,
    roundLabel,
    regionLabel,
    winnerTeam: winnerName,
    teams,
  };
}

function collectGameExtractions(value: unknown, output: GameExtraction[]) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectGameExtractions(item, output);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const extracted = extractGameFromRecord(value);
  if (extracted) {
    output.push(extracted);
  }

  for (const childValue of Object.values(value)) {
    collectGameExtractions(childValue, output);
  }
}

function extractJsonBlocksFromHtml(html: string): string[] {
  const blocks: string[] = [];
  const scriptTagPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = scriptTagPattern.exec(html);

  while (match) {
    const attributes = match[1] ?? "";
    const body = (match[2] ?? "").trim();
    const hasJsonType = /type=["']application\/(?:ld\+)?json["']/i.test(attributes);
    const hasNextDataId = /id=["']__NEXT_DATA__["']/i.test(attributes);

    if (body.length > 0 && (hasJsonType || hasNextDataId)) {
      blocks.push(body);
    }

    match = scriptTagPattern.exec(html);
  }

  return blocks;
}

function parseJsonBlock(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, group: string) => {
    const normalized = group.toLowerCase();

    if (normalized === "amp") {
      return "&";
    }

    if (normalized === "apos") {
      return "'";
    }

    if (normalized === "quot") {
      return "\"";
    }

    if (normalized === "nbsp") {
      return " ";
    }

    if (normalized === "lt") {
      return "<";
    }

    if (normalized === "gt") {
      return ">";
    }

    if (normalized.startsWith("#x")) {
      const parsed = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }

    if (normalized.startsWith("#")) {
      const parsed = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }

    return entity;
  });
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractAnchorTextsFromHtml(html: string): string[] {
  const texts: string[] = [];
  const anchorPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let match = anchorPattern.exec(html);

  while (match) {
    const htmlBody = match[1] ?? "";
    const text = collapseWhitespace(decodeHtmlEntities(stripHtmlTags(htmlBody)));
    if (text.length > 0) {
      texts.push(text);
    }
    match = anchorPattern.exec(html);
  }

  return texts;
}

function inferRoundLabel(value: string): string | undefined {
  for (const roundPattern of ROUND_PATTERNS) {
    if (roundPattern.pattern.test(value)) {
      return roundPattern.label;
    }
  }

  return undefined;
}

function inferRegionLabel(value: string): RegionValue | null {
  const regionMatch = value.match(/\b(east|west|south|midwest)\b/i);
  return normalizeRegionLabel(regionMatch?.[1] ?? null);
}

function parseFinalGameFromAnchorText(text: string): ScrapedResult | null {
  if (!FINAL_LINK_PREFIX_PATTERN.test(text)) {
    return null;
  }

  const seededMatch = text.match(SEEDED_FINAL_LINK_PATTERN);
  if (seededMatch) {
    const [
      ,
      homeSeedRaw,
      homeTeamRaw,
      homeScoreRaw,
      awaySeedRaw,
      awayTeamRaw,
      awayScoreRaw,
      trailingMetaRaw = "",
    ] = seededMatch;
    const homeScore = parseSafeInteger(homeScoreRaw);
    const awayScore = parseSafeInteger(awayScoreRaw);

    if (homeScore === null || awayScore === null || homeScore === awayScore) {
      return null;
    }

    const homeTeam = collapseWhitespace(homeTeamRaw);
    const awayTeam = collapseWhitespace(awayTeamRaw);
    const trailingMeta = collapseWhitespace(trailingMetaRaw);
    const winnerTeam = homeScore > awayScore ? homeTeam : awayTeam;
    const roundLabel = inferRoundLabel(trailingMeta || text);
    const regionLabel = inferRegionLabel(trailingMeta || text);

    return {
      homeTeam,
      awayTeam,
      homeSeed: parseSeed(homeSeedRaw),
      awaySeed: parseSeed(awaySeedRaw),
      homeScore,
      awayScore,
      winnerTeam,
      status: "final",
      roundLabel,
      regionLabel,
    };
  }

  const unseededMatch = text.match(UNSEEDED_FINAL_LINK_PATTERN);
  if (!unseededMatch) {
    return null;
  }

  const [, homeTeamRaw, homeScoreRaw, awayTeamRaw, awayScoreRaw, trailingMetaRaw = ""] = unseededMatch;
  const homeScore = parseSafeInteger(homeScoreRaw);
  const awayScore = parseSafeInteger(awayScoreRaw);

  if (homeScore === null || awayScore === null || homeScore === awayScore) {
    return null;
  }

  const homeTeam = collapseWhitespace(homeTeamRaw);
  const awayTeam = collapseWhitespace(awayTeamRaw);
  const trailingMeta = collapseWhitespace(trailingMetaRaw);
  const winnerTeam = homeScore > awayScore ? homeTeam : awayTeam;
  const roundLabel = inferRoundLabel(trailingMeta || text);
  const regionLabel = inferRegionLabel(trailingMeta || text);

  return {
    homeTeam,
    awayTeam,
    homeSeed: null,
    awaySeed: null,
    homeScore,
    awayScore,
    winnerTeam,
    status: "final",
    roundLabel,
    regionLabel,
  };
}

function parseCompletedGamesFromJson(html: string): {
  games: ScrapedResult[];
  jsonBlocksFound: number;
  jsonCandidates: number;
} {
  const extractedGames: GameExtraction[] = [];
  const jsonBlocks = extractJsonBlocksFromHtml(html);

  for (const jsonBlock of jsonBlocks) {
    const parsed = parseJsonBlock(jsonBlock);
    if (!parsed) {
      continue;
    }

    collectGameExtractions(parsed, extractedGames);
  }

  const scrapedGames = extractedGames
    .map<ScrapedResult | null>((extracted) => {
      const [homeTeam, awayTeam] = extracted.teams;
      const winnerTeam =
        extracted.winnerTeam ??
        (homeTeam.score !== null && awayTeam.score !== null && homeTeam.score > awayTeam.score
          ? homeTeam.name
          : awayTeam.name);

      if (!winnerTeam) {
        return null;
      }

      return {
        externalId: extracted.externalId,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeSeed: homeTeam.seed,
        awaySeed: awayTeam.seed,
        homeScore: homeTeam.score,
        awayScore: awayTeam.score,
        winnerTeam,
        status: "final",
        playedAt: extracted.playedAt,
        roundLabel: extracted.roundLabel,
        regionLabel: extracted.regionLabel,
      };
    })
    .filter((game): game is ScrapedResult => Boolean(game));

  return {
    games: dedupeScrapedResults(scrapedGames),
    jsonBlocksFound: jsonBlocks.length,
    jsonCandidates: extractedGames.length,
  };
}

function parseCompletedGamesFromHtmlFallback(html: string): {
  games: ScrapedResult[];
  htmlFallbackCandidates: number;
  htmlFallbackParsedCandidates: number;
} {
  const anchorTexts = extractAnchorTextsFromHtml(html);
  const finalCandidates = anchorTexts.filter((text) => FINAL_LINK_PREFIX_PATTERN.test(text));
  const parsedCandidates: ScrapedResult[] = [];

  for (const candidate of finalCandidates) {
    const parsed = parseFinalGameFromAnchorText(candidate);
    if (parsed) {
      parsedCandidates.push(parsed);
    }
  }

  return {
    games: dedupeScrapedResults(parsedCandidates),
    htmlFallbackCandidates: finalCandidates.length,
    htmlFallbackParsedCandidates: parsedCandidates.length,
  };
}

function dedupeScrapedResults(games: ScrapedResult[]): ScrapedResult[] {
  const deduped = new Map<string, ScrapedResult>();

  for (const game of games) {
    const home = game.homeTeam.toLowerCase();
    const away = game.awayTeam.toLowerCase();
    const orderedTeams = [home, away].sort().join("|");
    const dedupeKey = [
      game.roundLabel ?? "",
      game.regionLabel ?? "",
      orderedTeams,
      game.homeScore,
      game.awayScore,
      game.winnerTeam.toLowerCase(),
    ].join("::");

    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, game);
    }
  }

  return [...deduped.values()];
}

function parseIsoDateParts(rawDate: string, sourceLabel: string) {
  const trimmedDate = rawDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    throw new Error(`${sourceLabel} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = trimmedDate.split("-");
  return { year, month, day };
}

function getDateOverrideParts(rawDate = process.env.NCAA_SCORES_DATE, sourceLabel = "NCAA_SCORES_DATE") {
  if (!rawDate) {
    return null;
  }

  return parseIsoDateParts(rawDate, sourceLabel);
}

function getDatePartsForScoresUrl(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.NCAA_SCORES_TIMEZONE ?? "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to build NCAA scores URL from date parts.");
  }

  return { year, month, day };
}

function getNcaaFetchTimeoutMs(): number {
  const rawTimeout = process.env.NCAA_SCORES_FETCH_TIMEOUT_MS?.trim();
  if (!rawTimeout) {
    return DEFAULT_NCAA_FETCH_TIMEOUT_MS;
  }

  const parsed = Number(rawTimeout);
  if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 120000) {
    throw new Error("NCAA_SCORES_FETCH_TIMEOUT_MS must be between 1000 and 120000.");
  }

  return Math.trunc(parsed);
}

export function buildNcaaScoresUrl(date: Date = new Date(), options: NcaaScoresFetchOptions = {}): string {
  const baseUrl = process.env.NCAA_SCORES_BASE_URL ?? DEFAULT_NCAA_SCORES_BASE_URL;
  return buildNcaaScoresUrlFromBase(baseUrl, date, options);
}

function buildNcaaScoresUrlFromBase(
  baseUrl: string,
  date: Date = new Date(),
  options: NcaaScoresFetchOptions = {},
): string {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const explicitTargetDateParts = options.targetDate
    ? getDateOverrideParts(options.targetDate, "targetDate")
    : null;
  const overrideDateParts = explicitTargetDateParts ?? getDateOverrideParts();
  const { year, month, day } = overrideDateParts ?? getDatePartsForScoresUrl(date);

  return `${normalizedBaseUrl}${year}/${month}/${day}`;
}

export async function fetchNcaaScoresHtml(options: NcaaScoresFetchOptions = {}): Promise<{
  html: string;
  sourceUrl: string;
  sourceMode: "override-url" | "override-base-url" | "date-builder";
}> {
  const overrideUrl = process.env.NCAA_SCORES_URL?.trim();
  const isBaseScoresOverride = Boolean(
    overrideUrl && /\/march-madness-live\/scores\/?$/i.test(overrideUrl),
  );

  if (options.targetDate && overrideUrl && !isBaseScoresOverride) {
    throw new Error(
      "Cannot run date-targeted sync while NCAA_SCORES_URL points to a fixed non-base URL.",
    );
  }

  const sourceUrl = overrideUrl
    ? isBaseScoresOverride
      ? buildNcaaScoresUrlFromBase(overrideUrl, new Date(), options)
      : overrideUrl
    : buildNcaaScoresUrl(new Date(), options);
  const sourceMode = overrideUrl ? (isBaseScoresOverride ? "override-base-url" : "override-url") : "date-builder";
  const fetchTimeoutMs = getNcaaFetchTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  let response: Response;

  try {
    response = await fetch(sourceUrl, {
      headers: {
        "user-agent": "MarchMadnessCompanyChallengeBot/0.1 (+internal sync job)",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || controller.signal.aborted)
    ) {
      throw new Error(
        `Timed out after ${fetchTimeoutMs}ms fetching NCAA scores from ${sourceUrl}.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch NCAA scores from ${sourceUrl}: ${response.status}`);
  }

  return {
    html: await response.text(),
    sourceUrl,
    sourceMode,
  };
}

export function parseCompletedGamesWithDebug(html: string): ParsedGamesResult {
  const jsonParsed = parseCompletedGamesFromJson(html);

  if (jsonParsed.games.length > 0) {
    return {
      games: jsonParsed.games,
      debug: {
        parserPath: "json",
        jsonBlocksFound: jsonParsed.jsonBlocksFound,
        jsonCandidates: jsonParsed.jsonCandidates,
        htmlFallbackCandidates: 0,
        htmlFallbackParsedCandidates: 0,
        normalizedParsedGames: jsonParsed.games.length,
      },
    };
  }

  const htmlFallbackParsed = parseCompletedGamesFromHtmlFallback(html);
  const parserPath =
    htmlFallbackParsed.games.length > 0 ? "html-fallback" : "none";

  return {
    games: htmlFallbackParsed.games,
    debug: {
      parserPath,
      jsonBlocksFound: jsonParsed.jsonBlocksFound,
      jsonCandidates: jsonParsed.jsonCandidates,
      htmlFallbackCandidates: htmlFallbackParsed.htmlFallbackCandidates,
      htmlFallbackParsedCandidates: htmlFallbackParsed.htmlFallbackParsedCandidates,
      normalizedParsedGames: htmlFallbackParsed.games.length,
    },
  };
}

export function parseCompletedGames(html: string): ScrapedResult[] {
  return parseCompletedGamesWithDebug(html).games;
}
