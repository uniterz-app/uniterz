// functions/src/onPostCreated.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsFromDaily } from "./updateUserStats";

const db = getFirestore();

/**
 * posts/{postId} 新規作成時：
 * - user_stats_daily/{uid_YYYY-MM-DD}.createdPosts を +1
 * - 7d/30d/all を再集計
 */
export const onPostCreated = onDocumentCreated(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const uid = data.authorUid;
    const createdAt = data.createdAt as Timestamp;
    if (!uid || !createdAt) return;

    // JST YYYY-MM-DD キーを生成
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);

    // createdPosts の増加だけ（hit/miss計算は onGameFinal が行う）
    await dailyRef.set(
      {
        date: dateKey,
        createdPosts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 7d / 30d / all を最新化
    await recomputeUserStatsFromDaily(uid);
  }
);
