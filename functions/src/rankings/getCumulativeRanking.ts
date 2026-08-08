// functions/src/rankings/getCumulativeRanking.ts
// ランキング一覧は cumulative_ranking_snapshots をそのまま返す。
// NBA 現行シーズン（s<key>_<metric>）のみ。

import { onRequest } from "firebase-functions/v2/https";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";
import {
  getYesterdayDateKeyJST,
  nbaSeasonRankingSlice,
  NBA_SEASON_WIN_RATE_MIN_POSTS,
  RANK_SNAPSHOT_HISTORY_SUBCOL,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "./buildCumulativeRankingSnapshot";
import { readStoredRankFromUser as readStoredRankFromCumulativeDoc } from "./readSnapshotRanksFromCumulative";
import { safeRankMetricNum } from "./safeRankMetricNum";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonSnapshotDocId,
} from "./nbaSeason";

function db() {
  return getFirestore();
}

type CachedSnapshotDoc = {
  at: number;
  exists: boolean;
  data: Record<string, unknown> | undefined;
};

/** 同一インスタンスの stampede を 1 read にまとめる */
const SNAPSHOT_MEM_TTL_MS = 10 * 60 * 1000;
const snapshotMem = new Map<string, CachedSnapshotDoc>();
const snapshotInflight = new Map<string, Promise<CachedSnapshotDoc>>();

async function loadRankingSnapshotDoc(
  snapshotDocId: string
): Promise<CachedSnapshotDoc> {
  const now = Date.now();
  const hit = snapshotMem.get(snapshotDocId);
  if (hit && now - hit.at < SNAPSHOT_MEM_TTL_MS) return hit;
  const pending = snapshotInflight.get(snapshotDocId);
  if (pending) return pending;

  const p = (async (): Promise<CachedSnapshotDoc> => {
    const snapDoc = await db()
      .collection("cumulative_ranking_snapshots")
      .doc(snapshotDocId)
      .get();
    const cached: CachedSnapshotDoc = {
      at: Date.now(),
      exists: snapDoc.exists,
      data: snapDoc.exists
        ? (snapDoc.data() as Record<string, unknown>)
        : undefined,
    };
    snapshotMem.set(snapshotDocId, cached);
    return cached;
  })().finally(() => {
    snapshotInflight.delete(snapshotDocId);
  });
  snapshotInflight.set(snapshotDocId, p);
  return p;
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalExactHits"
  | "totalUpset"
  | "activeWinStreak"
  | "totalGoalScorerHits";

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

function activeBasketballStreak(d: any): number {
  const signed =
    d.activeWinStreakBasketball ??
    d.streakBySport?.basketball ??
    d.currentStreak ??
    d.activeWinStreak ??
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

function minPostsForMetric(metric: Metric): number {
  if (metric !== "winRate") return 1;
  return NBA_SEASON_WIN_RATE_MIN_POSTS;
}

function readPriorRankFromHist(
  histSnap: DocumentSnapshot | null,
  metric: Metric
): unknown {
  if (!histSnap?.exists) return undefined;
  const hd = histSnap.data() as Record<string, unknown>;
  return (
    hd.seasons as
      | Partial<Record<string, Partial<Record<Metric, number>>>>
      | undefined
  )?.[CURRENT_NBA_SEASON_KEY]?.[metric];
}

function buildMyRowFromStats(
  uid: string,
  me: Record<string, unknown>,
  rk: ReturnType<typeof nbaSeasonRankingSlice>,
  opts: {
    metric: Metric;
    myRank: number | null;
    myRankDeltaPlaces: number | null;
  }
): RankingRow {
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
    activeWinStreak: activeBasketballStreak(me),

    rank: opts.myRank ?? 0,
    rankDeltaPlaces: opts.myRankDeltaPlaces,
  };
}

async function personalRankingPayloadForMetric(
  metric: Metric,
  uid: string,
  snaps: UserRankingSnaps
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
  const rk = nbaSeasonRankingSlice(me);

  if ((rk.totalPosts ?? 0) < minPostsForMetric(metric)) {
    return {
      count: 0,
      rows: [],
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  }

  const myRank = readStoredRankFromCumulativeDoc(me, metric);
  const myRankDeltaPlaces = rankDeltaPlacesFromHist(
    snaps.histSnap,
    myRank,
    readPriorRankFromHist(snaps.histSnap, metric)
  );
  const myRow = buildMyRowFromStats(uid, me, rk, {
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
  uid: string | undefined,
  snaps: UserRankingSnaps,
  personalOnly = false
): Promise<MetricPayload> {
  if (personalOnly && uid) {
    return personalRankingPayloadForMetric(metric, uid, snaps);
  }

  const snapshotDocId = nbaSeasonSnapshotDocId(CURRENT_NBA_SEASON_KEY, metric);

  const snapDoc = await loadRankingSnapshotDoc(snapshotDocId);

  const snapData = snapDoc.exists ? snapDoc.data : undefined;

  const rawRows: RankingRow[] = snapDoc.exists
    ? ((snapDoc.data?.rows ?? []) as RankingRow[])
    : [];
  let rows = normalizeSnapshotRows(rawRows, metric);
  let totalCount = readSnapshotTotalCount(snapData, rows.length);

  if (rows.length === 0 && metric !== "activeWinStreak") {
    console.warn(
      `[getCumulativeRanking] empty snapshot ${snapshotDocId}; skip live full-scan fallback`
    );
  }

  let myRank: number | null = null;
  let myRow: RankingRow | null = null;
  let myRankDeltaPlaces: number | null = null;

  if (uid && snaps.mySnap?.exists) {
    const me = snaps.mySnap.data() as Record<string, unknown>;
    const rk = nbaSeasonRankingSlice(me);

    if ((rk.totalPosts ?? 0) < minPostsForMetric(metric)) {
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
      myRank = readStoredRankFromCumulativeDoc(me, metric);
      myRankDeltaPlaces = rankDeltaPlacesFromHist(
        snaps.histSnap,
        myRank,
        readPriorRankFromHist(snaps.histSnap, metric)
      );
    }

    myRow = buildMyRowFromStats(uid, me, rk, {
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
    // phase / round / wcStage パラメータは旧 UI 互換のため受け取るが無視する
    // （NBA は常に現行シーズン s<key>_<metric> を返す）。

    const bulkMetrics = parseMetricsParam(req.query.metrics);
    const personalOnly =
      req.query.personalOnly === "1" || req.query.personalOnly === "true";
    if (bulkMetrics) {
      const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
      const byMetric: Record<string, MetricPayload> = {};
      const payloads = await Promise.all(
        bulkMetrics.map((m) =>
          rankingPayloadForMetric(m, uid, snaps, personalOnly)
        )
      );
      bulkMetrics.forEach((m, i) => {
        byMetric[m] = payloads[i]!;
      });
      res.status(200).json({
        ok: true,
        seasonKey: CURRENT_NBA_SEASON_KEY,
        wcStage: null,
        byMetric,
      });
      return;
    }

    const rawMetric = req.query.metric;
    const metric: Metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
    const snaps = uid ? await loadUserRankingSnaps(uid) : EMPTY_USER_SNAPS;
    const payload = await rankingPayloadForMetric(
      metric,
      uid,
      snaps,
      personalOnly
    );

    res.status(200).json({
      ok: true,
      metric,
      seasonKey: CURRENT_NBA_SEASON_KEY,
      wcStage: null,
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
