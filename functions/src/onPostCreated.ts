// functions/src/onPostCreatedV2.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * V2: posts/{postId} 新規作成時（軽量版）
 *
 * やること：
 * ① user_stats_v2_daily/{uid_YYYY-MM-DD}.all.posts を +1
 *
 * ※勝敗・精度などの stats は onGameFinalV2 でのみ処理する。
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

    // JST 日付キー
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);

    // ※ 再集計は不要（軽量化方針）
  }
);
