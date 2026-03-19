import type { ScrapedResult } from "./ncaa";

export function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
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
