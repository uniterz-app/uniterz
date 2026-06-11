import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";

/** WORLD CUP 用の指標一覧（NBA より goalScorerHits を追加） */
export const WC_VISIBLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
  "goalScorerHits",
];

/** NBA プレーオフ用の指標一覧 */
export const NBA_VISIBLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
];

export function visibleMetricsForLeague(
  rankingLeague: "nba" | "worldcup"
): MobileMetric[] {
  return rankingLeague === "worldcup"
    ? WC_VISIBLE_METRICS
    : NBA_VISIBLE_METRICS;
}
