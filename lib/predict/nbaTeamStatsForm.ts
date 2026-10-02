/**
 * Team Stats — Season↔L10 差分（Pro）。
 * 推奨ではなく事実の変化量。
 */

export type MetricDeltaTone = "up" | "down" | "flat";

/** 低いほど良い指標（失点・守備効率・ターンオーバー） */
const LOWER_BETTER = new Set(["papg", "drtg", "tovPct"]);

/** 0–1 の割合系（差分は %pt 表示） */
const RATE_01 = new Set(["fgPct", "fg3Pct", "efgPct", "ftPct", "tovPct"]);

export function metricDelta(
  key: string,
  season: number,
  last10: number
): { delta: number; tone: MetricDeltaTone; label: string } {
  const rawDelta = last10 - season;
  const displayDelta = RATE_01.has(key) ? rawDelta * 100 : rawDelta;
  const abs = Math.abs(displayDelta);
  const flatEps = RATE_01.has(key) ? 0.15 : 0.15;
  if (abs < flatEps) {
    return { delta: displayDelta, tone: "flat", label: "0.0" };
  }
  const improved = LOWER_BETTER.has(key) ? rawDelta < 0 : rawDelta > 0;
  const tone: MetricDeltaTone = improved ? "up" : "down";
  const sign = displayDelta > 0 ? "+" : "";
  return {
    delta: displayDelta,
    tone,
    label: `${sign}${displayDelta.toFixed(1)}`,
  };
}
