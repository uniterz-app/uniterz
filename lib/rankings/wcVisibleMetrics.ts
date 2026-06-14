import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { METRICS } from "@/app/component/rankings/_data/mockRows";

/** WORLD CUP 用の指標一覧 */
export const WC_VISIBLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "exactHits",
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

/** ランキング指標タブ用（METRICS から league に応じて抽出） */
export function buildRankingTabMetrics(
  rankingLeague: "nba" | "worldcup"
): { key: MobileMetric; label: string }[] {
  const keys = visibleMetricsForLeague(rankingLeague);
  return keys.map((key) => {
    const found = METRICS.find((m) => m.key === key);
    return found ?? { key, label: key };
  });
}
