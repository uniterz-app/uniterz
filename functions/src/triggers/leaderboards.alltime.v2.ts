// functions/src/triggers/leaderboards.alltime.v2.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStatsV2 } from "../updateUserStatsV2";

const LEAGUES = ["bj", "nba", "pl"] as const;

export async function rebuildLeaderboardAllTimeV2() {
  const db = getFirestore();

  const usersSnap = await db.collection("users").get();

  for (const league of LEAGUES) {
    const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);

    // メタ情報更新
    await ref.set(
      {
        league,
        type: "alltime",
        rebuiltAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 古いランキング削除
    const oldSnap = await ref.collection("users").get();
    if (!oldSnap.empty) {
      const batch = db.batch();
      oldSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // ランキング再構築
    for (const user of usersSnap.docs) {
      const uid = user.id;
      const stats = await getStatsV2(uid);
      const bucket = stats?.all?.leagues?.[league];

      // 掲載基準
      if (!bucket || bucket.posts < 10) continue;

      // Brier → 正確性に変換
      const accuracy = (1 - bucket.avgBrier) * 100;

      await ref.collection("users").doc(uid).set(
        {
          uid,
          league,
          posts: bucket.posts,
          winRate: bucket.winRate,
          accuracy, // ← (1 - avgBrier)*100
          avgPrecision: bucket.avgPrecision,
          avgUpset: bucket.avgUpset,

          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
}

export const rebuildLeaderboardAllTimeCron = onSchedule(
  { schedule: "0 5 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await rebuildLeaderboardAllTimeV2();
  }
);

