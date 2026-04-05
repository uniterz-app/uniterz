import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** Top3 カード下段：レーティングバー用 0–1 と、バー横に出す短いラベル */
export function podiumMetricBarSpec(
  metric: MobileMetric,
  row: RankingRowWithCountry
): { ratio: number; label: string } {
  switch (metric) {
    case "totalScore":
      return {
        ratio: clamp01((row.avgTotalScore ?? 0) / 12),
        label: formatMetricDecimals(row.avgTotalScore ?? 0, 1),
      };
    case "marginPrecision":
      return {
        ratio: clamp01((row.avgMarginPrecision ?? 0) / 10),
        label: formatMetricDecimals(row.avgMarginPrecision ?? 0, 1),
      };
    case "upsetScore":
      return {
        ratio: clamp01((row.avgUpsetScore ?? 0) / 10),
        label: formatMetricDecimals(row.avgUpsetScore ?? 0, 1),
      };
    case "winRate":
      return {
        ratio: clamp01(row.winRate ?? 0),
        label: `${Math.round((row.winRate ?? 0) * 100)}%`,
      };
    case "streak":
      return {
        ratio: clamp01((row.streak ?? 0) / 15),
        label: `${Math.max(0, Math.round(row.streak ?? 0))}`,
      };
    default:
      return { ratio: 0, label: "—" };
  }
}
