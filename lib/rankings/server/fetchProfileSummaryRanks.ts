import {
  fetchBulkFromFunctions,
  PROFILE_SUMMARY_RANK_METRICS,
} from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import { loadSnapshotTotalPointsRankAndDelta } from "@/lib/rankings/server/rankSnapshotHistoryTotalPoints";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type ProfileSummaryRanks = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
};

const EMPTY_RANKS: ProfileSummaryRanks = {
  totalPrecision: null,
  totalUpset: null,
  totalPoints: null,
};

function safeRank(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

/**
 * Profile Overview card ranks — aligned with `/api/cumulative-ranking/bulk`
 * (Functions myRank + rankSnapshotHistory for totalPoints on NBA playoffs).
 */
export async function fetchProfileSummaryRanks(
  uid: string,
  phase: RankingPhase,
  wcStage?: WcRankingStage
): Promise<ProfileSummaryRanks> {
  try {
    const snapshotPromise = !wcStage
      ? loadSnapshotTotalPointsRankAndDelta(uid, phase, "overall")
      : Promise.resolve({ latestRank: null as number | null, deltaPlaces: null });

    const [bulk, snapshot] = await Promise.all([
      fetchBulkFromFunctions(
        uid,
        [...PROFILE_SUMMARY_RANK_METRICS],
        phase,
        "overall",
        wcStage ?? null
      ),
      snapshotPromise,
    ]);

    let totalPoints = safeRank(bulk.byMetric.totalPoints?.myRank);

    /** Same override as cumulative-ranking bulk route (Ranking Progress / Your Rank). */
    if (snapshot.latestRank != null) {
      totalPoints = snapshot.latestRank;
    }

    return {
      totalPrecision: safeRank(bulk.byMetric.totalPrecision?.myRank),
      totalUpset: safeRank(bulk.byMetric.totalUpset?.myRank),
      totalPoints,
    };
  } catch {
    return EMPTY_RANKS;
  }
}
