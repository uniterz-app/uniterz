import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import { METRICS } from "@/lib/rankings/rankingMetrics";

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
  "upsetScore",
  "goalScorerHits",
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
    if (rankingLeague === "nba" && key === "goalScorerHits") {
      return { key, label: "最多得点者的中" };
    }
    return found ?? { key, label: key };
  });
}
