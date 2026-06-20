import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { RANK_SNAPSHOT_HISTORY_SUBCOL } from "@/lib/rankings/rankingPhase";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import {
  getYesterdayDateKeyJST,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";
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
    activeWinStreak: activeFootballStreak(data),
  };
}

function readNbaSlice(
  data: Record<string, unknown>,
  phase: RankingPhase,
  round: PlayoffRoundKey
): WcStatsSlice {
  if (phase === "playoffs" && round !== "overall") {
    const byRound = (
      data.rankingByPlayoffRound as Record<string, Record<string, unknown>>
    )?.[round];
    if (byRound && typeof byRound === "object") {
      const tp = Number(byRound.totalPosts ?? 0);
      const tw = Number(byRound.totalWins ?? 0);
      return {
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : Number(byRound.winRate ?? 0),
        totalPoints: Number(byRound.totalPoints ?? 0),
        totalPrecision: Number(byRound.totalPrecision ?? 0),
        totalUpset: Number(byRound.totalUpset ?? 0),
        totalGoalScorerHits: Number(byRound.totalGoalScorerHits ?? 0),
        activeWinStreak: activeBasketballStreak(data),
      };
    }
  }
  const byPhase = (
    data.rankingByPhase as Record<string, Record<string, unknown>>
  )?.[phase];
  if (byPhase && typeof byPhase === "object") {
    const tp = Number(byPhase.totalPosts ?? 0);
    const tw = Number(byPhase.totalWins ?? 0);
    return {
      totalPosts: tp,
      totalWins: tw,
      winRate: tp > 0 ? tw / tp : Number(byPhase.winRate ?? 0),
      totalPoints: Number(byPhase.totalPoints ?? 0),
      totalPrecision: Number(byPhase.totalPrecision ?? 0),
      totalUpset: Number(byPhase.totalUpset ?? 0),
      totalGoalScorerHits: Number(byPhase.totalGoalScorerHits ?? 0),
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

function activeFootballStreak(data: Record<string, unknown>): number {
  const signed =
    data.activeWinStreakFootball ??
    (data.streakBySport as Record<string, unknown> | undefined)?.football ??
    data.streakFootball ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

function readStoredRank(
  data: Record<string, unknown>,
  metric: RankMetric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): number | null {
  return readStoredRankFromSnapshotRanks(
    data,
    metric as SnapshotRankMetric,
    phase,
    round,
    wcStage
  );
}

async function loadPriorHistoryBlock(
  uid: string
): Promise<Record<string, unknown> | null> {
  let key = getYesterdayDateKeyJST();
  const adminDb = getAdminDb();
  for (let i = 0; i < RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS; i++) {
    const snap = await adminDb
      .collection("cumulative_stats")
      .doc(uid)
      .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
      .doc(key)
      .get();
    if (snap.exists) return (snap.data() ?? {}) as Record<string, unknown>;
    key = subtractOneDayFromDateKeyJST(key);
  }
  return null;
}

function readPriorRankFromHist(
  hist: Record<string, unknown> | null,
  metric: RankMetric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
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
  } else if (phase === "playoffs" && round !== "overall") {
    raw = (
      hist.playoffRounds as
        | Partial<
            Record<PlayoffRoundKey, Partial<Record<RankMetric, unknown>>>
          >
        | undefined
    )?.[round]?.[metric];
  } else {
    raw = (hist[phase] as Partial<Record<RankMetric, unknown>> | undefined)?.[
      metric
    ];
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
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): number {
  if (metric !== "winRate") return 1;
  return minPostsForWinRate({
    rankingLeague: wcStage ? "worldcup" : "nba",
    phase,
    round,
    wcStage,
  });
}

/** MyRankCard 用 — Firestore snapshotRanks を直接読む（Functions 不要） */
export async function loadPersonalBulkOverlayFromFirestore(
  uid: string,
  metrics: BulkRankingMetric[],
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<Record<string, BulkMetricPayload>> {
  const snap = await getAdminDb().collection("cumulative_stats").doc(uid).get();
  if (!snap.exists) {
    return Object.fromEntries(metrics.map((m) => [m, emptyPayload()]));
  }

  const data = snap.data() as Record<string, unknown>;
  const rk = wcStage
    ? readWcSlice(data, wcStage)
    : readNbaSlice(data, phase, round);
  const priorHist = await loadPriorHistoryBlock(uid);

  const byMetric: Record<string, BulkMetricPayload> = {};
  for (const metric of metrics) {
    if ((rk.totalPosts ?? 0) < minPostsForMetric(metric, phase, round, wcStage)) {
      byMetric[metric] = emptyPayload();
      continue;
    }

    const myRank = readStoredRank(data, metric, phase, round, wcStage);
    const myRankDeltaPlaces = rankDeltaPlaces(
      myRank,
      readPriorRankFromHist(priorHist, metric, phase, round, wcStage)
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
