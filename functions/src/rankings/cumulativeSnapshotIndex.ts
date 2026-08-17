/**
 * cumulative_stats のスナップショット用フラット index。
 * Firestore はネストした rankingByWcStage.*.totalPosts を where できないため、
 * 試合確定時に rankingTotalPosts を同期する。
 */

import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase-admin/firestore";

export const CUMULATIVE_RANKING_TOTAL_POSTS_FIELD = "rankingTotalPosts";

export function readRankingTotalPosts(
  data: Record<string, unknown> | undefined
): number {
  if (!data) return 0;
  const flat = data[CUMULATIVE_RANKING_TOTAL_POSTS_FIELD];
  if (typeof flat === "number" && Number.isFinite(flat)) {
    return Math.max(0, Math.floor(flat));
  }
  const nested = (data.ranking as { totalPosts?: unknown } | undefined)
    ?.totalPosts;
  const n = typeof nested === "number" ? nested : Number(nested);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** reconcile / 集計結果から index フィールドを付与 */
export function rankingTotalPostsFromAggregate(
  rankingTotalPosts: number
): Record<string, number> {
  return {
    [CUMULATIVE_RANKING_TOTAL_POSTS_FIELD]: Math.max(
      0,
      Math.floor(rankingTotalPosts)
    ),
  };
}

export function cumulativeStatsDocsToMap(
  snap: QuerySnapshot
): Map<string, Record<string, unknown>> {
  const statsByUid = new Map<string, Record<string, unknown>>();
  for (const doc of snap.docs) {
    statsByUid.set(doc.id, doc.data() as Record<string, unknown>);
  }
  return statsByUid;
}

/** 既存 doc の ranking.totalPosts から index を 1 回だけ埋める */
async function backfillRankingTotalPostsIndex(db: Firestore): Promise<number> {
  const coll = db.collection("cumulative_stats");
  const snap = await coll.get();
  let batch = db.batch();
  let ops = 0;
  let written = 0;

  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (data[CUMULATIVE_RANKING_TOTAL_POSTS_FIELD] != null) continue;
    const posts = readRankingTotalPosts(data);
    if (posts <= 0) continue;
    batch.set(
      doc.ref,
      { [CUMULATIVE_RANKING_TOTAL_POSTS_FIELD]: posts },
      { merge: true }
    );
    ops++;
    written++;
    if (ops >= 500) await flush();
  }
  await flush();
  return written;
}

/**
 * ランキング参加者のみ読む（0 投稿 doc をスキップ）。
 * index が空なら 1 回だけ backfill → 再クエリ。それでも空なら full scan。
 */
export async function loadCumulativeStatsForRankingSnapshot(
  db: Firestore
): Promise<QuerySnapshot> {
  const coll = db.collection("cumulative_stats") as CollectionReference<DocumentData>;

  let indexed = await coll
    .where(CUMULATIVE_RANKING_TOTAL_POSTS_FIELD, ">", 0)
    .get();

  if (indexed.size === 0) {
    const filled = await backfillRankingTotalPostsIndex(db);
    console.log(
      `[buildCumulativeRankingSnapshot] backfilled rankingTotalPosts on ${filled} docs`
    );
    indexed = await coll
      .where(CUMULATIVE_RANKING_TOTAL_POSTS_FIELD, ">", 0)
      .get();
  }

  if (indexed.size > 0) {
    return indexed;
  }

  console.warn(
    "[buildCumulativeRankingSnapshot] rankingTotalPosts still empty; falling back to full cumulative_stats read"
  );
  return coll.get();
}
