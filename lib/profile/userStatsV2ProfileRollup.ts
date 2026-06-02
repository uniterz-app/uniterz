/**
 * プロフィール user-stats API 用：直近30日の日次スナップショットから
 * ウィンドウサマリー・日次トレンド行を組み立てる（Firestore 再取得なし）。
 */

import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "@/lib/time/zonedTime";

export type ProfileDailyTrendContext = {
  rankingLeague: RankingLeagueSource;
  wcStage?: WcRankingStage;
};

export function resolveProfileDailyTrendContext(
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage
): ProfileDailyTrendContext {
  if (rankingLeague === "worldcup") {
    const stage =
      wcStage && isWcRankingStage(wcStage) ? wcStage : ("overall" as const);
    return { rankingLeague, wcStage: stage };
  }
  return { rankingLeague: "nba" };
}

function dailyBucketFromDoc(
  d: Record<string, unknown>,
  ctx: ProfileDailyTrendContext
): Record<string, unknown> {
  if (ctx.rankingLeague === "worldcup") {
    const stage = ctx.wcStage ?? "overall";
    const byWc = (d.rankingByWcStage ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    return (byWc[stage] ?? byWc.overall ?? {}) as Record<string, unknown>;
  }
  const byPhase = (d.rankingByPhase ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  return (byPhase.playoffs ?? {}) as Record<string, unknown>;
}

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

/** Firestore の date / docId / Timestamp から YYYY-MM-DD を復元 */
function resolveDailyDocDateKey(
  dateRaw: unknown,
  docId: string
): string | null {
  if (typeof dateRaw === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(dateRaw.trim());
    if (m) return m[1];
  }
  if (
    dateRaw &&
    typeof dateRaw === "object" &&
    "toDate" in dateRaw &&
    typeof (dateRaw as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      const inst = (dateRaw as { toDate: () => Date }).toDate();
      if (!Number.isNaN(inst.getTime())) {
        return toDateKeyInTimeZone(inst, TIMEZONE_JST);
      }
    } catch {
      /* fall through */
    }
  }
  const idTail = docId.match(/_(\d{4}-\d{2}-\d{2})$/);
  return idTail ? idTail[1] : null;
}

/** 1 日分のスナップショットを `ProfileDailyTrendRow` に（存在しない・日付なしは null） */
export function dailyTrendRowFromDailySnap(
  snap: DocumentSnapshot,
  ctx: ProfileDailyTrendContext = { rankingLeague: "nba" }
): ProfileDailyTrendRow | null {
  if (!snap.exists) return null;
  const d = snap.data();
  if (!d) return null;
  const date = resolveDailyDocDateKey(d.date, snap.id);
  if (!date) return null;

  const bucket = dailyBucketFromDoc(d as Record<string, unknown>, ctx);
  const posts = safeInt(bucket.posts);
  const wins = safeInt(bucket.wins);
  const pointsV3 = safeNum(bucket.pointsSumV3);
  const upsetPoints = safeNum(bucket.upsetPointsSum);
  const scorePrecisionSum = safeNum(bucket.scorePrecisionSum);

  return {
    date,
    posts,
    wins,
    pointsV3,
    upsetPoints,
    winRate: posts > 0 ? wins / posts : 0,
    scorePrecision: scorePrecisionSum,
  };
}

/**
 * キャッシュ済み trend に特定日のスナップショットを上書きマージ（当日ぶんの取り残し対策）
 */
export function mergeDailyTrendWithSnap(
  trend: ProfileDailyTrendRow[],
  snap: DocumentSnapshot,
  ctx: ProfileDailyTrendContext = { rankingLeague: "nba" }
): ProfileDailyTrendRow[] {
  const row = dailyTrendRowFromDailySnap(snap, ctx);
  if (!row) return trend;
  const next = trend.filter((r) => r.date !== row.date);
  next.push(row);
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

/** useUserStatsDailyTrend と同じ all / date の解決で行を作り、日付昇順に並べる */
export function buildDailyTrendFromDailySnaps(
  snaps: DocumentSnapshot[],
  ctx: ProfileDailyTrendContext = { rankingLeague: "nba" }
): ProfileDailyTrendRow[] {
  const rows: ProfileDailyTrendRow[] = [];
  for (const snap of snaps) {
    const row = dailyTrendRowFromDailySnap(snap, ctx);
    if (row) rows.push(row);
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
