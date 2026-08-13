/**
 * users.profileHeroSnapshot — Kinetik ヒーロー用の薄い denorm。
 * cumulative_stats を待たず users 1 read でカード数字を出す。
 */
import {
  pickNbaPlayoffsCumulativeSlice,
  pickNbaSeasonKeyCumulativeSlice,
} from "@/lib/rankings/pickNbaStatsBucket";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { readStoredRankFromSnapshotRanks } from "@/lib/rankings/server/readSnapshotRanksFromCumulative";
import type { ProfileSummaryForCards } from "@/lib/profile/resolveLiveProfileSummary";
import type { ProfileKinetikMetricsPeriod } from "@/lib/profile/useNbaKinetikMonthlyStats";

export const PROFILE_HERO_SNAPSHOT_VERSION = 1 as const;

export type ProfileHeroScopeStats = {
  posts: number;
  wins: number;
  winRate: number;
  goalScorerHitCount: number;
  pointsSumV3: number;
  upsetPointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
  upsetChanceCount: number;
  upsetHitCount: number;
};

export type ProfileHeroSnapshotRanks = {
  totalPoints: number | null;
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPointsDenominator: number | null;
  rankDeltaPlaces: number | null;
};

export type ProfileHeroSnapshot = {
  v: typeof PROFILE_HERO_SNAPSHOT_VERSION;
  seasonKey: string;
  updatedAtMs: number;
  lastPostId?: string;
  activeWinStreak: number;
  ranks: ProfileHeroSnapshotRanks;
  season: ProfileHeroScopeStats;
  playoffs: ProfileHeroScopeStats;
};

export type ProfileHeroSummaryRanks = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
  totalPointsDenominator: number | null;
  rankDeltaPlaces: number | null;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyScope(): ProfileHeroScopeStats {
  return {
    posts: 0,
    wins: 0,
    winRate: 0,
    goalScorerHitCount: 0,
    pointsSumV3: 0,
    upsetPointsSum: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    basePointsSum: 0,
    upsetChanceCount: 0,
    upsetHitCount: 0,
  };
}

function scopeFromBucket(bucket: Record<string, unknown>): ProfileHeroScopeStats {
  const posts = safeInt(bucket.totalPosts);
  const wins = safeInt(bucket.totalWins);
  const pointsSumV3 = safeNum(bucket.totalPoints);
  const upsetBonusSum = safeNum(bucket.upsetBonusSum);
  const streakBonusSum = safeNum(bucket.streakBonusSum);
  return {
    posts,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    goalScorerHitCount: safeInt(
      bucket.totalGoalScorerHits ?? bucket.goalScorerHitCount
    ),
    pointsSumV3,
    upsetPointsSum: safeNum(bucket.totalUpset),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
    upsetChanceCount: safeInt(bucket.upsetOpportunityCount),
    upsetHitCount: safeInt(bucket.upsetHitCount),
  };
}

function ranksFromCumulative(
  cumulative: Record<string, unknown> | null | undefined
): ProfileHeroSnapshotRanks {
  return {
    totalPoints: readStoredRankFromSnapshotRanks(cumulative, "totalPoints"),
    totalPrecision: readStoredRankFromSnapshotRanks(cumulative, "totalPrecision"),
    totalUpset: readStoredRankFromSnapshotRanks(cumulative, "totalUpset"),
    totalPointsDenominator: null,
    rankDeltaPlaces: null,
  };
}

function activeStreakFromCumulative(
  cumulative: Record<string, unknown> | null | undefined
): number {
  if (!cumulative) return 0;
  const signed =
    cumulative.activeWinStreakBasketball ??
    (cumulative.streakBySport as Record<string, unknown> | undefined)
      ?.basketball ??
    cumulative.currentStreak ??
    cumulative.activeWinStreak ??
    0;
  return typeof signed === "number" && signed > 0 ? Math.floor(signed) : 0;
}

export function buildProfileHeroSnapshotFromCumulative(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): ProfileHeroSnapshot {
  /** rankingBySeason / rankingByNbaPlayoffs の現行キーのみ。ルート flat・WC 合算は使わない */
  const season = scopeFromBucket(
    pickNbaSeasonKeyCumulativeSlice(cumulative, seasonKey)
  );
  const playoffs = scopeFromBucket(
    pickNbaPlayoffsCumulativeSlice(cumulative, seasonKey)
  );
  return {
    v: PROFILE_HERO_SNAPSHOT_VERSION,
    seasonKey,
    updatedAtMs: Date.now(),
    activeWinStreak: activeStreakFromCumulative(cumulative),
    ranks: ranksFromCumulative(cumulative),
    season,
    playoffs,
  };
}

function parseScope(raw: unknown): ProfileHeroScopeStats | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const posts = safeInt(o.posts);
  const wins = safeInt(o.wins);
  return {
    posts,
    wins,
    winRate: safeNum(o.winRate),
    goalScorerHitCount: safeInt(o.goalScorerHitCount),
    pointsSumV3: safeNum(o.pointsSumV3),
    upsetPointsSum: safeNum(o.upsetPointsSum),
    upsetBonusSum: safeNum(o.upsetBonusSum),
    streakBonusSum: safeNum(o.streakBonusSum),
    basePointsSum: safeNum(o.basePointsSum),
    upsetChanceCount: safeInt(o.upsetChanceCount),
    upsetHitCount: safeInt(o.upsetHitCount),
  };
}

function parseRank(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

function parseRanks(raw: unknown): ProfileHeroSnapshotRanks | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    totalPoints: parseRank(o.totalPoints),
    totalPrecision: parseRank(o.totalPrecision),
    totalUpset: parseRank(o.totalUpset),
    totalPointsDenominator: parseRank(o.totalPointsDenominator),
    rankDeltaPlaces:
      typeof o.rankDeltaPlaces === "number" && Number.isFinite(o.rankDeltaPlaces)
        ? Math.floor(o.rankDeltaPlaces)
        : null,
  };
}

export function parseProfileHeroSnapshot(
  userDoc: Record<string, unknown> | null | undefined
): ProfileHeroSnapshot | null {
  if (!userDoc) return null;
  const raw = userDoc.profileHeroSnapshot;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== PROFILE_HERO_SNAPSHOT_VERSION) return null;
  const seasonKey =
    typeof o.seasonKey === "string" ? o.seasonKey.trim() : "";
  if (!seasonKey) return null;
  const season = parseScope(o.season);
  const playoffs = parseScope(o.playoffs);
  const ranks = parseRanks(o.ranks);
  if (!season || !playoffs || !ranks) return null;
  return {
    v: PROFILE_HERO_SNAPSHOT_VERSION,
    seasonKey,
    updatedAtMs: safeInt(o.updatedAtMs),
    lastPostId:
      typeof o.lastPostId === "string" ? o.lastPostId : undefined,
    activeWinStreak: safeInt(o.activeWinStreak),
    ranks,
    season,
    playoffs,
  };
}

export function heroScopeForPeriod(
  snapshot: ProfileHeroSnapshot,
  period: ProfileKinetikMetricsPeriod
): ProfileHeroScopeStats {
  return period === "playoffs" ? snapshot.playoffs : snapshot.season;
}

export function heroSnapshotToSummary(
  snapshot: ProfileHeroSnapshot,
  period: ProfileKinetikMetricsPeriod
): ProfileSummaryForCards {
  const scope = heroScopeForPeriod(snapshot, period);
  return {
    posts: scope.posts,
    fullPosts: scope.posts,
    recent3Posts: 0,
    wins: scope.wins,
    winRate: scope.winRate,
    exactHitCount: 0,
    goalScorerHitCount: scope.goalScorerHitCount,
    upsetPointsSum: scope.upsetPointsSum,
    pointsSumV3: scope.pointsSumV3,
    upsetChanceCount: scope.upsetChanceCount,
    upsetHitCount: scope.upsetHitCount,
    upsetBonusSum: scope.upsetBonusSum,
    streakBonusSum: scope.streakBonusSum,
    basePointsSum: scope.basePointsSum,
    activeWinStreak: snapshot.activeWinStreak,
  };
}

export function heroSnapshotToSummaryRanks(
  snapshot: ProfileHeroSnapshot
): ProfileHeroSummaryRanks {
  return {
    totalPrecision: snapshot.ranks.totalPrecision,
    totalUpset: snapshot.ranks.totalUpset,
    totalPoints: snapshot.ranks.totalPoints,
    totalPointsDenominator: snapshot.ranks.totalPointsDenominator,
    rankDeltaPlaces: snapshot.ranks.rankDeltaPlaces,
  };
}

/** seasonKey が現行と一致するか */
export function isProfileHeroSnapshotFresh(
  snapshot: ProfileHeroSnapshot | null,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): snapshot is ProfileHeroSnapshot {
  return snapshot != null && snapshot.seasonKey === seasonKey;
}
