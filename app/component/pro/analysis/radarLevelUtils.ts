/** backend functions/src/stats/analysis/thresholds.ts と同じ閾値 */
export type RadarAxisLevel = "S" | "M" | "W";

export function score10ToLevel(score: number): RadarAxisLevel {
  if (score >= 8) return "S";
  if (score >= 4) return "M";
  return "W";
}

export type RadarAxisKey =
  | "winRate"
  | "precision"
  | "upset"
  | "volume"
  | "streak";

export type RadarAxisLevels = Record<RadarAxisKey, RadarAxisLevel>;
