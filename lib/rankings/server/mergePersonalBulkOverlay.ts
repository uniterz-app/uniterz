import type { BulkMetricPayload, BulkRankingMetric } from "@/lib/rankings/server/fetchCumulativeRankingBulk";

type ListRow = {
  uid?: string;
  rank?: number;
  rankDeltaPlaces?: number | null;
};

function rankFromListRows(rows: unknown[], uid: string): ListRow | null {
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    const r = row as ListRow;
    if (r?.uid !== uid) continue;
    const rank =
      typeof r.rank === "number" && Number.isFinite(r.rank) && r.rank >= 1
        ? Math.floor(r.rank)
        : null;
    if (rank == null) return null;
    return {
      uid,
      rank,
      rankDeltaPlaces:
        typeof r.rankDeltaPlaces === "number" &&
        Number.isFinite(r.rankDeltaPlaces) &&
        r.rankDeltaPlaces !== 0
          ? Math.trunc(r.rankDeltaPlaces)
          : r.rankDeltaPlaces === 0
            ? null
            : null,
    };
  }
  return null;
}

/** キャッシュ済み一覧に、uid 付き Functions の myRank / myRow だけを上書き */
export function mergePersonalIntoBulkByMetric(
  base: Record<string, BulkMetricPayload>,
  personal: Record<string, BulkMetricPayload>,
  metrics: BulkRankingMetric[],
  uid?: string
): void {
  for (const metric of metrics) {
    const listBundle = base[metric];
    const mine = personal[metric];
    if (!listBundle || !mine) continue;

    let myRank = mine.myRank;
    let myRankDeltaPlaces = mine.myRankDeltaPlaces;
    let myRow = mine.myRow;

    if (uid && myRank == null) {
      const fromList = rankFromListRows(listBundle.rows, uid);
      if (fromList?.rank != null) {
        myRank = fromList.rank;
        if (myRankDeltaPlaces == null && fromList.rankDeltaPlaces != null) {
          myRankDeltaPlaces = fromList.rankDeltaPlaces;
        }
        if (myRow && typeof myRow === "object") {
          myRow = {
            ...myRow,
            rank: fromList.rank,
            rankDeltaPlaces:
              myRankDeltaPlaces ?? fromList.rankDeltaPlaces ?? null,
          };
        }
      }
    }

    base[metric] = {
      ...listBundle,
      myRank,
      myRow,
      myRankDeltaPlaces,
    };
  }
}
