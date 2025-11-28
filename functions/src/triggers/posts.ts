// functions/src/triggers/posts.ts
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsFromDaily } from "../updateUserStats";

// initializeApp は index.ts でやっている想定。未初期化でも getFirestore は安全。
const db = getFirestore();

/** JST（日付切り）用のキー生成: YYYY-MM-DD */
function toDateKeyJSTFromTs(ts: Timestamp) {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * posts/{postId} 作成 → users/{authorUid}.counts.posts を +1
 *                      → user_stats_daily の createdPosts を +1
 *                      → user_stats（7d/30d/all）も再集計
 */
export const onPostCreatedInc = onDocumentCreated("posts/{postId}", async (event) => {
  try {
    const data = event.data?.data() as { authorUid?: string; createdAt?: Timestamp } | undefined;
    const authorUid = data?.authorUid;
    if (!authorUid) return;

    // 1) ユーザー通算投稿数を +1
    await db.doc(`users/${authorUid}`).set(
      { counts: { posts: FieldValue.increment(1) } },
      { merge: true }
    );

    // 2) daily の createdPosts を +1
    const createdAt = data?.createdAt || Timestamp.now();
    const dateKey = toDateKeyJSTFromTs(createdAt);
    const dailyDoc = db.doc(`user_stats_daily/${authorUid}_${dateKey}`);

    await db.doc(dailyDoc.path).set(
      {
        date: dateKey,
        createdPosts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 3) 7d/30d/all を最新状態に再集計
    await recomputeUserStatsFromDaily(authorUid);
  } catch (e) {
    console.error("[onPostCreatedInc] failed:", e);
  }
});

/**
 * posts/{postId} 削除 → users/{authorUid}.counts.posts を -1
 * ※ いまは createdPosts のマイナスはしていない（必要になれば後で対応）
 */
export const onPostDeletedDec = onDocumentDeleted("posts/{postId}", async (event) => {
  try {
    const data = event.data?.data() as { authorUid?: string } | undefined;
    const authorUid = data?.authorUid;
    if (!authorUid) return;

    await db.doc(`users/${authorUid}`).set(
      { counts: { posts: FieldValue.increment(-1) } },
      { merge: true }
    );
  } catch (e) {
    console.error("[onPostDeletedDec] failed:", e);
  }
});
