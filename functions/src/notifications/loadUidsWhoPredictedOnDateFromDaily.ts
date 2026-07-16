import { FieldPath, getFirestore } from "firebase-admin/firestore";

const PAGE_SIZE = 500;

function safePosts(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/**
 * JST 日付に v2 予想が 1 件以上ある uid（user_stats_v2_daily から）。
 * posts 全件スキャンより reads が少ない。
 */
export async function loadUidsWhoPredictedOnDateFromDaily(
  dateKey: string
): Promise<string[]> {
  const firestore = getFirestore();
  const uids = new Set<string>();
  let cursor:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | undefined;

  for (;;) {
    let q = firestore
      .collection("user_stats_v2_daily")
      .where("date", "==", dateKey)
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = doc.data();
      const posts = safePosts(
        (data.all as { posts?: unknown } | undefined)?.posts ??
          (data.ranking as { posts?: unknown } | undefined)?.posts
      );
      if (posts <= 0) continue;
      const uid = doc.id.split("_")[0]?.trim();
      if (uid) uids.add(uid);
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }

  return [...uids];
}
