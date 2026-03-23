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
    const stats = before.stats;
    const startAt: Timestamp =
      before.startAtJst ?? before.startAt ?? before.createdAt;

    if (!uid || !startAt) return;

    const db = getFirestore();

    const d = startAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(snap.id);

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
          tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
        }

        tx.delete(markerRef);
      });

      return;
    }

    const isWin = stats.isWin === true;
    const scoreError = stats.scoreError ?? 0;
    const scorePrecision = stats.scorePrecision ?? 0;
    const hadUpsetGame = stats.hadUpsetGame === true;
    const upsetHit = stats.upsetHit === true;
    const upsetPoints = stats.upsetPoints ?? 0;
    const pointsV3 = stats.pointsV3 ?? 0;

    await db.runTransaction(async (tx) => {
      const dailySnap = await tx.get(dailyRef);
      if (!dailySnap.exists) return;

      const dec = {
        posts: FieldValue.increment(-1),
        wins: FieldValue.increment(isWin ? -1 : 0),
        scoreErrorSum: FieldValue.increment(-scoreError),
        upsetOpportunityCount: FieldValue.increment(hadUpsetGame ? -1 : 0),
        upsetHitCount: FieldValue.increment(upsetHit ? -1 : 0),
        upsetPickCount: FieldValue.increment(hadUpsetGame ? -1 : 0),
        upsetPointsSum: FieldValue.increment(-upsetPoints),
        scorePrecisionSum: FieldValue.increment(-scorePrecision),
        pointsSumV3: FieldValue.increment(-pointsV3),
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(dailyRef, { all: dec }, { merge: true });

      const leagueKey = before.league ?? null;
      if (leagueKey) {
        tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
      }

      tx.delete(markerRef);
    });
  }
);