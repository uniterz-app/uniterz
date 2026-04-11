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

    const statsAll = data.all;
    if (!statsAll) continue;

    /** 日次に ranking が無い = デプロイ前データ → ランキング側も all と同じ増分 */
    const statsRanking = data.ranking ?? data.all;

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
       * 累積値（プロフィール = 全試合）
       * =======================*/
      const prevPosts = cumulativeSnap.get("totalPosts") ?? 0;
      const prevWins = cumulativeSnap.get("totalWins") ?? 0;
      const prevPoints = cumulativeSnap.get("totalPoints") ?? 0;
      const prevUpset = cumulativeSnap.get("totalUpset") ?? 0;
      const prevPrecision = cumulativeSnap.get("totalPrecision") ?? 0;

      const addPosts = statsAll.posts ?? 0;
      const addWins = statsAll.wins ?? 0;
      const addPoints = statsAll.pointsSumV3 ?? 0;
      const addUpset = statsAll.upsetPointsSum ?? 0;
      const addPrecision = statsAll.scorePrecisionSum ?? 0;

      const nextPosts = prevPosts + addPosts;
      const nextWins = prevWins + addWins;
      const nextPoints = prevPoints + addPoints;
      const nextUpset = prevUpset + addUpset;
      const nextPrecision = prevPrecision + addPrecision;

      const winRate = nextPosts > 0 ? nextWins / nextPosts : 0;

      /* =========================
       * ランキング用累積（プレーイン除外など）
       * ranking 未保存時はプロフィール累積でブートストラップ（二重計上防止）
       * =======================*/
      const prevR = cumulativeSnap.get("ranking") as
        | {
            totalPosts?: number;
            totalWins?: number;
            totalPoints?: number;
            totalUpset?: number;
            totalPrecision?: number;
          }
        | undefined;

      const bootPosts =
        prevR?.totalPosts != null ? prevR.totalPosts : prevPosts;
      const bootWins = prevR?.totalWins != null ? prevR.totalWins : prevWins;
      const bootPoints =
        prevR?.totalPoints != null ? prevR.totalPoints : prevPoints;
      const bootUpset = prevR?.totalUpset != null ? prevR.totalUpset : prevUpset;
      const bootPrecision =
        prevR?.totalPrecision != null ? prevR.totalPrecision : prevPrecision;

      const addRPosts = statsRanking.posts ?? 0;
      const addRWins = statsRanking.wins ?? 0;
      const addRPoints = statsRanking.pointsSumV3 ?? 0;
      const addRUpset = statsRanking.upsetPointsSum ?? 0;
      const addRPrecision = statsRanking.scorePrecisionSum ?? 0;

      const nextRPosts = bootPosts + addRPosts;
      const nextRWins = bootWins + addRWins;
      const nextRPoints = bootPoints + addRPoints;
      const nextRUpset = bootUpset + addRUpset;
      const nextRPrecision = bootPrecision + addRPrecision;
      const winRateRanking = nextRPosts > 0 ? nextRWins / nextRPosts : 0;

      tx.set(
        cumulativeRef,
        {
          uid,

          displayName: user.displayName ?? "user",
          handle: user.handle ?? null,
          photoURL: user.photoURL ?? null,
          countryCode: user.countryCode ?? null,
          plan: user.plan === "pro" ? "pro" : "free",

          totalPosts: nextPosts,
          totalWins: nextWins,

          totalPoints: nextPoints,
          totalUpset: nextUpset,
          totalPrecision: nextPrecision,
          winRate,

          ranking: {
            totalPosts: nextRPosts,
            totalWins: nextRWins,
            totalPoints: nextRPoints,
            totalUpset: nextRUpset,
            totalPrecision: nextRPrecision,
            winRate: winRateRanking,
          },

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