/* lib/playoff-bracket.ts */

export type SeriesId =
  | "R1_E1" | "R1_E2" | "R1_E3" | "R1_E4"
  | "R1_W1" | "R1_W2" | "R1_W3" | "R1_W4"
  | "R2_E1" | "R2_E2"
  | "R2_W1" | "R2_W2"
  | "CF_E" | "CF_W"
  | "FINALS";

/* 全シリーズID（15） */
export const PLAYOFF_SERIES: SeriesId[] = [
  "R1_E1","R1_E2","R1_E3","R1_E4",
  "R1_W1","R1_W2","R1_W3","R1_W4",
  "R2_E1","R2_E2",
  "R2_W1","R2_W2",
  "CF_E","CF_W",
  "FINALS"
];

/* ブラケット進行構造 */
export const PLAYOFF_BRACKET_STRUCTURE: Record<string, SeriesId[]> = {
  R2_E1: ["R1_E1", "R1_E2"],
  R2_E2: ["R1_E3", "R1_E4"],

  R2_W1: ["R1_W1", "R1_W2"],
  R2_W2: ["R1_W3", "R1_W4"],

  CF_E: ["R2_E1", "R2_E2"],
  CF_W: ["R2_W1", "R2_W2"],

  FINALS: ["CF_E", "CF_W"],
};

/* ラウンド配点 */
export const PLAYOFF_ROUND_POINTS: Record<string, number> = {
  R1: 4,
  R2: 5,
  CF: 6,
  FINALS: 6,
};

/* 試合数完全一致 */
export const PLAYOFF_GAMES_EXACT_POINTS = 2;

/* ブラケット完成判定 */
export function isPlayoffBracketComplete(
  bracket: Partial<Record<SeriesId, { winner: string; games: number }>>
) {
  for (const id of PLAYOFF_SERIES) {
    const series = bracket[id];

    if (!series) return false;
    if (!series.winner) return false;
    if (series.games == null) return false;
  }

  return true;
}