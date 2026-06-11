import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { metricNum } from "@/lib/rankings/metric";

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
    case "goalScorerHits":
      return {
        ratio: clamp01((row.goalScorerHits ?? 0) / 20),
        label: `${Math.max(0, Math.round(row.goalScorerHits ?? 0))}`,
      };
    default:
      return { ratio: 0, label: "—" };
  }
}

/** 1位の指標値（セグメントバーの Max） */
export function leaderMetricValue(
  row: RankingRowWithCountry | null | undefined,
  metric: MobileMetric
): number {
  if (!row) return 0;
  return metricNum(row, metric).n;
}

/** 一覧行セグメントバー用 0–100（1位 = 100%） */
export function listMetricBarPct(
  metric: MobileMetric,
  row: RankingRowWithCountry,
  leaderValue: number
): number {
  const value = metricNum(row, metric).n;
  if (leaderValue <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((value / leaderValue) * 100)));
}
