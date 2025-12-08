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
    const stats = before.stats;

    if (!uid || !createdAt || !stats) return;

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

    const isWin = stats.isWin === true;
    const scoreError = stats.scoreError ?? 0;
    const brier = stats.brier ?? 0;
    const upset = isWin ? (stats.upsetScore ?? 0) : 0;
    const precision = stats.scorePrecision ?? 0;

    // ===== daily の逆操作 =====
    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const inc: any = {
        posts: FieldValue.increment(-1),
        wins: FieldValue.increment(isWin ? -1 : 0),
        scoreErrorSum: FieldValue.increment(-scoreError),
        brierSum: FieldValue.increment(-brier),
        upsetScoreSum: FieldValue.increment(-upset),
        scorePrecisionSum: FieldValue.increment(-precision),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // all に適用
      tx.set(dailyRef, { all: inc }, { merge: true });

      // leagues に適用
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

    // ===== user_stats_v2 の再計算 =====
    await recomputeUserStatsV2FromDaily(uid);
  }
);
