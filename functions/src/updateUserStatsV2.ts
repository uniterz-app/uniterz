// functions/src/updateUserStatsV2.ts
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

/* =========================================================
 * 型
 * =======================================================*/

export type StatsV2Bucket = {
  posts: number;
  wins: number;

  scoreErrorSum: number;
  brierSum: number;
  upsetHitCount: number; // 少数派Upset的中数
  upsetOpportunityCount: number; // upsetGameの母数（hadUpsetGame）
  scorePrecisionSum: number;

  // ★ 追加：総合得点（pointsV3）
  pointsSumV3: number;

  // ★ 追加：Upset独立ポイント合計
  upsetPointsSum: number;

  winRate: number;
  avgScoreError: number;
  avgBrier: number;
  upsetHitRate: number;
  avgPrecision: number;

  // ★ 追加：平均総合得点
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
  brier: number;
  scorePrecision: number;
  confidence: number;
  hadUpsetGame: boolean;

  // ★ 追加：finalizePost から渡す
  points: number;

  // ★ 追加：Upset（独立）
  upsetHit: boolean;     // 少数派的中
  upsetPoints: number;   // 0〜10
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
    brierSum: 0,
    upsetHitCount: 0,
    upsetOpportunityCount: 0,
    scorePrecisionSum: 0,

    // ★ 追加
    pointsSumV3: 0,

    // ★ 追加
    upsetPointsSum: 0,

    winRate: 0,
    avgScoreError: 0,
    avgBrier: 0,
    upsetHitRate: 0,
    avgPrecision: 0,

    // ★ 追加
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
    avgBrier: posts ? b.brierSum / posts : 0,
    avgPrecision: posts ? b.scorePrecisionSum / posts : 0,
    upsetHitRate:
      b.upsetOpportunityCount > 0
        ? b.upsetHitCount / b.upsetOpportunityCount
        : 0,

    // ★ 追加：平均総合得点
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
    brier,
    scorePrecision,
    hadUpsetGame,
    points,
    upsetHit,
    upsetPoints,
  } = opts;

  const dateKey = toDateKeyJST(startAt);
  const leagueKey = normalizeLeague(league);

  const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
  const markerRef = dailyRef.collection("applied_posts").doc(postId);

  // ★ 追加：ユーザー集計用
  const userStatsRef = db().doc(`user_stats_v2/${uid}`);

  await db().runTransaction(async (tx) => {
    const marker = await tx.get(markerRef);
    if (marker.exists) return;

    // ---------- increment data ----------
    const inc: any = {
      posts: FieldValue.increment(1),
      wins: FieldValue.increment(isWin ? 1 : 0),
      scoreErrorSum: FieldValue.increment(scoreError),
      brierSum: FieldValue.increment(brier),

      // upset
      upsetOpportunityCount: FieldValue.increment(hadUpsetGame ? 1 : 0),

      // ★ 修正：少数派Upset的中でカウント
      upsetHitCount: FieldValue.increment(upsetHit ? 1 : 0),

      // ★ 追加（Upset を狙った回数）※現状仕様のまま
      upsetPickCount: FieldValue.increment(hadUpsetGame ? 1 : 0),

      scorePrecisionSum: FieldValue.increment(scorePrecision),

      // ★ 追加：総合得点
      pointsSumV3: FieldValue.increment(points),

      // ★ 追加：Upset独立ポイント
      upsetPointsSum: FieldValue.increment(upsetPoints),
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

      // ★ 追加：リーグ別投稿数を累積
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
    b.brierSum += src.brierSum || 0;
    b.upsetHitCount += src.upsetHitCount || 0;
    b.upsetOpportunityCount += src.upsetOpportunityCount || 0;
    b.scorePrecisionSum += src.scorePrecisionSum || 0;
    b.upsetPickCount += src.upsetPickCount || 0;

    // ★ 追加
    b.pointsSumV3 += src.pointsSumV3 || 0;

    // ★ 追加
    b.upsetPointsSum += src.upsetPointsSum || 0;
  }

  return recomputeCache(b);
}