import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { safeRankMetricNum } from "@/lib/rankings/safeRankMetricNum";

/** UI 指標値（降順ソート用）— CF `cmpSortRows` と揃える */
export function rankingRowMetricValue(
  row: RankingRowWithCountry,
  metric: MobileMetric
): number {
  switch (metric) {
    case "totalScore":
      return safeRankMetricNum(row.totalScore);
    case "winRate":
      return safeRankMetricNum(row.winRate);
    case "marginPrecision":
      return safeRankMetricNum(row.marginPrecisionScore);
    case "exactHits":
      return safeRankMetricNum(row.exactHits ?? row.marginPrecisionScore);
    case "upsetScore":
      return safeRankMetricNum(row.upsetScore);
    case "goalScorerHits":
      return safeRankMetricNum(row.goalScorerHits);
    case "streak":
      return safeRankMetricNum(row.streak);
    default:
      return 0;
  }
}

function cmpRankingRows(
  a: RankingRowWithCountry,
  b: RankingRowWithCountry,
  metric: MobileMetric
): number {
  const diff =
    rankingRowMetricValue(b, metric) - rankingRowMetricValue(a, metric);
  if (diff !== 0) return diff;
  if (metric === "winRate") {
    const postsDiff = (b.posts ?? 0) - (a.posts ?? 0);
    if (postsDiff !== 0) return postsDiff;
  }
  return safeRankMetricNum(b.totalScore) - safeRankMetricNum(a.totalScore);
}

/** スナップショット行を指標降順に並べ替え（API 順序のズレを吸収） */
export function sortRankingRowsByMetric<T extends RankingRowWithCountry>(
  metric: MobileMetric,
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => cmpRankingRows(a, b, metric));
}
