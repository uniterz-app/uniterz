/**
 * Team Stats — Season↔L10 差分（Pro）。
 * 推奨ではなく事実の変化量。
 */

export type MetricDeltaTone = "up" | "down" | "flat";

/** 低いほど良い指標（失点・守備効率） */
const LOWER_BETTER = new Set(["papg", "drtg"]);

export function metricDelta(
  key: string,
  season: number,
  last10: number
): { delta: number; tone: MetricDeltaTone; label: string } {
  const delta = last10 - season;
  const abs = Math.abs(delta);
  if (abs < 0.15) {
    return { delta, tone: "flat", label: "0.0" };
  }
  const improved = LOWER_BETTER.has(key) ? delta < 0 : delta > 0;
  const tone: MetricDeltaTone = improved ? "up" : "down";
  const sign = delta > 0 ? "+" : "";
  return {
    delta,
    tone,
    label: `${sign}${delta.toFixed(1)}`,
  };
}
