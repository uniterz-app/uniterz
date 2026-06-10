/** 4 指標の前日比（累積値の差）。null = 表示しない。 */
export type MyRankMetricValueDeltas = {
  totalPoints: number | null;
  totalPrecision: number | null;
  totalUpset: number | null;
  /** 勝率の差（パーセントポイント） */
  winRate: number | null;
};

export type MyRankMetricDeltaKey =
  | "totalScore"
  | "winRate"
  | "marginPrecision"
  | "upsetScore";

export function formatMetricDayDeltaLabel(
  metricKey: MyRankMetricDeltaKey,
  delta: number
): string {
  const sign = delta > 0 ? "+" : "-";
  const abs = Math.abs(delta);
  if (metricKey === "totalScore" || metricKey === "winRate") {
    return delta === 0 ? "0" : `${sign}${Math.round(abs)}`;
  }
  return delta === 0 ? "0.0" : `${sign}${abs.toFixed(1)}`;
}

export function dayDeltaLabelForMetric(
  metricKey: MyRankMetricDeltaKey,
  deltas: MyRankMetricValueDeltas | null | undefined
): string | null {
  if (!deltas) return null;
  const field =
    metricKey === "totalScore"
      ? "totalPoints"
      : metricKey === "marginPrecision"
        ? "totalPrecision"
        : metricKey === "upsetScore"
          ? "totalUpset"
          : "winRate";
  const raw = deltas[field];
  if (raw == null || !Number.isFinite(raw) || raw === 0) return null;
  return formatMetricDayDeltaLabel(metricKey, raw);
}
