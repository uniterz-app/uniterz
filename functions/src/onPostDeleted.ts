import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsFromDaily } from "./updateUserStats";

export const onPostDeleted = onDocumentDeleted(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const beforeSnap = event.data; // QueryDocumentSnapshot
    if (!beforeSnap) return;

    const before = beforeSnap.data() as any; // ← createdAt / authorUid はここに存在
    if (!before) return;

    const uid = before.authorUid;
    const createdAt = before.createdAt as Timestamp;

    if (!uid || !createdAt) return;

    // ===== JST YYYY-MM-DD =====
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const db = getFirestore();

    // ===== daily 更新 =====
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);

    await dailyRef.set(
      {
        date: dateKey,
        createdPosts: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ===== stats 更新（postsTotal だけ -1） =====
    const statsRef = db.doc(`user_stats/${uid}`);
    const ranges = ["7d", "30d", "all"];

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(statsRef);
      const data = snap.data() || {};
      const after = { ...data };

      for (const r of ranges) {
        const bucket = { ...(data[r] || {}) };
        bucket.postsTotal = Math.max((bucket.postsTotal || 0) - 1, 0);
        after[r] = bucket;
      }

      tx.set(statsRef, after, { merge: true });
    });

    await recomputeUserStatsFromDaily(uid);
  }
);
