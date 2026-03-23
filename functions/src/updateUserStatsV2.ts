// functions/src/updateUserStatsV2.ts
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

/* =========================================================
 * 型
 * =======================================================*/

export type StatsV2Bucket = {
  posts: number;
  wins: number;

  scoreErrorSum: number;
  upsetHitCount: number; // 少数派Upset的中数
  upsetOpportunityCount: number; // upsetGameの母数（hadUpsetGame）
  scorePrecisionSum: number;

  // 総合得点
  pointsSumV3: number;

  // Upset独立ポイント合計
  upsetPointsSum: number;

  // 総合得点内訳ボーナス合計
  upsetBonusSum: number;
  streakBonusSum: number;

  winRate: number;
  avgScoreError: number;
  upsetHitRate: number;
  avgPrecision: number;

  // 平均総合得点
  avgPointsV3: number;

  consistency?: number;
  upsetPickCount: number;
};

type ApplyOptsV2 = {
  uid: string;
  postId: string;
  createdAt: Timestamp;
  startAt: Timestamp;
  league?: string | null;

  isWin: boolean;
  scoreError: number;
  scorePrecision: number;
  hadUpsetGame: boolean;

  // finalizePost から渡す
  points: number;

  // Upset（独立）
  upsetHit: boolean;
  upsetPoints: number; // 0〜10

  // 総合得点内訳ボーナス
  upsetBonus: number;
  streakBonus: number;
};

const db = () => getFirestore();
const LEAGUES = ["bj", "j1", "nba", "pl"] as const;

/* =========================================================
 * Utils
 * =======================================================*/

function toDateKeyJST(ts: Timestamp) {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeLeague(raw?: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();

  if (v === "bj" || v === "b1" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "nba") return "nba";
  if (v === "pl" || v.includes("premier")) return "pl";

  return null;
}

/* =========================================================
 * Bucket helpers
 * =======================================================*/

function emptyBucket(): StatsV2Bucket {
  return {
    posts: 0,
    wins: 0,
    scoreErrorSum: 0,
    upsetHitCount: 0,
    upsetOpportunityCount: 0,
    scorePrecisionSum: 0,

    pointsSumV3: 0,
    upsetPointsSum: 0,

    upsetBonusSum: 0,
    streakBonusSum: 0,

    winRate: 0,
    avgScoreError: 0,
    upsetHitRate: 0,
    avgPrecision: 0,
    avgPointsV3: 0,

    upsetPickCount: 0,
  };
}

function recomputeCache(b: StatsV2Bucket): StatsV2Bucket {
  const posts = b.posts;
  const wins = b.wins;

  return {
    ...b,
    winRate: posts ? wins / posts : 0,
    avgScoreError: posts ? b.scoreErrorSum / posts : 0,
    avgPrecision: posts ? b.scorePrecisionSum / posts : 0,
    upsetHitRate:
      b.upsetOpportunityCount > 0
        ? b.upsetHitCount / b.upsetOpportunityCount
        : 0,
    avgPointsV3: posts ? b.pointsSumV3 / posts : 0,
  };
}

/* =========================================================
 * 投稿1件 → user_stats_v2_daily に即反映
 * =======================================================*/

export async function applyPostToUserStatsV2(opts: ApplyOptsV2) {
  const {
    uid,
    postId,
    startAt,
    league,
    isWin,
    scoreError,
    scorePrecision,
    hadUpsetGame,
    points,
    upsetHit,
    upsetPoints,
    upsetBonus,
    streakBonus,
  } = opts;

  const dateKey = toDateKeyJST(startAt);
  const leagueKey = normalizeLeague(league);

  const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
  const markerRef = dailyRef.collection("applied_posts").doc(postId);

  const userStatsRef = db().doc(`user_stats_v2/${uid}`);

  await db().runTransaction(async (tx) => {
    const marker = await tx.get(markerRef);
    if (marker.exists) return;

    const inc: any = {
      posts: FieldValue.increment(1),
      wins: FieldValue.increment(isWin ? 1 : 0),
      scoreErrorSum: FieldValue.increment(scoreError),

      upsetOpportunityCount: FieldValue.increment(hadUpsetGame ? 1 : 0),
      upsetHitCount: FieldValue.increment(upsetHit ? 1 : 0),
      upsetPickCount: FieldValue.increment(hadUpsetGame ? 1 : 0),

      scorePrecisionSum: FieldValue.increment(scorePrecision),

      pointsSumV3: FieldValue.increment(points),
      upsetPointsSum: FieldValue.increment(upsetPoints),

      upsetBonusSum: FieldValue.increment(upsetBonus),
      streakBonusSum: FieldValue.increment(streakBonus),
    };

    const update: any = {
      date: dateKey,
      updatedAt: FieldValue.serverTimestamp(),
      all: inc,
    };

    if (leagueKey) {
      update.leagues = {
        ...(update.leagues || {}),
        [leagueKey]: inc,
      };

      tx.set(
        userStatsRef,
        {
          leaguePosts: {
            [leagueKey]: FieldValue.increment(1),
          },
          lastActiveLeague: leagueKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    tx.set(dailyRef, update, { merge: true });
    tx.set(markerRef, { at: FieldValue.serverTimestamp() });
  });
}

/* =========================================================
 * 週間・月間ランキング用の唯一の集計処理
 * =======================================================*/

export async function getStatsForDateRangeV2(
  uid: string,
  start: Date,
  end: Date,
  league: string | null
) {
  const coll = db().collection("user_stats_v2_daily");
  const ONE = 86400000;

  let b = emptyBucket();

  for (let t = start.getTime(); t <= end.getTime(); t += ONE) {
    const d = new Date(t);
    const key = `${uid}_${toDateKeyJST(Timestamp.fromDate(d))}`;

    const snap = await coll.doc(key).get();
    if (!snap.exists) continue;

    const v = snap.data()!;
    const src = league ? v.leagues?.[league] : v.all;
    if (!src) continue;

    b.posts += src.posts || 0;
    b.wins += src.wins || 0;
    b.scoreErrorSum += src.scoreErrorSum || 0;
    b.upsetHitCount += src.upsetHitCount || 0;
    b.upsetOpportunityCount += src.upsetOpportunityCount || 0;
    b.scorePrecisionSum += src.scorePrecisionSum || 0;
    b.upsetPickCount += src.upsetPickCount || 0;

    b.pointsSumV3 += src.pointsSumV3 || 0;
    b.upsetPointsSum += src.upsetPointsSum || 0;

    b.upsetBonusSum += src.upsetBonusSum || 0;
    b.streakBonusSum += src.streakBonusSum || 0;
  }

  return recomputeCache(b);
}