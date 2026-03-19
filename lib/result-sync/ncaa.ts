export type ScrapedResult = {
  externalId?: string;
  homeTeam: string;
  awayTeam: string;
  winnerTeam: string;
  status: "final";
  playedAt?: string;
};

export async function fetchNcaaScoresHtml(): Promise<string> {
  const url = process.env.NCAA_SCORES_URL;

  if (!url) {
    throw new Error("NCAA_SCORES_URL is not configured.");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "MarchMadnessCompanyChallengeBot/0.1 (+internal sync job)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NCAA scores: ${response.status}`);
  }

  return response.text();
}

export function parseCompletedGames(_html: string): ScrapedResult[] {
  /**
   * Placeholder parser.
   *
   * The final implementation should:
   * - parse only completed games
   * - normalize team names
   * - capture score context when available
   * - return deterministic rows for matching against local Game records
   */
  return [];
}
