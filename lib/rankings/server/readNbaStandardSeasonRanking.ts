/**
 * 標準級シーズン一覧。
 * 計算口の Cloud Function は内部シークレット必須なので、公開 API は
 * `cumulative_ranking_snapshots`（例: s2026-27_totalPoints）を直接読む。
 */

import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonSnapshotDocId,
} from "@/lib/rankings/nbaSeason";
import type { RankingApiRow } from "@/lib/rankings/rankingTransform";
import type { BulkMetricPayload } from "@/lib/rankings/server/fetchCumulativeRankingBulk";

type SnapshotDoc = {
  rows?: Array<RankingApiRow & { rank: number }>;
  totalCount?: number;
};

export type StandardSeasonBulk = {
  ok: true;
  seasonKey: string;
  byMetric: Record<string, BulkMetricPayload>;
};

function normalizePlan(plan: unknown): "free" | "pro" {
  return plan === "pro" ? "pro" : "free";
}

function normalizeRows(
  rows: Array<RankingApiRow & { rank: number }>,
  metric: string
): Array<RankingApiRow & { rank: number }> {
  return rows.map((row) => {
    const next = { ...row, plan: normalizePlan(row.plan) };
    if (metric === "totalExactHits") {
      next.totalExactHits = row.totalExactHits ?? row.totalPrecision ?? 0;
    }
    return next;
  });
}

/** cron が書いた標準級シーズン doc を指標ごとに読む。無い指標は空行 */
export async function readNbaStandardSeasonRankingSnapshots(opts: {
  metrics: string[];
}): Promise<StandardSeasonBulk> {
  const seasonKey = CURRENT_NBA_SEASON_KEY;
  const metrics = [...new Set(opts.metrics.map((m) => m.trim()).filter(Boolean))];
  const db = getAdminDb();
  const refs = metrics.map((metric) =>
    db
      .collection("cumulative_ranking_snapshots")
      .doc(nbaSeasonSnapshotDocId(seasonKey, metric))
  );
  const snaps = metrics.length > 0 ? await db.getAll(...refs) : [];
  const byMetric: Record<string, BulkMetricPayload> = {};

  snaps.forEach((snap, i) => {
    const metric = metrics[i]!;
    const data = (snap.exists ? snap.data() : null) as SnapshotDoc | null;
    const rows = normalizeRows(
      Array.isArray(data?.rows) ? data!.rows! : [],
      metric
    );
    const rawCount = data?.totalCount;
    const count =
      typeof rawCount === "number" && Number.isFinite(rawCount) && rawCount >= 0
        ? Math.floor(rawCount)
        : rows.length;
    byMetric[metric] = {
      ok: true,
      rows,
      count,
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  });

  return { ok: true, seasonKey, byMetric };
}
