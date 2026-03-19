export const ROUND_POINTS = {
  playIn: 1,
  round1: 2,
  round2: 4,
  sweet16: 8,
  elite8: 16,
  final4: 32,
  championship: 64,
} as const;

export type RoundKey = keyof typeof ROUND_POINTS;

export type PickMap = Record<string, string | null | undefined>;

export type ScorableGame = {
  id: string;
  round: RoundKey;
  winnerTeam: string | null;
};

export function calculateScore(picks: PickMap, games: ScorableGame[]): number {
  return games.reduce((total, game) => {
    if (!game.winnerTeam) {
      return total;
    }

    return picks[game.id] === game.winnerTeam
      ? total + ROUND_POINTS[game.round]
      : total;
  }, 0);
}
