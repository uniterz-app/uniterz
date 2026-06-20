import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";

/** UI 指標値（降順ソート用）— CF `cmpSortRows` と揃える */
export function rankingRowMetricValue(
  row: RankingRowWithCountry,
  metric: MobileMetric
): number {
  switch (metric) {
    case "totalScore":
      return row.totalScore ?? 0;
    case "winRate":
      return row.winRate ?? 0;
    case "marginPrecision":
      return row.marginPrecisionScore ?? 0;
    case "exactHits":
      return row.exactHits ?? row.marginPrecisionScore ?? 0;
    case "upsetScore":
      return row.upsetScore ?? 0;
    case "goalScorerHits":
      return row.goalScorerHits ?? 0;
    case "streak":
      return row.streak ?? 0;
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
  return (b.totalScore ?? 0) - (a.totalScore ?? 0);
}

/** スナップショット行を指標降順に並べ替え（API 順序のズレを吸収） */
export function sortRankingRowsByMetric<T extends RankingRowWithCountry>(
  metric: MobileMetric,
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => cmpRankingRows(a, b, metric));
}
