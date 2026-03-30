import { CANONICAL_GAMES, getCanonicalGame, type BracketRoundKey } from "@/lib/brackets/registry";
import type { ScrapedResult } from "./ncaa";

const ROUND1_GAME_TO_SEED_PAIR: Record<string, [number, number]> = {
  R1_G1: [1, 16],
  R1_G2: [8, 9],
  R1_G3: [5, 12],
  R1_G4: [4, 13],
  R1_G5: [6, 11],
  R1_G6: [3, 14],
  R1_G7: [7, 10],
  R1_G8: [2, 15],
};

const FIRST_FOUR_MATCHUP_GAME_IDS = new Map<string, string>([
  [toMatchupKey("Howard", "UMBC"), "PLAYIN_G1"],
  [toMatchupKey("Texas", "NC State"), "PLAYIN_G2"],
  [toMatchupKey("Prairie View A&M", "Lehigh"), "PLAYIN_G3"],
  [toMatchupKey("SMU", "Miami (Ohio)"), "PLAYIN_G4"],
]);

function toMatchupKey(teamA: string, teamB: string): string {
  return [teamA, teamB].map(normalizeTeamName).sort().join("::");
}

function normalizeRegion(value: string | null | undefined): "East" | "West" | "South" | "Midwest" | null {
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

function normalizeRound(value: string | null | undefined): BracketRoundKey | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("first four") || normalized.includes("play in")) {
    return "playIn";
  }

  if (normalized.includes("first round") || normalized.includes("round of 64")) {
    return "round1";
  }

  if (normalized.includes("second round") || normalized.includes("round of 32")) {
    return "round2";
  }

  if (normalized.includes("regional semifinal")) {
    return "sweet16";
  }

  if (normalized.includes("regional final")) {
    return "elite8";
  }

  if (normalized.includes("sweet 16") || normalized.includes("sweet sixteen")) {
    return "sweet16";
  }

  if (normalized.includes("elite 8") || normalized.includes("elite eight")) {
    return "elite8";
  }

  if (
    normalized.includes("final four") ||
    normalized.includes("national semifinal") ||
    normalized.includes("national semi final") ||
    normalized.includes("national semi-final") ||
    (normalized.includes("semifinal") && !normalized.includes("regional semifinal"))
  ) {
    return "final4";
  }

  if (
    normalized.includes("national championship") ||
    normalized.includes("championship") ||
    normalized.includes("title game")
  ) {
    return "championship";
  }

  return null;
}

function parseSeedFromTeamKey(teamKey: string | null | undefined): number | null {
  if (!teamKey) {
    return null;
  }

  const match = teamKey.match(/_(\d{1,2})(?:[A-Z])?$/);
  return match ? Number(match[1]) : null;
}

function getCanonicalSeedPair(gameId: string): [number, number] | null {
  const canonicalGame = getCanonicalGame(gameId);

  if (canonicalGame.round === "playIn") {
    const firstSeed = parseSeedFromTeamKey(canonicalGame.initialTeams?.[0]?.key);
    const secondSeed = parseSeedFromTeamKey(canonicalGame.initialTeams?.[1]?.key);

    if (firstSeed !== null && secondSeed !== null) {
      return [firstSeed, secondSeed];
    }

    return null;
  }

  if (canonicalGame.round !== "round1") {
    return null;
  }

  const round1GameSuffix = canonicalGame.id.split("_").slice(-2).join("_");
  return ROUND1_GAME_TO_SEED_PAIR[round1GameSuffix] ?? null;
}

function hasMatchingSeedPair(scrapedGame: ScrapedResult, gameId: string): boolean {
  const canonicalSeeds = getCanonicalSeedPair(gameId);

  if (!canonicalSeeds || scrapedGame.homeSeed === null || scrapedGame.awaySeed === null) {
    return false;
  }

  const scrapedPair = [scrapedGame.homeSeed, scrapedGame.awaySeed].sort((a, b) => a - b);
  const canonicalPair = [...canonicalSeeds].sort((a, b) => a - b);

  return scrapedPair[0] === canonicalPair[0] && scrapedPair[1] === canonicalPair[1];
}

function getFirstFourMappedGameId(scrapedGame: ScrapedResult): string | null {
  const matchupKey = toMatchupKey(scrapedGame.homeTeam, scrapedGame.awayTeam);
  return FIRST_FOUR_MATCHUP_GAME_IDS.get(matchupKey) ?? null;
}

export type LocalGameForMatching = {
  id: string;
  round: string;
  region: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
};

export type CanonicalMatchResult =
  | {
      kind: "matched";
      gameId: string;
      strategy: "first-four-hardcoded" | "team-name" | "round-region-seed";
    }
  | {
      kind: "ambiguous";
      reason: string;
      candidateGameIds: string[];
    }
  | {
      kind: "unmatched";
      reason: string;
      candidateGameIds?: string[];
    };

export function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isLikelyMatch(
  scraped: ScrapedResult,
  game: { homeTeam: string | null; awayTeam: string | null },
): boolean {
  const scrapedTeams = [scraped.homeTeam, scraped.awayTeam].map(normalizeTeamName).sort();
  const localTeams = [game.homeTeam ?? "", game.awayTeam ?? ""].map(normalizeTeamName).sort();

  return scrapedTeams[0] === localTeams[0] && scrapedTeams[1] === localTeams[1];
}

export function findCanonicalGameMatch({
  scrapedGame,
  localGames,
}: {
  scrapedGame: ScrapedResult;
  localGames: LocalGameForMatching[];
}): CanonicalMatchResult {
  const explicitPlayInGameId = getFirstFourMappedGameId(scrapedGame);
  if (explicitPlayInGameId) {
    return {
      kind: "matched",
      gameId: explicitPlayInGameId,
      strategy: "first-four-hardcoded",
    };
  }

  const exactNameMatches = localGames
    .filter((game) => isLikelyMatch(scrapedGame, game))
    .map((game) => game.id);

  if (exactNameMatches.length === 1) {
    return {
      kind: "matched",
      gameId: exactNameMatches[0],
      strategy: "team-name",
    };
  }

  if (exactNameMatches.length > 1) {
    return {
      kind: "ambiguous",
      reason: "Multiple canonical games matched by team names.",
      candidateGameIds: exactNameMatches,
    };
  }

  const round = normalizeRound(scrapedGame.roundLabel);
  const region = normalizeRegion(scrapedGame.regionLabel);

  let candidates = CANONICAL_GAMES.map((game) => game.id);

  if (round) {
    candidates = candidates.filter((gameId) => getCanonicalGame(gameId).round === round);
  }

  if (region) {
    candidates = candidates.filter((gameId) => normalizeRegion(getCanonicalGame(gameId).region) === region);
  }

  if (scrapedGame.homeSeed !== null && scrapedGame.awaySeed !== null) {
    const candidatesWithSeedModel: string[] = [];
    const candidatesWithoutSeedModel: string[] = [];

    for (const gameId of candidates) {
      if (getCanonicalSeedPair(gameId)) {
        candidatesWithSeedModel.push(gameId);
      } else {
        candidatesWithoutSeedModel.push(gameId);
      }
    }

    if (candidatesWithSeedModel.length > 0) {
      const matchedSeedCandidates = candidatesWithSeedModel.filter((gameId) =>
        hasMatchingSeedPair(scrapedGame, gameId),
      );

      candidates = [...candidatesWithoutSeedModel, ...matchedSeedCandidates];
    }
  }

  if (candidates.length === 1) {
    return {
      kind: "matched",
      gameId: candidates[0],
      strategy: "round-region-seed",
    };
  }

  if (candidates.length > 1) {
    return {
      kind: "ambiguous",
      reason: "Multiple canonical games matched by round/region/seed constraints.",
      candidateGameIds: candidates,
    };
  }

  return {
    kind: "unmatched",
    reason: "No deterministic canonical game match found.",
    candidateGameIds: candidates.length > 0 ? candidates : undefined,
  };
}
