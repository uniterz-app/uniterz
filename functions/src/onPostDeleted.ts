import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsFromDaily } from "./updateUserStats";

export const onPostDeleted = onDocumentDeleted(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    // ★ 型を any にキャストして before を正しく読む
    const before = (event.data as any)?.before?.data();
    if (!before) return;

    const uid = before.authorUid;
    const createdAt = before.createdAt as Timestamp;

    if (!uid || !createdAt) return;

    // JST YYYY-MM-DD を生成
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const db = getFirestore();
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);

    // createdPosts -1
    await dailyRef.set(
      {
        date: dateKey,
        createdPosts: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await recomputeUserStatsFromDaily(uid);
  }
);
