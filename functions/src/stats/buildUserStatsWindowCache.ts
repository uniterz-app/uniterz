// functions/src/stats/buildUserStatsWindowCache.ts
// user_stats_v2_window_cache/{uid} を構築（7d/30d ロールアップ）

import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
  upsetPointsSum: number;
  scorePrecisionSum: number;
  pointsSumV3: number;
  upsetBonusSum: number;
  streakBonusSum: number;
};

type SummaryForCards = {
  posts: number;
  fullPosts: number;
  wins: number;
  winRate: number;
  scorePrecisionSum: number;
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
};

const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  upsetHitCount: 0,
  upsetOpportunityCount: 0,
  upsetPointsSum: 0,
  scorePrecisionSum: 0,
  pointsSumV3: 0,
  upsetBonusSum: 0,
  streakBonusSum: 0,
});

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function dateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mergeBucket(base: Bucket, v?: Partial<Bucket> | null): Bucket {
  if (!v) return base;
  base.posts += safeInt(v.posts);
  base.wins += safeInt(v.wins);
  base.scoreErrorSum += safeNum(v.scoreErrorSum);
  base.upsetHitCount += safeInt(v.upsetHitCount);
  base.upsetOpportunityCount += safeInt(v.upsetOpportunityCount);
  base.upsetPointsSum += safeNum(v.upsetPointsSum);
  base.scorePrecisionSum += safeNum(v.scorePrecisionSum);
  base.pointsSumV3 += safeNum(v.pointsSumV3);
  base.upsetBonusSum += safeNum(v.upsetBonusSum);
  base.streakBonusSum += safeNum(v.streakBonusSum);
  return base;
}

function computeForCards(b: Bucket): Omit<SummaryForCards, "fullPosts"> {
  const posts = safeInt(b.posts);
  const wins = safeInt(b.wins);
  const pointsSumV3 = safeNum(b.pointsSumV3);
  const upsetBonusSum = safeNum(b.upsetBonusSum);
  const streakBonusSum = safeNum(b.streakBonusSum);
  const basePointsSum = Math.max(
    0,
    pointsSumV3 - upsetBonusSum - streakBonusSum
  );
  return {
    posts,
    wins,
    winRate: posts ? wins / posts : 0,
    scorePrecisionSum: safeNum(b.scorePrecisionSum),
    upsetPointsSum: safeNum(b.upsetPointsSum),
    pointsSumV3,
    upsetChanceCount: safeInt(b.upsetOpportunityCount),
    upsetHitCount: safeInt(b.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum,
  };
}

const STALE_HOURS = 24;

type DailyTrendRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  scorePrecision: number;
};

/** app/lib の buildDailyTrendFromDailySnaps と同じ解決ルール（Functions 単体ビルドのため重複） */
function buildDailyTrendFromSnaps(snaps: DocumentSnapshot[]): DailyTrendRow[] {
  const rows: DailyTrendRow[] = [];
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const d = snap.data();
    if (!d) continue;
    const dateRaw = d.date;
    const date = typeof dateRaw === "string" ? dateRaw : "";
    if (!date) continue;

    const all = d.applied_posts?.all ?? d.applied_posts ?? d.all;
    const posts = all?.posts ?? 0;
    const wins = all?.wins ?? 0;
    const pointsV3 = all?.pointsSumV3 ?? 0;
    const upsetPoints = all?.upsetPointsSum ?? 0;
    const scorePrecisionSum = all?.scorePrecisionSum ?? 0;

    rows.push({
      date,
      posts,
      wins,
      pointsV3,
      upsetPoints,
      winRate: posts > 0 ? wins / posts : 0,
      scorePrecision: scorePrecisionSum,
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

export async function buildWindowCacheForUser(uid: string): Promise<void> {
  const db = getFirestore();
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  const dailySnaps = await Promise.all(
    dates.map((d) =>
      db.doc(`user_stats_v2_daily/${uid}_${dateKeyJST(d)}`).get()
    )
  );

  const dailyBuckets: { bucket: Bucket | null }[] = dates.map((d, i) => {
    const snap = dailySnaps[i];
    const raw = snap?.exists
      ? (snap.data()?.all as Partial<Bucket> | undefined)
      : undefined;
    return {
      bucket: raw ? ({ ...empty(), ...raw } as Bucket) : null,
    };
  });

  const sevenBucket = dailyBuckets
    .slice(0, 7)
    .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());
  const thirtyBucket = dailyBuckets
    .slice(0, 30)
    .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());

  const seven = computeForCards(sevenBucket);
  const thirty = computeForCards(thirtyBucket);

  const recent3Bucket = dailyBuckets
    .slice(0, 3)
    .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());
  const recent3Posts = safeInt(recent3Bucket.posts);
  const dailyTrend = buildDailyTrendFromSnaps(dailySnaps);

  const windowRef = db.doc(`user_stats_v2_window_cache/${uid}`);
  await windowRef.set(
    {
      "7d": { fullPosts: seven.posts, ...seven },
      "30d": { fullPosts: thirty.posts, ...thirty },
      recent3Posts,
      dailyTrend,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** 全 user_stats_v2 ユーザーの window_cache を再構築（cron 用） */
export async function buildAllUsersWindowCache(): Promise<{ ok: number; err: number }> {
  const db = getFirestore();
  const snap = await db.collection("user_stats_v2").select().limit(500).get();
  let ok = 0;
  let err = 0;
  for (const d of snap.docs) {
    try {
      await buildWindowCacheForUser(d.id);
      ok++;
    } catch (e) {
      console.error(`[buildWindowCache] uid=${d.id}`, e);
      err++;
    }
  }
  return { ok, err };
}

export function isWindowCacheStale(
  updatedAt: { toDate(): Date } | undefined
): boolean {
  if (!updatedAt) return true;
  const then = updatedAt.toDate();
  const now = new Date();
  return (now.getTime() - then.getTime()) > STALE_HOURS * 60 * 60 * 1000;
}
