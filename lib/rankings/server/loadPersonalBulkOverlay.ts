import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { pickNbaCumulativeRankingSlice } from "@/lib/rankings/pickNbaStatsBucket";
import { loadMostRecentPriorRankSnapshotHistory } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import type {
  BulkMetricPayload,
  BulkRankingMetric,
} from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import {
  readStoredRankFromSnapshotRanks,
  type SnapshotRankMetric,
} from "@/lib/rankings/server/readSnapshotRanksFromCumulative";
import { minPostsForWinRate } from "@/lib/rankings/winRateMinPosts";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";

type RankMetric = BulkRankingMetric;

type NbaStatsSlice = {
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  activeWinStreak: number;
};

function emptyPayload(): BulkMetricPayload {
  return {
    ok: true,
    rows: [],
    count: 0,
    myRank: null,
    myRow: null,
    myRankDeltaPlaces: null,
  };
}

/** NBA スライス（現行が空なら前シーズン／旧 playoffs へフォールバック） */
function readNbaSlice(data: Record<string, unknown>): NbaStatsSlice {
  const bySeason = pickNbaCumulativeRankingSlice(data);
  const tp = Number(bySeason.totalPosts ?? 0);
  const tw = Number(bySeason.totalWins ?? 0);
  return {
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : Number(bySeason.winRate ?? 0),
    totalPoints: Number(bySeason.totalPoints ?? 0),
    totalPrecision: Number(bySeason.totalPrecision ?? 0),
    totalUpset: Number(bySeason.totalUpset ?? 0),
    totalGoalScorerHits: Number(bySeason.totalGoalScorerHits ?? 0),
    activeWinStreak: activeBasketballStreak(data),
  };
}

function activeBasketballStreak(data: Record<string, unknown>): number {
  const signed =
    data.activeWinStreakBasketball ??
    (data.streakBySport as Record<string, unknown> | undefined)?.basketball ??
    data.currentStreak ??
    data.activeWinStreak ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

function readStoredRank(
  data: Record<string, unknown>,
  metric: RankMetric
): number | null {
  return readStoredRankFromSnapshotRanks(
    data,
    metric as SnapshotRankMetric
  );
}

async function loadPriorHistoryBlock(
  uid: string
): Promise<Record<string, unknown> | null> {
  const prior = await loadMostRecentPriorRankSnapshotHistory(uid);
  return prior?.data ?? null;
}

function readPriorRankFromHist(
  hist: Record<string, unknown> | null,
  metric: RankMetric
): number | null {
  if (!hist) return null;
  const raw = (
    hist.seasons as
      | Partial<Record<string, Partial<Record<RankMetric, unknown>>>>
      | undefined
  )?.[CURRENT_NBA_SEASON_KEY]?.[metric];
  return coerceTotalPointsRank(raw);
}

function rankDeltaPlaces(
  myRank: number | null,
  prevRank: number | null
): number | null {
  if (myRank == null || prevRank == null) return null;
  const d = prevRank - myRank;
  return d !== 0 ? d : null;
}

function buildMyRow(
  uid: string,
  data: Record<string, unknown>,
  rk: NbaStatsSlice,
  metric: RankMetric,
  myRank: number | null,
  myRankDeltaPlaces: number | null
): Record<string, unknown> {
  return {
    uid,
    displayName: String(data.displayName ?? ""),
    handle: (data.handle as string | null | undefined) ?? null,
    photoURL: (data.photoURL as string | null | undefined) ?? null,
    countryCode: (data.countryCode as string | null | undefined) ?? null,
    plan: data.plan === "pro" ? "pro" : "free",
    planProBgVariant:
      data.plan === "pro"
        ? parseUserPlanProBgVariant(data.planProBgVariant)
        : undefined,
    totalPosts: rk.totalPosts,
    totalWins: rk.totalWins,
    winRate: rk.winRate,
    totalPoints: rk.totalPoints,
    totalPrecision: rk.totalPrecision,
    totalExactHits:
      metric === "totalExactHits" ? rk.totalPrecision : undefined,
    totalUpset: rk.totalUpset,
    totalGoalScorerHits: rk.totalGoalScorerHits,
    activeWinStreak: rk.activeWinStreak,
    rank: myRank ?? 0,
    rankDeltaPlaces: myRankDeltaPlaces,
  };
}

function minPostsForMetric(metric: RankMetric): number {
  if (metric !== "winRate") return 1;
  return minPostsForWinRate({});
}

/** MyRankCard 用 — Firestore snapshotRanks を直接読む（Functions 不要） */
export async function loadPersonalBulkOverlayFromFirestore(
  uid: string,
  metrics: BulkRankingMetric[]
): Promise<Record<string, BulkMetricPayload>> {
  const snap = await getAdminDb().collection("cumulative_stats").doc(uid).get();
  if (!snap.exists) {
    return Object.fromEntries(metrics.map((m) => [m, emptyPayload()]));
  }

  const data = snap.data() as Record<string, unknown>;
  const rk = readNbaSlice(data);
  const priorHist = await loadPriorHistoryBlock(uid);

  const byMetric: Record<string, BulkMetricPayload> = {};
  for (const metric of metrics) {
    if ((rk.totalPosts ?? 0) < minPostsForMetric(metric)) {
      byMetric[metric] = emptyPayload();
      continue;
    }

    const myRank = readStoredRank(data, metric);
    const myRankDeltaPlaces = rankDeltaPlaces(
      myRank,
      readPriorRankFromHist(priorHist, metric)
    );
    byMetric[metric] = {
      ok: true,
      rows: [],
      count: 0,
      myRank,
      myRow: buildMyRow(uid, data, rk, metric, myRank, myRankDeltaPlaces),
      myRankDeltaPlaces,
    };
  }

  return byMetric;
}
