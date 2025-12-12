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
  upsetScoreSum: number;       // upset は勝った試合だけ加算
  scorePrecisionSum: number;

  // ★ 一致度用
  calibrationErrorSum: number;
  calibrationCount: number;

  winRate: number;
  avgScoreError: number;
  avgBrier: number;
  avgUpset: number;            // wins で割る
  avgPrecision: number;
  avgCalibration: number;
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
  upsetScore: number;
  scorePrecision: number;
  confidence: number; 
  calibrationError: number;
};

const db = () => getFirestore();
const LEAGUES = ["bj", "j1", "nba"];

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
    upsetScoreSum: 0,
    scorePrecisionSum: 0,

    calibrationErrorSum: 0,
    calibrationCount: 0,

    winRate: 0,
    avgScoreError: 0,
    avgBrier: 0,
    avgUpset: 0,
    avgPrecision: 0,
    avgCalibration: 0,
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
    avgUpset: wins ? b.upsetScoreSum / wins : 0, // upsetScore は勝ちだけで割る
    avgPrecision: posts ? b.scorePrecisionSum / posts : 0,
    avgCalibration:
  b.calibrationCount > 0
    ? b.calibrationErrorSum / b.calibrationCount
    : null,
  };
}

/* =========================================================
 * 投稿1件 → user_stats_v2_daily に即反映
 * =======================================================*/

export async function applyPostToUserStatsV2(opts: ApplyOptsV2) {
  const {
    uid, postId, startAt,
    league, isWin, scoreError, brier,
    upsetScore, scorePrecision,
  } = opts;

  const dateKey = toDateKeyJST(startAt);
  const leagueKey = normalizeLeague(league);

  const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
  const markerRef = dailyRef.collection("applied_posts").doc(postId);

  await db().runTransaction(async (tx) => {
    const marker = await tx.get(markerRef);
    if (marker.exists) return;

    // ---------- streak 更新 ----------
    const statsRef = db().doc(`user_stats_v2/${uid}`);
    const statsSnap = await tx.get(statsRef);

    let currentStreak = statsSnap.get("currentStreak") ?? 0;
    let maxStreak = statsSnap.get("maxStreak") ?? 0;

    if (isWin) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    // ---------- increment data ----------
    const inc: any = {
      posts: FieldValue.increment(1),
      wins: FieldValue.increment(isWin ? 1 : 0),
      scoreErrorSum: FieldValue.increment(scoreError),
      brierSum: FieldValue.increment(brier),
      upsetScoreSum: FieldValue.increment(isWin ? upsetScore : 0),
      scorePrecisionSum: FieldValue.increment(scorePrecision),
      calibrationErrorSum: FieldValue.increment(opts.calibrationError),
calibrationCount: FieldValue.increment(1),
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
    }

    tx.set(dailyRef, update, { merge: true });
    tx.set(markerRef, { at: FieldValue.serverTimestamp() });

    tx.set(
      statsRef,
      { currentStreak, maxStreak, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
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
    b.upsetScoreSum += src.upsetScoreSum || 0;
    b.scorePrecisionSum += src.scorePrecisionSum || 0;
    b.calibrationErrorSum += src.calibrationErrorSum || 0;
b.calibrationCount += src.calibrationCount || 0;
  }

  return recomputeCache(b);
}

