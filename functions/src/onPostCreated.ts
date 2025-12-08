// functions/src/onPostCreatedV2.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

import { recomputeUserStatsV2FromDaily } from "./updateUserStatsV2";

const db = getFirestore();

/**
 * V2: posts/{postId} 新規作成時
 *
 * やること：
 * ① user_stats_v2_daily/{uid_YYYY-MM-DD}.createdPosts を +1
 * ② user_stats_v2/{uid} の 7d / 30d / all を再計算
 *
 * ※勝敗・精度などの stats は onGameFinalV2 が行う
 */
export const onPostCreatedV2 = onDocumentCreated(
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

    // -----------------------------
    // JST YYYY-MM-DD キー生成
    // -----------------------------
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);

    // -----------------------------
    // ① createdPosts を +1
    // -----------------------------
    await dailyRef.set(
      {
        date: dateKey,
        createdPosts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // -----------------------------
    // ② user_stats_v2 再計算
    // -----------------------------
    await recomputeUserStatsV2FromDaily(uid);
  }
);
