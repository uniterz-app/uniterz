// functions/src/stats/analysis/thresholds.ts

export type Level = "S" | "M" | "W";

export const LEVEL_THRESHOLD = {
  STRONG: 8, // 8–10
  MID: 4,    // 4–7
  WEAK: 0,   // 0–3
} as const;

export function toLevel(score10: number): Level {
  if (score10 >= LEVEL_THRESHOLD.STRONG) return "S";
  if (score10 >= LEVEL_THRESHOLD.MID) return "M";
  return "W";
}
