/**
 * NBA 無差別級（Pro 限定）シーズンスナップショットの読取・ライブフォールバック。
 */

import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonOpenSnapshotDocId,
} from "@/lib/rankings/nbaSeason";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import type { RankingApiRow } from "@/lib/rankings/rankingTransform";
import type { BulkMetricPayload } from "@/lib/rankings/server/fetchCumulativeRankingBulk";

const OPEN_SEASON_METRICS = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
] as const;

type OpenSeasonMetric = (typeof OPEN_SEASON_METRICS)[number];

const NBA_SEASON_WIN_RATE_MIN_POSTS = 20;

type SnapshotDoc = {
  rows?: Array<RankingApiRow & { rank: number }>;
  ranks?: Record<string, number>;
  totalCount?: number;
};

export type OpenSeasonBulk = {
  ok: true;
  division: "open";
  seasonKey: string;
  byMetric: Record<string, BulkMetricPayload>;
};

/** cron 生成の無差別級シーズン doc を読む。無ければ null */
export async function readNbaOpenSeasonRankingSnapshots(opts: {
  uid?: string | null;
  metrics?: string[];
}): Promise<OpenSeasonBulk | null> {
  const seasonKey = CURRENT_NBA_SEASON_KEY;
  const metrics = (opts.metrics?.length
    ? opts.metrics.filter((m): m is OpenSeasonMetric =>
        (OPEN_SEASON_METRICS as readonly string[]).includes(m)
      )
    : [...OPEN_SEASON_METRICS]) as OpenSeasonMetric[];
  if (metrics.length === 0) return null;

  const db = getAdminDb();
  const refs = metrics.map((metric) =>
    db
      .collection("cumulative_ranking_snapshots")
      .doc(nbaSeasonOpenSnapshotDocId(seasonKey, metric))
  );
  const snaps = await db.getAll(...refs);
  if (snaps.every((s) => !s.exists)) return null;

  const myUid = opts.uid ?? null;
  const byMetric: Record<string, BulkMetricPayload> = {};

  snaps.forEach((snap, i) => {
    const metric = metrics[i]!;
    const data = (snap.exists ? snap.data() : null) as SnapshotDoc | null;
    const rows = Array.isArray(data?.rows) ? data!.rows! : [];
    const ranks = data?.ranks ?? {};
    const myRank = myUid ? ranks[myUid] ?? null : null;
    const myInTop = myUid ? rows.find((r) => r.uid === myUid) ?? null : null;
    byMetric[metric] = {
      ok: true,
      rows,
      count: Number(data?.totalCount ?? rows.length),
      myRank,
      myRow: myInTop,
      myRankDeltaPlaces: null,
    };
  });

  await mergeUserPlansIntoBulkByMetric(byMetric);
  return { ok: true, division: "open", seasonKey, byMetric };
}

type SeasonSlice = {
  totalPosts?: number;
  totalWins?: number;
  winRate?: number;
  totalPoints?: number;
  totalUpset?: number;
  totalGoalScorerHits?: number;
  totalPrecision?: number;
};

/**
 * スナップショット未整備時のライブ集計（cumulative_stats から Pro のみ）。
 */
export async function buildNbaOpenSeasonRankingFromCumulative(opts: {
  uid?: string | null;
  metrics?: string[];
}): Promise<OpenSeasonBulk> {
  const seasonKey = CURRENT_NBA_SEASON_KEY;
  const metrics = (opts.metrics?.length
    ? opts.metrics.filter((m): m is OpenSeasonMetric =>
        (OPEN_SEASON_METRICS as readonly string[]).includes(m)
      )
    : [...OPEN_SEASON_METRICS]) as OpenSeasonMetric[];

  const db = getAdminDb();
  const snap = await db
    .collection("cumulative_stats")
    .where("rankingTotalPosts", ">", 0)
    .get()
    .catch(async () => db.collection("cumulative_stats").get());

  const baseRows: RankingApiRow[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.plan !== "pro") continue;
    const bySeason = d.rankingBySeason as
      | Record<string, SeasonSlice>
      | undefined;
    const r =
      bySeason?.[seasonKey] ??
      (d.leagues as { nba?: SeasonSlice } | undefined)?.nba ??
      null;
    if (!r || typeof r !== "object") continue;
    const totalPosts = Number(r.totalPosts ?? 0) || 0;
    if (totalPosts <= 0) continue;
    const totalWins = Number(r.totalWins ?? 0) || 0;
    baseRows.push({
      uid: doc.id,
      displayName: String(d.displayName ?? "user"),
      handle: (d.handle as string | null) ?? null,
      photoURL: (d.photoURL as string | null) ?? null,
      countryCode: (d.countryCode as string | null) ?? null,
      plan: "pro",
      totalPosts,
      totalWins,
      totalPoints: Number(r.totalPoints ?? 0) || 0,
      totalUpset: Number(r.totalUpset ?? 0) || 0,
      totalGoalScorerHits: Number(r.totalGoalScorerHits ?? 0) || 0,
      totalPrecision: Number(r.totalPrecision ?? 0) || 0,
      activeWinStreak: 0,
      winRate:
        typeof r.winRate === "number"
          ? r.winRate
          : totalPosts > 0
            ? totalWins / totalPosts
            : 0,
    } as RankingApiRow);
  }

  await mergeUserPlansIntoBulkByMetric({
    _all: {
      rows: baseRows,
      myRow: null,
    },
  });
  const proRows = baseRows.filter((r) => r.plan === "pro");

  const byMetric: Record<string, BulkMetricPayload> = {};
  const myUid = opts.uid ?? null;

  for (const metric of metrics) {
    const eligible =
      metric === "winRate"
        ? proRows.filter(
            (r) => (r.totalPosts ?? 0) >= NBA_SEASON_WIN_RATE_MIN_POSTS
          )
        : proRows;
    const sorted = [...eligible].sort((a, b) => {
      const va = metricValue(a, metric);
      const vb = metricValue(b, metric);
      if (vb !== va) return vb - va;
      if (metric === "winRate") {
        const pd = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
        if (pd !== 0) return pd;
      }
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
    });
    let lastVal: number | null = null;
    let lastRank = 0;
    const ranked = sorted.map((row, i) => {
      const v = metricValue(row, metric);
      const rank = lastVal != null && v === lastVal ? lastRank : i + 1;
      lastVal = v;
      lastRank = rank;
      return { ...row, rank };
    });
    const top = ranked.slice(0, 20);
    const myFull = myUid ? ranked.find((r) => r.uid === myUid) ?? null : null;
    byMetric[metric] = {
      ok: true,
      rows: top,
      count: ranked.length,
      myRank: myFull?.rank ?? null,
      myRow: myFull,
      myRankDeltaPlaces: null,
    };
  }

  await mergeUserPlansIntoBulkByMetric(byMetric);
  return { ok: true, division: "open", seasonKey, byMetric };
}

function metricValue(row: RankingApiRow, metric: OpenSeasonMetric): number {
  if (metric === "winRate") return Number(row.winRate ?? 0) || 0;
  if (metric === "totalUpset") return Number(row.totalUpset ?? 0) || 0;
  if (metric === "totalGoalScorerHits")
    return Number(row.totalGoalScorerHits ?? 0) || 0;
  return Number(row.totalPoints ?? 0) || 0;
}
