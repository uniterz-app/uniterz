import type { BulkMetricPayload, BulkRankingMetric } from "@/lib/rankings/server/fetchCumulativeRankingBulk";

/** キャッシュ済み一覧に、uid 付き Functions の myRank / myRow だけを上書き */
export function mergePersonalIntoBulkByMetric(
  base: Record<string, BulkMetricPayload>,
  personal: Record<string, BulkMetricPayload>,
  metrics: BulkRankingMetric[]
): void {
  for (const metric of metrics) {
    const listBundle = base[metric];
    const mine = personal[metric];
    if (!listBundle || !mine) continue;
    base[metric] = {
      ...listBundle,
      myRank: mine.myRank,
      myRow: mine.myRow,
      myRankDeltaPlaces: mine.myRankDeltaPlaces,
    };
  }
}
