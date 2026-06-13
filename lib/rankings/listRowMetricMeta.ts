import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";

/** ランキング行 — 指標の前日比（例: +18 / +6.7）。0 / 0.0 は null */
export function formatListMetricDayDelta(
  metric: MobileMetric,
  delta: number | null | undefined
): string | null {
  if (delta == null || !Number.isFinite(delta) || Math.abs(delta) < 1e-9) {
    return null;
  }

  const sign = delta > 0 ? "+" : "-";
  const abs = Math.abs(delta);

  if (metric === "winRate" || metric === "totalScore") {
    const n = Math.round(abs);
    if (n === 0) return null;
    return `${sign}${n}`;
  }

  if (metric === "streak" || metric === "goalScorerHits") {
    return null;
  }

  const formatted = abs.toFixed(1);
  if (formatted === "0.0") return null;
  return `${sign}${formatted}`;
}

export function listRowAvgText(
  metric: MobileMetric,
  row: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  }
): string | null {
  if (metric === "totalScore") {
    return `AVG ${formatMetricDecimals(row.avgTotalScore ?? 0, 1)}`;
  }
  if (metric === "marginPrecision") {
    return `AVG ${formatMetricDecimals(row.avgMarginPrecision ?? 0, 1)}`;
  }
  if (metric === "upsetScore") {
    return `AVG ${formatMetricDecimals(row.avgUpsetScore ?? 0, 1)}`;
  }
  return null;
}
