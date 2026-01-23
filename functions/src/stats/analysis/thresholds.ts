// functions/src/stats/analysis/thresholds.ts

export type Level = "S" | "M" | "W";

export const LEVEL_THRESHOLD = {
  STRONG: 8, // 8–10
  MID: 4,    // 4–7
  WEAK: 0,   // 0–3
} as const;

// 共通スコア（0–10）用
export function toLevel(score10: number): Level {
  if (score10 >= LEVEL_THRESHOLD.STRONG) return "S";
  if (score10 >= LEVEL_THRESHOLD.MID) return "M";
  return "W";
}

// Upset（割合）専用
export function toUpsetLevel(upsetRate: number): Level {
  // upsetRate: 0.0〜1.0（例: 0.42 = 42%）
  if (upsetRate >= 0.4) return "S";
  if (upsetRate <= 0.1) return "W";
  return "M";
}
