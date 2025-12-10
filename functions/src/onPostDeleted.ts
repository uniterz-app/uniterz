// functions/src/onPostDeletedV2.ts
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { recomputeUserStatsV2FromDaily } from "./updateUserStatsV2";

export const onPostDeletedV2 = onDocumentDeleted(
  {
    document: "posts/{postId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const before = snap.data() as any;
    if (!before) return;

    const uid = before.authorUid;
    const createdAt: Timestamp = before.createdAt;
    const stats = before.stats; // 確定投稿のみ存在

    if (!uid || !createdAt) return;

    const db = getFirestore();

    // ===== JSTの日付キー =====
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const postMarkerRef = dailyRef.collection("applied_posts").doc(snap.id);

    // ===== ① stats がない（未確定投稿） → 投稿数だけ -1 =====
    if (!stats) {
      await db.runTransaction(async (tx) => {
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists) return;

        const dec = {
          posts: FieldValue.increment(-1),
          createdPosts: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        };

        // all
        tx.set(dailyRef, { all: dec }, { merge: true });

        // league（before.game.league があれば）
        const leagueKey = before.game?.league ?? null;
        if (leagueKey) {
          tx.set(
            dailyRef,
            { leagues: { [leagueKey]: dec } },
            { merge: true }
          );
        }
      });

      // 集計再計算
      await recomputeUserStatsV2FromDaily(uid);
      return; // ★ ここで終了
    }

    // ===== ② stats がある（確定投稿） → 今まで通り精度の逆操作 =====
    const isWin = stats.isWin === true;
    const scoreError = stats.scoreError ?? 0;
    const brier = stats.brier ?? 0;
    const upset = isWin ? (stats.upsetScore ?? 0) : 0;
    const precision = stats.scorePrecision ?? 0;

    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const inc = {
        posts: FieldValue.increment(-1),
        createdPosts: FieldValue.increment(-1),
        wins: FieldValue.increment(isWin ? -1 : 0),
        scoreErrorSum: FieldValue.increment(-scoreError),
        brierSum: FieldValue.increment(-brier),
        upsetScoreSum: FieldValue.increment(-upset),
        scorePrecisionSum: FieldValue.increment(-precision),
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(dailyRef, { all: inc }, { merge: true });

      const leagueKey = before.game?.league ?? null;
      if (leagueKey) {
        tx.set(
          dailyRef,
          { leagues: { [leagueKey]: inc } },
          { merge: true }
        );
      }

      tx.delete(postMarkerRef);
    });

    await recomputeUserStatsV2FromDaily(uid);
  }
);
