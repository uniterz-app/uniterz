/**
 * プロフィールカード用サマリー — cumulative（1 read）をベースに、
 * 当日 daily（+1 read）だけオーバーレイしてライブ加算を反映する。
 * 日次全件スキャンは避ける（初回表示の遅延対策）。
 */

import type { Firestore } from "firebase-admin/firestore";
import { readDailyWcStageBucket } from "@/lib/rankings/dailyWcStageBuckets";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { getPastDateKeysInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";

export type ProfileSummaryForCards = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;
  wins: number;
  winRate: number;
  /** WC の予想スコア完全一致数。NBA は常に 0。 */
  exactHitCount: number;
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
  activeWinStreak?: number;
  maxWinStreak?: number;
};

export type PriorSnapshotMetrics = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  winRate?: number;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptySummary(): ProfileSummaryForCards {
  return {
    posts: 0,
    fullPosts: 0,
    recent3Posts: 0,
    wins: 0,
    winRate: 0,
    exactHitCount: 0,
    upsetPointsSum: 0,
    pointsSumV3: 0,
    upsetChanceCount: 0,
    upsetHitCount: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    basePointsSum: 0,
  };
}

function summaryFromDailyRow(
  row: Record<string, unknown>,
  wcStage: boolean
): ProfileSummaryForCards {
  const posts = safeInt(row.posts);
  const wins = safeInt(row.wins);
  const pointsSumV3 = safeNum(row.pointsSumV3);
  const upsetPointsSum = safeNum(row.upsetPointsSum);
  const exactHitCount = wcStage
    ? safeInt(row.exactHitCount)
    : 0;
  const upsetBonusSum = safeNum(row.upsetBonusSum);
  const streakBonusSum = safeNum(row.streakBonusSum);
  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    exactHitCount,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: safeInt(row.upsetOpportunityCount),
    upsetHitCount: safeInt(row.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
  };
}

function mergeDailyRowIntoSummary(
  base: ProfileSummaryForCards,
  row: Record<string, unknown>,
  wcStage: boolean
): ProfileSummaryForCards {
  const inc = summaryFromDailyRow(row, wcStage);
  const posts = base.posts + inc.posts;
  const wins = base.wins + inc.wins;
  const pointsSumV3 = base.pointsSumV3 + inc.pointsSumV3;
  const upsetBonusSum = base.upsetBonusSum + inc.upsetBonusSum;
  const streakBonusSum = base.streakBonusSum + inc.streakBonusSum;
  return {
    ...base,
    posts,
    fullPosts: posts,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    exactHitCount: base.exactHitCount + inc.exactHitCount,
    upsetPointsSum: base.upsetPointsSum + inc.upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: base.upsetChanceCount + inc.upsetChanceCount,
    upsetHitCount: base.upsetHitCount + inc.upsetHitCount,
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
  };
}

export function summaryFromWcCumulativeStage(
  cumulative: Record<string, unknown> | null,
  wcStage: WcRankingStage
): ProfileSummaryForCards | null {
  const block = (
    cumulative?.rankingByWcStage as
      | Record<string, Record<string, unknown>>
      | undefined
  )?.[wcStage];
  if (!block || typeof block !== "object") return null;

  const posts = safeInt(block.totalPosts);
  if (posts <= 0) return null;

  const wins = safeInt(block.totalWins);
  const pointsSumV3 = safeNum(block.totalPoints);
  const upsetPointsSum = safeNum(block.totalUpset);
  const exactHitCount = safeInt(
    block.totalExactHits ?? block.totalPrecision
  );
  const upsetBonusSum = safeNum(block.upsetBonusSum);
  const streakBonusSum = safeNum(block.streakBonusSum);
  const winRateRaw = safeNum(block.winRate);

  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate:
      posts > 0 ? wins / posts : winRateRaw <= 1 ? winRateRaw : winRateRaw / 100,
    exactHitCount,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: safeInt(block.upsetOpportunityCount),
    upsetHitCount: safeInt(block.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
    activeWinStreak: safeInt(block.activeWinStreak),
  };
}

/** NBA 現行シーズン（rankingBySeason.<key>）のサマリー */
export function summaryFromSeasonRanking(
  cumulative: Record<string, unknown> | null
): ProfileSummaryForCards {
  const bySeason = ((cumulative?.rankingBySeason as Record<string, unknown>) ??
    {}) as Record<string, Record<string, unknown> | undefined>;
  const r = bySeason[CURRENT_NBA_SEASON_KEY] ?? {};
  const posts = safeInt(r.totalPosts);
  const wins = safeInt(r.totalWins);
  const pointsSumV3 = safeNum(r.totalPoints);
  const upsetPointsSum = safeNum(r.totalUpset);
  const upsetBonusSum = safeNum(r.upsetBonusSum);
  const streakBonusSum = safeNum(r.streakBonusSum);
  const basePointsSum = Math.max(
    0,
    pointsSumV3 - upsetBonusSum - streakBonusSum
  );
  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    exactHitCount: 0,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: safeInt(r.upsetOpportunityCount),
    upsetHitCount: safeInt(r.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum,
    activeWinStreak: safeInt(r.activeWinStreak),
  };
}

function pickWcDailyRow(
  data: Record<string, unknown>,
  wcStage: WcRankingStage
): Record<string, unknown> {
  const stageBucket = readDailyWcStageBucket(data, wcStage);
  if (Number(stageBucket.posts ?? 0) > 0) {
    return stageBucket as Record<string, unknown>;
  }
  const leagues = (data.leagues ?? {}) as Record<string, unknown>;
  return ((wcStage === "overall" ? leagues.wc : null) ??
    {}) as Record<string, unknown>;
}

function pickNbaDailyRow(
  data: Record<string, unknown>
): Record<string, unknown> {
  const bySeason = (data.rankingBySeason ?? {}) as Record<string, unknown>;
  return (bySeason[CURRENT_NBA_SEASON_KEY] ?? {}) as Record<string, unknown>;
}

async function fetchTodayDailyDoc(db: Firestore, uid: string) {
  const todayKey = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 1)[0];
  if (!todayKey) return null;
  const snap = await db.doc(`user_stats_v2_daily/${uid}_${todayKey}`).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

/** cumulative が前日スナップショット + 当日 daily より遅れているとき当日分を加算 */
function shouldOverlayTodayDaily(
  cumulativePts: number,
  todayRow: Record<string, unknown>,
  prior: PriorSnapshotMetrics | null | undefined
): boolean {
  const todayPosts = safeInt(todayRow.posts);
  if (todayPosts <= 0) return false;
  const todayPts = safeNum(todayRow.pointsSumV3);
  if (prior?.totalPoints != null) {
    return cumulativePts + 1e-6 < prior.totalPoints + todayPts;
  }
  return false;
}

export async function resolveWcProfileSummaryLive(
  db: Firestore,
  uid: string,
  wcStage: WcRankingStage,
  cumulative: Record<string, unknown> | null,
  prior: PriorSnapshotMetrics | null | undefined
): Promise<ProfileSummaryForCards> {
  const base =
    summaryFromWcCumulativeStage(cumulative, wcStage) ?? emptySummary();
  const todayData = await fetchTodayDailyDoc(db, uid);
  if (!todayData) return base;

  const todayRow = pickWcDailyRow(todayData, wcStage);
  if (safeInt(todayRow.posts) <= 0) return base;
  if (base.posts <= 0) return summaryFromDailyRow(todayRow, true);

  if (shouldOverlayTodayDaily(base.pointsSumV3, todayRow, prior)) {
    return mergeDailyRowIntoSummary(base, todayRow, true);
  }
  return base;
}

export async function resolveNbaProfileSummaryLive(
  db: Firestore,
  uid: string,
  cumulative: Record<string, unknown> | null,
  prior: PriorSnapshotMetrics | null | undefined
): Promise<ProfileSummaryForCards> {
  const base = summaryFromSeasonRanking(cumulative);
  const todayData = await fetchTodayDailyDoc(db, uid);
  if (!todayData) return base;

  const todayRow = pickNbaDailyRow(todayData);
  if (safeInt(todayRow.posts) <= 0) return base;
  if (base.posts <= 0) return summaryFromDailyRow(todayRow, false);

  if (shouldOverlayTodayDaily(base.pointsSumV3, todayRow, prior)) {
    return mergeDailyRowIntoSummary(base, todayRow, false);
  }
  return base;
}
