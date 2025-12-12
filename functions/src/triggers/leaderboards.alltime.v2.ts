// functions/src/triggers/leaderboards.alltime.v2.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const LEAGUES = ["bj", "j1", "nba"] as const;

/* =========================================================
 * ローカル定義（updateUserStatsV2 からコピー）
 * =======================================================*/

type StatsV2Bucket = {
  posts: number;
  wins: number;

  scoreErrorSum: number;
  brierSum: number;
  upsetScoreSum: number;
  scorePrecisionSum: number;

  winRate: number;
  avgScoreError: number;
  avgBrier: number;
  avgUpset: number;
  avgPrecision: number;
};

function emptyBucket(): StatsV2Bucket {
  return {
    posts: 0,
    wins: 0,
    scoreErrorSum: 0,
    brierSum: 0,
    upsetScoreSum: 0,
    scorePrecisionSum: 0,

    winRate: 0,
    avgScoreError: 0,
    avgBrier: 0,
    avgUpset: 0,
    avgPrecision: 0,
  };
}

function recomputeCache(b: StatsV2Bucket): StatsV2Bucket {
  const posts = b.posts;
  const wins = b.wins;

  return {
    ...b,
    winRate: posts ? wins / posts : 0,
    avgScoreError: posts ? b.scoreErrorSum / posts : 0,
    avgBrier: posts ? b.brierSum / posts : 0,
    avgUpset: wins ? b.upsetScoreSum / wins : 0,
    avgPrecision: posts ? b.scorePrecisionSum / posts : 0,
  };
}

/* =========================================================
 * user_stats_v2_daily → 全期間合算
 * =======================================================*/

async function sumAllFromDaily(uid: string, league: string | null) {
  const db = getFirestore();

  const snap = await db
    .collection("user_stats_v2_daily")
    .where("__name__", ">=", `${uid}_`)
    .where("__name__", "<", `${uid}_\uf8ff`)
    .get();

  let b = emptyBucket();

  snap.forEach((d) => {
    const v = d.data();
    const src = league ? v.leagues?.[league] : v.all;
    if (!src) return;

    b.posts += src.posts || 0;
    b.wins += src.wins || 0;
    b.scoreErrorSum += src.scoreErrorSum || 0;
    b.brierSum += src.brierSum || 0;
    b.upsetScoreSum += src.upsetScoreSum || 0;
    b.scorePrecisionSum += src.scorePrecisionSum || 0;
  });

  return recomputeCache(b);
}

/* =========================================================
 * オールタイム ランキング再構築
 * =======================================================*/

export async function rebuildLeaderboardAllTimeV2() {
  const db = getFirestore();
  const usersSnap = await db.collection("users").get();

  for (const league of LEAGUES) {
    const ref = db.collection("leaderboards_v2").doc(`alltime_${league}`);

    // メタ情報
    await ref.set(
      {
        league,
        type: "alltime",
        rebuiltAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 古いデータ削除
    const oldSnap = await ref.collection("users").get();
    if (!oldSnap.empty) {
      const batch = db.batch();
      oldSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // ランキング再生成
    for (const user of usersSnap.docs) {
      const uid = user.id;

      const bucket = await sumAllFromDaily(uid, league);

      // 最低投稿数
      if (!bucket || bucket.posts < 10) continue;

      // 精度
      const accuracy = (1 - bucket.avgBrier) * 100;

      await ref.collection("users").doc(uid).set(
        {
          uid,
          league,
          posts: bucket.posts,
          winRate: bucket.winRate,
          accuracy,
          avgPrecision: bucket.avgPrecision,
          avgUpset: bucket.avgUpset,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
}

/* =========================================================
 * 月に1回のスケジュール（毎月1日の深夜4時）
 * =======================================================*/

export const rebuildLeaderboardAllTimeCron = onSchedule(
  { schedule: "0 4 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    await rebuildLeaderboardAllTimeV2();
  }
);

