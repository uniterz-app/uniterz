// lib/profile/buildUserStatsWindowCache.ts
// API route 用：user_stats_v2_window_cache を構築（functions とロジック共有のため独立実装）

import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

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

export function isWindowCacheStale(
  updatedAt: { toDate(): Date } | undefined
): boolean {
  if (!updatedAt) return true;
  const then = updatedAt.toDate();
  const now = new Date();
  return (now.getTime() - then.getTime()) > STALE_HOURS * 60 * 60 * 1000;
}

/** 既に取得済みの直近30日スナップショットで window_cache のみ更新（再読み取りなし） */
export async function buildWindowCacheForUserFromSnapshots(
  db: Firestore,
  uid: string,
  dailySnaps: DocumentSnapshot[]
): Promise<void> {
  const dailyBuckets: { bucket: Bucket | null }[] = dailySnaps.map((snap) => {
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

  const windowRef = db.doc(`user_stats_v2_window_cache/${uid}`);
  await windowRef.set(
    {
      "7d": { fullPosts: seven.posts, ...seven },
      "30d": { fullPosts: thirty.posts, ...thirty },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function buildWindowCacheForUser(
  db: Firestore,
  uid: string
): Promise<void> {
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

  await buildWindowCacheForUserFromSnapshots(db, uid, dailySnaps);
}
