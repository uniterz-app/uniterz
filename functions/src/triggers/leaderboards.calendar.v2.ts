import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStatsV2 } from "../updateUserStatsV2";

// 🚫 削除：トップレベルで Firestore を触らない
// const db = getFirestore();

const LEAGUES = ["bj", "nba", "pl"] as const;
type LeagueKey = typeof LEAGUES[number];

async function rebuildLeaderboardV2() {
  // ✔ 必ず関数内で初期化
  const db = getFirestore();

  const users = await db.collection("users").get();

  for (const league of LEAGUES) {
    const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);

    // メタ更新
    await ref.set(
      { league, rebuiltAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    // 古いランキング削除
    const olds = await ref.collection("users").get();
    const batch = db.batch();
    olds.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // 書き直し
    for (const u of users.docs) {
      const uid = u.id;
      const stats = await getStatsV2(uid);

      const bucket = stats?.all?.leagues?.[league];
      if (!bucket || bucket.posts < 10) continue;

      await ref.collection("users").doc(uid).set({
        uid,
        league,
        posts: bucket.posts,
        winRate: bucket.winRate,
        avgBrier: bucket.avgBrier,
        avgScoreError: bucket.avgScoreError,
        upsetRate: bucket.upsetRate,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

export const rebuildLeaderboardV2Cron = onSchedule(
  { schedule: "0 5 * * *", timeZone: "Asia/Tokyo" },
  rebuildLeaderboardV2
);
