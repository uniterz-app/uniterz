import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const REFETCH_ALL_METRICS_NBA =
  "totalPoints,totalPrecision,totalUpset,activeWinStreak,winRate";

export const REFETCH_ALL_METRICS_WC =
  "totalPoints,totalExactHits,totalUpset,activeWinStreak,winRate,totalGoalScorerHits";

export function allRankingMetricsParam(
  wcStage: WcRankingStage | null
): string {
  return wcStage ? REFETCH_ALL_METRICS_WC : REFETCH_ALL_METRICS_NBA;
}

/** 一覧 Top20 が取得済みか（personalOnly プリフェッチの空 rows では false） */
export function isMetricListBundleLoaded(
  bundle: { rows?: unknown[] } | null | undefined
): boolean {
  return (
    bundle != null &&
    Array.isArray(bundle.rows) &&
    bundle.rows.length > 0
  );
}

/** 総合得点の personal 取得後、他指標の YOUR RANK が未プリフェッチか */
export function needsPersonalRankPrefetch(
  bundles: Record<string, { myRank?: unknown; myRow?: unknown } | undefined> | null,
  wcStage: WcRankingStage | null,
  uid: string | null
): boolean {
  if (!uid || !bundles?.totalPoints) return false;
  const tp = bundles.totalPoints;
  if (tp.myRank == null && tp.myRow == null) return false;
  for (const metric of allRankingMetricsParam(wcStage).split(",")) {
    if (metric === "totalPoints") continue;
    if (bundles[metric]?.myRank == null) return true;
  }
  return false;
}

export type PersonalRankPrefetchPayload = {
  ok: boolean;
  count: number;
  myRank: unknown;
  myRow: unknown;
  myRankDeltaPlaces: unknown;
  rows?: unknown[];
};

/** snapshotRanks 由来の myRank / myRow だけを既存バンドルにマージ */
export function mergePersonalRankPrefetch<T extends PersonalRankPrefetchPayload>(
  prev: Record<string, T> | null,
  personal: Record<string, PersonalRankPrefetchPayload>
): Record<string, T> {
  const out = { ...(prev ?? {}) } as Record<string, T>;
  for (const [key, mine] of Object.entries(personal)) {
    const old = out[key];
    if (old) {
      out[key] = {
        ...old,
        myRank: mine.myRank ?? old.myRank,
        myRow: (mine.myRow ?? old.myRow) as T["myRow"],
        myRankDeltaPlaces:
          (mine.myRankDeltaPlaces ?? old.myRankDeltaPlaces ?? null) as T["myRankDeltaPlaces"],
      };
    } else {
      out[key] = {
        ok: true,
        count: 0,
        myRank: mine.myRank,
        myRow: mine.myRow,
        myRankDeltaPlaces: mine.myRankDeltaPlaces ?? null,
      } as T;
    }
  }
  return out;
}
