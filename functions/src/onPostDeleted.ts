import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsFromDaily } from "./updateUserStats";

export const onPostDeleted = onDocumentDeleted(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    // ★ any キャストで TS の誤推論を回避
    const data = event.data as any;
    const beforeSnap = data?.before;
    if (!beforeSnap) return;

    const before = beforeSnap.data() as any;
    if (!before) return;

    const uid = before.authorUid;
    const createdAt = before.createdAt as Timestamp;
    if (!uid || !createdAt) return;

    // JST YYYY-MM-DD
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const db = getFirestore();
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);

    // 投稿数だけ -1（hit/miss は未確定投稿なので不要）
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
