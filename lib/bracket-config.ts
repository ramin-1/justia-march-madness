import { CANONICAL_GAMES } from "@/lib/brackets/registry";

export type BracketGameConfig = {
  id: string;
  round: string;
  region?: string;
  slotLabel: string;
};

export const BRACKET_GAMES: BracketGameConfig[] = CANONICAL_GAMES.map((game) => ({
  id: game.id,
  round: game.round,
  region: game.region,
  slotLabel: game.slotLabel,
}));
