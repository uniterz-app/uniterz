// functions/src/onPostDeletedV2.ts
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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
    const stats = before.stats; // 確定投稿なら存在
    const startAt: Timestamp = before.startAtJst ?? before.startAt ?? before.createdAt;

    if (!uid || !startAt) return;

    const db = getFirestore();

    // JST dateKey
    const d = startAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(snap.id);

    // stats が無い → 未確定投稿 → posts だけ減らす
    if (!stats) {
      await db.runTransaction(async (tx) => {
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists) return;

        const dec = {
          posts: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.set(dailyRef, { all: dec }, { merge: true });

        const leagueKey = before.league ?? null;
        if (leagueKey) {
          tx.set(
            dailyRef,
            { leagues: { [leagueKey]: dec } },
            { merge: true }
          );
        }

        tx.delete(markerRef);
      });

      return;
    }

    // stats がある → 確定投稿 → apply の逆操作
    const isWin = stats.isWin === true;

    const scoreError = stats.scoreError ?? 0;
    const brier = stats.brier ?? 0;
    const upset = isWin ? (stats.upsetScore ?? 0) : 0;
    const precision = stats.scorePrecision ?? 0;

    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const dec = {
        posts: FieldValue.increment(-1),
        wins: FieldValue.increment(isWin ? -1 : 0),
        scoreErrorSum: FieldValue.increment(-scoreError),
        brierSum: FieldValue.increment(-brier),
        upsetScoreSum: FieldValue.increment(-upset),
        scorePrecisionSum: FieldValue.increment(-precision),
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(dailyRef, { all: dec }, { merge: true });

      const leagueKey = before.league ?? null;
      if (leagueKey) {
        tx.set(
          dailyRef,
          { leagues: { [leagueKey]: dec } },
          { merge: true }
        );
      }

      tx.delete(markerRef);
    });
  }
);
