import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
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
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { activeFootballStreakForWcStage } from "@/lib/rankings/activeFootballStreakForWcStage";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";

type RankMetric = BulkRankingMetric;

type WcStatsSlice = {
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

function readWcSlice(
  data: Record<string, unknown>,
  stage: WcRankingStage
): WcStatsSlice {
  const block = (
    data.rankingByWcStage as Record<string, Record<string, unknown>> | undefined
  )?.[stage];
  if (!block || typeof block !== "object") {
    return {
      totalPosts: 0,
      totalWins: 0,
      winRate: 0,
      totalPoints: 0,
      totalPrecision: 0,
      totalUpset: 0,
      totalGoalScorerHits: 0,
      activeWinStreak: 0,
    };
  }
  const tp = Number(block.totalPosts ?? 0);
  const tw = Number(block.totalWins ?? 0);
  return {
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : Number(block.winRate ?? 0),
    totalPoints: Number(block.totalPoints ?? 0),
    totalPrecision: Number(block.totalPrecision ?? 0),
    totalUpset: Number(block.totalUpset ?? 0),
    totalGoalScorerHits: Number(block.totalGoalScorerHits ?? 0),
    activeWinStreak: activeFootballStreakForWcStage(data, stage),
  };
}

/** NBA 現行シーズンのスライス（rankingBySeason.<CURRENT_NBA_SEASON_KEY>） */
function readNbaSlice(data: Record<string, unknown>): WcStatsSlice {
  const bySeason = (
    data.rankingBySeason as Record<string, Record<string, unknown>> | undefined
  )?.[CURRENT_NBA_SEASON_KEY];
  if (bySeason && typeof bySeason === "object") {
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
  return {
    totalPosts: 0,
    totalWins: 0,
    winRate: 0,
    totalPoints: 0,
    totalPrecision: 0,
    totalUpset: 0,
    totalGoalScorerHits: 0,
    activeWinStreak: 0,
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
  metric: RankMetric,
  wcStage: WcRankingStage | null
): number | null {
  return readStoredRankFromSnapshotRanks(
    data,
    metric as SnapshotRankMetric,
    wcStage
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
  metric: RankMetric,
  wcStage: WcRankingStage | null
): number | null {
  if (!hist) return null;
  let raw: unknown;
  if (wcStage) {
    raw = (
      hist.wc as
        | Partial<Record<WcRankingStage, Partial<Record<RankMetric, unknown>>>>
        | undefined
    )?.[wcStage]?.[metric];
  } else {
    raw = (
      hist.seasons as
        | Partial<Record<string, Partial<Record<RankMetric, unknown>>>>
        | undefined
    )?.[CURRENT_NBA_SEASON_KEY]?.[metric];
  }
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
  rk: WcStatsSlice,
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

function minPostsForMetric(
  metric: RankMetric,
  wcStage: WcRankingStage | null
): number {
  if (metric !== "winRate") return 1;
  return minPostsForWinRate({
    rankingLeague: wcStage ? "worldcup" : "nba",
    wcStage,
  });
}

/** MyRankCard 用 — Firestore snapshotRanks を直接読む（Functions 不要） */
export async function loadPersonalBulkOverlayFromFirestore(
  uid: string,
  metrics: BulkRankingMetric[],
  wcStage: WcRankingStage | null
): Promise<Record<string, BulkMetricPayload>> {
  const snap = await getAdminDb().collection("cumulative_stats").doc(uid).get();
  if (!snap.exists) {
    return Object.fromEntries(metrics.map((m) => [m, emptyPayload()]));
  }

  const data = snap.data() as Record<string, unknown>;
  const rk = wcStage ? readWcSlice(data, wcStage) : readNbaSlice(data);
  const priorHist = await loadPriorHistoryBlock(uid);

  const byMetric: Record<string, BulkMetricPayload> = {};
  for (const metric of metrics) {
    if ((rk.totalPosts ?? 0) < minPostsForMetric(metric, wcStage)) {
      byMetric[metric] = emptyPayload();
      continue;
    }

    const myRank = readStoredRank(data, metric, wcStage);
    const myRankDeltaPlaces = rankDeltaPlaces(
      myRank,
      readPriorRankFromHist(priorHist, metric, wcStage)
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
