// functions/src/rankings/buildCumulativeStats.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";

function db() {
  return getFirestore();
}

/* =========================================================
 * JST utils
 * =======================================================*/
function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayJST() {
  return toDateKeyJST(new Date());
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildCumulativeStats() {
  const dateKey = getTodayJST();

  const dailySnap = await db()
    .collection("user_stats_v2_daily")
    .where("date", "==", dateKey)
    .get();

  let updated = 0;
  let skipped = 0;

  for (const doc of dailySnap.docs) {
    const data = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) continue;

    const stats = data.all;
    if (!stats) continue;

    const cumulativeRef = db().doc(`cumulative_stats/${uid}`);
    const userRef = db().doc(`users/${uid}`);

    const result = await db().runTransaction(async (tx) => {
      const [cumulativeSnap, userSnap] = await Promise.all([
        tx.get(cumulativeRef),
        tx.get(userRef),
      ]);

      const lastAggregatedDate =
        cumulativeSnap.get("lastAggregatedDate") ?? null;

      if (lastAggregatedDate === dateKey) {
        return { updated: false };
      }

      const user = userSnap.exists ? userSnap.data()! : {};

      /* =========================
       * 累積値
       * =======================*/
      const prevPosts = cumulativeSnap.get("totalPosts") ?? 0;
      const prevWins = cumulativeSnap.get("totalWins") ?? 0;
      const prevPoints = cumulativeSnap.get("totalPoints") ?? 0;
      const prevUpset = cumulativeSnap.get("totalUpset") ?? 0;
      const prevPrecision = cumulativeSnap.get("totalPrecision") ?? 0;

      const addPosts = stats.posts ?? 0;
      const addWins = stats.wins ?? 0;
      const addPoints = stats.pointsSumV3 ?? 0;
      const addUpset = stats.upsetPointsSum ?? 0;
      const addPrecision = stats.scorePrecisionSum ?? 0;

      const nextPosts = prevPosts + addPosts;
      const nextWins = prevWins + addWins;
      const nextPoints = prevPoints + addPoints;
      const nextUpset = prevUpset + addUpset;
      const nextPrecision = prevPrecision + addPrecision;

      const winRate = nextPosts > 0 ? nextWins / nextPosts : 0;

      tx.set(
        cumulativeRef,
        {
          uid,

          displayName: user.displayName ?? "user",
          handle: user.handle ?? null,
          photoURL: user.photoURL ?? null,

          totalPosts: nextPosts,
          totalWins: nextWins,

          totalPoints: nextPoints,
          totalUpset: nextUpset,
          totalPrecision: nextPrecision,
          winRate,

          lastAggregatedDate: dateKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { updated: true };
    });

    if (result.updated) updated++;
    else skipped++;
  }

  return {
    date: dateKey,
    scanned: dailySnap.size,
    updated,
    skipped,
  };
}