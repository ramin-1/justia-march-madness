export type BracketGameConfig = {
  id: string;
  round: string;
  region?: string;
  slotLabel: string;
};

export const BRACKET_GAMES: BracketGameConfig[] = [
  { id: "PLAYIN_G1", round: "playIn", slotLabel: "Play-In 1" },
  { id: "EAST_R1_G1", round: "round1", region: "East", slotLabel: "East Round 1 Game 1" },
  { id: "WEST_R1_G1", round: "round1", region: "West", slotLabel: "West Round 1 Game 1" },
  { id: "SOUTH_R1_G1", round: "round1", region: "South", slotLabel: "South Round 1 Game 1" },
  { id: "MIDWEST_R1_G1", round: "round1", region: "Midwest", slotLabel: "Midwest Round 1 Game 1" },
  { id: "FINAL4_G1", round: "final4", slotLabel: "Final Four 1" },
  { id: "CHAMPIONSHIP_G1", round: "championship", slotLabel: "Championship" },
];
