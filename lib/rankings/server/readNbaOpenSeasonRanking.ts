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

/**
 * スナップショット未整備時のライブ集計。
 * ⚠️ 全件スキャンは課金・レイテンシ事故になるため禁止。
 * cron が `s{season}_open_*` を書くまで空を返す。
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

  console.warn(
    "[buildNbaOpenSeasonRankingFromCumulative] open-season snapshot missing; refusing full cumulative_stats scan",
    { seasonKey, metrics }
  );

  const byMetric: Record<string, BulkMetricPayload> = {};
  for (const metric of metrics) {
    byMetric[metric] = {
      ok: true,
      rows: [],
      count: 0,
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  }
  return { ok: true, division: "open", seasonKey, byMetric };
}
