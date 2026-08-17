import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import { METRICS } from "@/lib/rankings/rankingMetrics";

/** NBA プレーオフ用の指標一覧 */
export const NBA_VISIBLE_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "upsetScore",
  "goalScorerHits",
];

export function visibleMetricsForLeague(
  _rankingLeague: "nba" = "nba"
): MobileMetric[] {
  return NBA_VISIBLE_METRICS;
}

/** ランキング指標タブ用（METRICS から league に応じて抽出） */
export function buildRankingTabMetrics(
  _rankingLeague: "nba" = "nba"
): { key: MobileMetric; label: string }[] {
  const keys = visibleMetricsForLeague("nba");
  return keys.map((key) => {
    const found = METRICS.find((m) => m.key === key);
    if (key === "goalScorerHits") {
      return { key, label: "最多得点者的中" };
    }
    return found ?? { key, label: key };
  });
}
