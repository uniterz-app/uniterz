/**
 * プロフィール user-stats API 用：直近30日の日次スナップショットから
 * ウィンドウサマリー・日次トレンド行を組み立てる（Firestore 再取得なし）。
 */

import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";

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

export type SummaryForCardsRollup = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;
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

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
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

function computeForCards(b: Bucket): Omit<SummaryForCardsRollup, "fullPosts"> {
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
    recent3Posts: 0,
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

function windowFromSnaps(
  snaps: DocumentSnapshot[],
  from: number,
  toExclusive: number
): SummaryForCardsRollup {
  const bucket = empty();
  for (let i = from; i < toExclusive && i < snaps.length; i++) {
    const snap = snaps[i];
    const raw = snap.exists
      ? (snap.data()?.all as Partial<Bucket> | undefined)
      : undefined;
    mergeBucket(bucket, raw ?? null);
  }
  const computed = computeForCards(bucket);
  return { fullPosts: computed.posts, ...computed };
}

/** snaps[0]=今日 … snaps[29]=29日前（APIルートと同じ並び） */
export function aggregateRecentWindowsFromDailySnaps(
  snaps: DocumentSnapshot[]
): {
  recent3: SummaryForCardsRollup;
  seven: SummaryForCardsRollup;
  thirty: SummaryForCardsRollup;
} {
  return {
    recent3: windowFromSnaps(snaps, 0, 3),
    seven: windowFromSnaps(snaps, 0, 7),
    thirty: windowFromSnaps(snaps, 0, 30),
  };
}

/** useUserStatsDailyTrend と同じ all / date の解決で行を作り、日付昇順に並べる */
export function buildDailyTrendFromDailySnaps(
  snaps: DocumentSnapshot[]
): ProfileDailyTrendRow[] {
  const rows: ProfileDailyTrendRow[] = [];
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

export function dateKeyJSTIntl(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
  const mm = parts.find((p) => p.type === "month")?.value ?? "01";
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${yyyy}-${mm}-${dd}`;
}
