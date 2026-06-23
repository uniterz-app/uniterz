import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PAGE_SIZE = 500;

/** JST の dateKey（YYYY-MM-DD）00:00〜翌日 00:00 を UTC の Date 範囲に変換 */
export function jstDateKeyToUtcRange(dateKey: string): { start: Date; end: Date } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** 指定 JST 日に v2 予想投稿したユーザーの UID 一覧（重複なし） */
export async function loadUidsWhoPredictedOnDateJst(
  dateKey: string
): Promise<string[]> {
  const firestore = getFirestore();
  const { start, end } = jstDateKeyToUtcRange(dateKey);
  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);

  const uids = new Set<string>();
  let cursor:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | undefined;

  for (;;) {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore
      .collection("posts")
      .where("createdAt", ">=", startTs)
      .where("createdAt", "<", endTs)
      .orderBy("createdAt", "asc")
      .limit(PAGE_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data?.schemaVersion !== 2) continue;
      const uid = data?.authorUid;
      if (typeof uid === "string" && uid.trim()) uids.add(uid.trim());
    }

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }

  return [...uids];
}
