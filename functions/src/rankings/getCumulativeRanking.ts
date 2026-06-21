// functions/src/rankings/getCumulativeRanking.ts
// ランキング一覧は cumulative_ranking_snapshots をそのまま返す。
// 自分の順位は snapshotRanks / 一覧行の rank を参照（live count しない）。

import { onRequest } from "firebase-functions/v2/https";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";
import {
  getYesterdayDateKeyJST,
  loadPlayoffRoundTop20RowsLive,
  loadWcStageTop20RowsLive,
  RANK_SNAPSHOT_HISTORY_SUBCOL,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "./buildCumulativeRankingSnapshot";
import type { WcRankingStage } from "./wcRankingStage";
import { readStoredRankFromUser as readStoredRankFromCumulativeDoc } from "./readSnapshotRanksFromCumulative";
import { safeRankMetricNum } from "./safeRankMetricNum";
import { isWcRankingStage, minPostsForWcWinRate } from "./wcRankingStage";

function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalExactHits"
  | "totalUpset"
  | "activeWinStreak"
  | "totalGoalScorerHits";

const MIN_POSTS_FOR_WIN_RATE_BASE = 1;

function minPostsForWinRate(phase: RankingPhase, round: PlayoffRoundKey): number {
  if (phase === "playoffs" && (round === "overall" || round === "r1")) {
    return 20;
  }
  return MIN_POSTS_FOR_WIN_RATE_BASE;
}

type RankingPhase = "play_in" | "playoffs";
type PlayoffRoundKey = "overall" | "r1" | "r2" | "cf" | "finals";

type RankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode?: string | null;
  plan?: "free" | "pro";

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  totalExactHits?: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  activeWinStreak: number;

  rank: number;
  rankDeltaPlaces?: number | null;
  metricValueDelta?: number | null;
};

function isMetric(v: unknown): v is Metric {
  return (
    v === "winRate" ||
    v === "totalPoints" ||
    v === "totalPrecision" ||
    v === "totalExactHits" ||
    v === "totalUpset" ||
    v === "activeWinStreak" ||
    v === "totalGoalScorerHits"
  );
}

function isRankingPhase(v: unknown): v is RankingPhase {
  return v === "play_in" || v === "playoffs";
}

function isPlayoffRoundKey(v: unknown): v is PlayoffRoundKey {
  return (
    v === "overall" || v === "r1" || v === "r2" || v === "cf" || v === "finals"
  );
}

function rankingSlice(
  d: any,
  phase: RankingPhase,
  round: PlayoffRoundKey = "overall"
) {
  if (phase === "playoffs" && round !== "overall") {
    const byRound = d.rankingByPlayoffRound?.[round];
    if (byRound && typeof byRound === "object") {
      const tp = byRound.totalPosts ?? 0;
      const tw = byRound.totalWins ?? 0;
      return {
        totalPosts: tp,
        totalWins: tw,
        winRate: tp > 0 ? tw / tp : byRound.winRate ?? 0,
        totalPoints: byRound.totalPoints ?? 0,
        totalPrecision: byRound.totalPrecision ?? 0,
        totalUpset: byRound.totalUpset ?? 0,
        totalGoalScorerHits: byRound.totalGoalScorerHits ?? 0,
      };
    }
  }
  const byPhase = d.rankingByPhase?.[phase];
  if (byPhase && typeof byPhase === "object") {
    const tp = byPhase.totalPosts ?? 0;
    const tw = byPhase.totalWins ?? 0;
    return {
      totalPosts: tp,
      totalWins: tw,
      winRate: tp > 0 ? tw / tp : byPhase.winRate ?? 0,
      totalPoints: byPhase.totalPoints ?? 0,
      totalPrecision: byPhase.totalPrecision ?? 0,
      totalUpset: byPhase.totalUpset ?? 0,
      totalGoalScorerHits: byPhase.totalGoalScorerHits ?? 0,
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
  };
}

function rankingSliceWc(d: any, stage: WcRankingStage) {
  const block = d.rankingByWcStage?.[stage];
  if (!block || typeof block !== "object") {
    return {
      totalPosts: 0,
      totalWins: 0,
      winRate: 0,
      totalPoints: 0,
      totalPrecision: 0,
      totalUpset: 0,
      totalGoalScorerHits: 0,
    };
  }
  const tp = block.totalPosts ?? 0;
  const tw = block.totalWins ?? 0;
  return {
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : block.winRate ?? 0,
    totalPoints: block.totalPoints ?? 0,
    totalPrecision: block.totalPrecision ?? 0,
    totalUpset: block.totalUpset ?? 0,
    totalGoalScorerHits: block.totalGoalScorerHits ?? 0,
  };
}

function activeBasketballStreak(d: any): number {
  const signed =
    d.activeWinStreakBasketball ??
    d.streakBySport?.basketball ??
    d.currentStreak ??
    d.activeWinStreak ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

function activeFootballStreak(d: any): number {
  const signed =
    d.activeWinStreakFootball ??
    d.streakBySport?.football ??
    d.streakFootball ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

type UserRankingSnaps = {
  mySnap: DocumentSnapshot | null;
  histSnap: DocumentSnapshot | null;
};

const EMPTY_USER_SNAPS: UserRankingSnaps = { mySnap: null, histSnap: null };

async function loadLatestHistSnapForUid(
  uid: string
): Promise<DocumentSnapshot | null> {
  const firestore = db();
  let key = getYesterdayDateKeyJST();
  for (let i = 0; i < RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS; i++) {
    const snap = await firestore
      .collection("cumulative_stats")
      .doc(uid)
      .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
      .doc(key)
      .get();
    if (snap.exists) return snap;
    key = subtractOneDayFromDateKeyJST(key);
  }
  return null;
}

async function loadUserRankingSnaps(
  uid: string | undefined
): Promise<UserRankingSnaps> {
  if (!uid) return EMPTY_USER_SNAPS;
  const mySnap = await db().collection("cumulative_stats").doc(uid).get();
  if (!mySnap.exists) return { mySnap, histSnap: null };
  const histSnap = await loadLatestHistSnapForUid(uid);
  return { mySnap, histSnap };
}

function parseMetricsParam(raw: unknown): Metric[] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: Metric[] = [];
  for (const p of parts) {
    if (isMetric(p)) out.push(p);
  }
  if (out.length === 0) return null;
  return [...new Set(out)];
}

type MetricPayload = {
  count: number;
  rows: RankingRow[];
  myRank: number | null;
  myRow: RankingRow | null;
  myRankDeltaPlaces: number | null;
};

function readSnapshotTotalCount(
  snapData: Record<string, unknown> | undefined,
  fallback: number
): number {
  const raw = snapData?.totalCount;
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0
    ? Math.floor(raw)
    : fallback;
}

function resolveParticipantCount(
  totalCount: number,
  myRank: number | null
): number {
  if (myRank != null && myRank > totalCount) return myRank;
  return totalCount;
}

function rankDeltaPlacesFromHist(
  histSnap: DocumentSnapshot | null,
  myRank: number | null,
  prevRankRaw: unknown
): number | null {
  if (!histSnap?.exists || myRank == null) return null;
  const prevRank =
    typeof prevRankRaw === "number" &&
    Number.isFinite(prevRankRaw) &&
    prevRankRaw >= 1
      ? Math.floor(prevRankRaw)
      : null;
  if (prevRank == null) return null;
  const d = prevRank - myRank;
  return d !== 0 ? d : null;
}

function normalizePlan(plan: unknown): "free" | "pro" {
  return plan === "pro" ? "pro" : "free";
}

function rowMetricValue(row: RankingRow, metric: Metric): number {
  if (metric === "activeWinStreak") return safeRankMetricNum(row.activeWinStreak);
  if (metric === "winRate") return safeRankMetricNum(row.winRate);
  if (metric === "totalPoints") return safeRankMetricNum(row.totalPoints);
  if (metric === "totalExactHits")
    return safeRankMetricNum(row.totalExactHits ?? row.totalPrecision);
  if (metric === "totalPrecision") return safeRankMetricNum(row.totalPrecision);
  if (metric === "totalGoalScorerHits")
    return safeRankMetricNum(row.totalGoalScorerHits);
  return safeRankMetricNum(row.totalUpset);
}

/** Same ordering as buildCumulativeRankingSnapshot `cmpSortRows`. */
function cmpRankingRows(a: RankingRow, b: RankingRow, metric: Metric): number {
  const diff = rowMetricValue(b, metric) - rowMetricValue(a, metric);
  if (diff !== 0) return diff;
  if (metric === "winRate") {
    const postsDiff = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
    if (postsDiff !== 0) return postsDiff;
  }
  return safeRankMetricNum(b.totalPoints) - safeRankMetricNum(a.totalPoints);
}

function sortSnapshotRows(rows: RankingRow[], metric: Metric): RankingRow[] {
  return [...rows].sort((a, b) => cmpRankingRows(a, b, metric));
}

function normalizeSnapshotRows(
  rows: RankingRow[],
  metric: Metric
): RankingRow[] {
  let out: RankingRow[] = rows.map((row) => ({
    ...row,
    plan: normalizePlan(row.plan),
  }));
  if (metric === "totalExactHits") {
    out = out.map((r) => ({
      ...r,
      totalExactHits: r.totalExactHits ?? r.totalPrecision ?? 0,
    }));
  }
  return sortSnapshotRows(out, metric);
}

function readStoredRankFromUser(
  me: Record<string, unknown>,
  metric: Metric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): number | null {
  return readStoredRankFromCumulativeDoc(me, metric, phase, round, wcStage);
}

function readPriorRankFromHist(
  histSnap: DocumentSnapshot | null,
  metric: Metric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): unknown {
  if (!histSnap?.exists) return undefined;
  const hd = histSnap.data() as Record<string, unknown>;
  if (wcStage) {
    return (
      hd.wc as
        | Partial<Record<WcRankingStage, Partial<Record<Metric, number>>>>
        | undefined
    )?.[wcStage]?.[metric];
  }
  if (phase === "playoffs" && round !== "overall") {
    return (
      hd.playoffRounds as
        | Partial<
            Record<PlayoffRoundKey, Partial<Record<Metric, number>>>
          >
        | undefined
    )?.[round]?.[metric];
  }
  return (hd[phase] as Partial<Record<Metric, number>> | undefined)?.[metric];
}

function buildMyRowFromStats(
  uid: string,
  me: Record<string, unknown>,
  rk: ReturnType<typeof rankingSlice>,
  opts: {
    wcStage: WcRankingStage | null;
    metric: Metric;
    myRank: number | null;
    myRankDeltaPlaces: number | null;
  }
): RankingRow {
  const streak = opts.wcStage
    ? activeFootballStreak(me)
    : activeBasketballStreak(me);

  return {
    uid,
    displayName: String(me.displayName ?? ""),
    handle: (me.handle as string | null | undefined) ?? null,
    photoURL: (me.photoURL as string | null | undefined) ?? null,
    countryCode: (me.countryCode as string | null | undefined) ?? null,
    plan: me.plan === "pro" ? "pro" : "free",

    totalPosts: rk.totalPosts,
    totalWins: rk.totalWins,
    winRate: rk.winRate,

    totalPoints: rk.totalPoints,
    totalPrecision: rk.totalPrecision,
    totalExactHits:
      opts.metric === "totalExactHits" ? rk.totalPrecision ?? 0 : undefined,
    totalUpset: rk.totalUpset,
    totalGoalScorerHits: rk.totalGoalScorerHits ?? 0,
    activeWinStreak: streak,

    rank: opts.myRank ?? 0,
    rankDeltaPlaces: opts.myRankDeltaPlaces,
  };
}

async function personalRankingPayloadForMetric(
  metric: Metric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  uid: string,
  snaps: UserRankingSnaps,
  wcStage?: WcRankingStage | null
): Promise<MetricPayload> {
  if (!snaps.mySnap?.exists) {
    return {
      count: 0,
      rows: [],
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  }

  const me = snaps.mySnap.data() as Record<string, unknown>;
  const rk = wcStage
    ? rankingSliceWc(me, wcStage)
    : rankingSlice(me, phase, round);

  const minPosts =
    metric === "winRate"
      ? wcStage
        ? minPostsForWcWinRate(wcStage)
        : minPostsForWinRate(phase, round)
      : 1;
  if ((rk.totalPosts ?? 0) < minPosts) {
    return {
      count: 0,
      rows: [],
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  }

  const myRank = readStoredRankFromUser(
    me,
    metric,
    phase,
    round,
    wcStage ?? null
  );
  const myRankDeltaPlaces = rankDeltaPlacesFromHist(
    snaps.histSnap,
    myRank,
    readPriorRankFromHist(
      snaps.histSnap,
      metric,
      phase,
      round,
      wcStage ?? null
    )
  );
  const myRow = buildMyRowFromStats(uid, me, rk, {
    wcStage: wcStage ?? null,
    metric,
    myRank,
    myRankDeltaPlaces,
  });

  return {
    count: 0,
    rows: [],
    myRank,
    myRow,
    myRankDeltaPlaces,
  };
}

async function rankingPayloadForMetric(
  metric: Metric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  uid: string | undefined,
  snaps: UserRankingSnaps,
  wcStage?: WcRankingStage | null,
  personalOnly = false
): Promise<MetricPayload> {
  if (personalOnly && uid) {
    return personalRankingPayloadForMetric(
      metric,
      phase,
      round,
      uid,
      snaps,
      wcStage
    );
  }

  const snapshotDocId = wcStage
    ? `wc_${wcStage}_${metric}`
    : round === "overall"
      ? `${phase}_${metric}`
      : `${phase}_${round}_${metric}`;

  const snapDoc = await db()
    .collection("cumulative_ranking_snapshots")
    .doc(snapshotDocId)
    .get();

  const snapData = snapDoc.exists
    ? (snapDoc.data() as Record<string, unknown>)
    : undefined;

  const rawRows: RankingRow[] = snapDoc.exists
    ? (snapDoc.data()?.rows ?? [])
    : [];
  let rows = normalizeSnapshotRows(rawRows, metric);
  let totalCount = readSnapshotTotalCount(snapData, rows.length);

  /** スナップショット未生成時のみ live フォールバック */
  /** 連勝は 16:00 スナップショットのみ（live フォールバックなし） */
  if (rows.length === 0 && wcStage && metric !== "activeWinStreak") {
    const live = await loadWcStageTop20RowsLive(wcStage, metric);
    rows = normalizeSnapshotRows(live.rows as RankingRow[], metric);
    totalCount = live.totalCount;
  }

  if (
    rows.length === 0 &&
    metric !== "activeWinStreak" &&
    !wcStage &&
    phase === "playoffs" &&
    round !== "overall" &&
    (round === "r1" || round === "r2" || round === "cf" || round === "finals")
  ) {
    const live = await loadPlayoffRoundTop20RowsLive(round, metric);
    rows = normalizeSnapshotRows(live.rows as RankingRow[], metric);
    totalCount = live.totalCount;
  }

  let myRank: number | null = null;
  let myRow: RankingRow | null = null;
  let myRankDeltaPlaces: number | null = null;

  if (uid && snaps.mySnap?.exists) {
    const me = snaps.mySnap.data() as Record<string, unknown>;
    const rk = wcStage
      ? rankingSliceWc(me, wcStage)
      : rankingSlice(me, phase, round);

    const minPosts =
      metric === "winRate"
        ? wcStage
          ? minPostsForWcWinRate(wcStage)
          : minPostsForWinRate(phase, round)
        : 1;
    if ((rk.totalPosts ?? 0) < minPosts) {
      return {
        count: resolveParticipantCount(totalCount, null),
        rows,
        myRank: null,
        myRow: null,
        myRankDeltaPlaces: null,
      };
    }

    const listRow = rows.find((r) => r.uid === uid);
    if (listRow) {
      myRank = listRow.rank;
      myRankDeltaPlaces = listRow.rankDeltaPlaces ?? null;
    } else {
      myRank = readStoredRankFromUser(me, metric, phase, round, wcStage ?? null);
      myRankDeltaPlaces = rankDeltaPlacesFromHist(
        snaps.histSnap,
        myRank,
        readPriorRankFromHist(
          snaps.histSnap,
          metric,
          phase,
          round,
          wcStage ?? null
        )
      );
    }

    myRow = buildMyRowFromStats(uid, me, rk, {
      wcStage: wcStage ?? null,
      metric,
      myRank,
      myRankDeltaPlaces,
    });
  }

  return {
    count: resolveParticipantCount(totalCount, myRank),
    rows,
    myRank,
    myRow,
    myRankDeltaPlaces,
  };
}

export const getCumulativeRanking = onRequest(async (req, res) => {
  try {
    const uid = req.query.uid as string | undefined;
    const rawPhase = req.query.phase;
    const phase: RankingPhase = isRankingPhase(rawPhase) ? rawPhase : "playoffs";
    const rawRound = req.query.round;
    const round: PlayoffRoundKey = isPlayoffRoundKey(rawRound)
      ? rawRound
      : "overall";

    const rawWcStage = req.query.wcStage;
    const wcStage = isWcRankingStage(rawWcStage) ? rawWcStage : null;

    const bulkMetrics = parseMetricsParam(req.query.metrics);
    const personalOnly =
      req.query.personalOnly === "1" || req.query.personalOnly === "true";
    if (bulkMetrics) {
      const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
      const byMetric: Record<string, MetricPayload> = {};
      const payloads = await Promise.all(
        bulkMetrics.map((m) =>
          rankingPayloadForMetric(
            m,
            phase,
            round,
            uid,
            snaps,
            wcStage,
            personalOnly
          )
        )
      );
      bulkMetrics.forEach((m, i) => {
        byMetric[m] = payloads[i]!;
      });
      res.status(200).json({
        ok: true,
        phase,
        round,
        wcStage,
        byMetric,
      });
      return;
    }

    const rawMetric = req.query.metric;
    const metric: Metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
    const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
    const payload = await rankingPayloadForMetric(
      metric,
      phase,
      round,
      uid,
      snaps,
      wcStage,
      personalOnly
    );

    res.status(200).json({
      ok: true,
      metric,
      phase,
      round,
      wcStage,
      count: payload.count,
      rows: payload.rows,
      myRank: payload.myRank,
      myRow: payload.myRow,
      myRankDeltaPlaces: payload.myRankDeltaPlaces,
    });
    return;
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message ?? "unknown error",
    });
    return;
  }
});
