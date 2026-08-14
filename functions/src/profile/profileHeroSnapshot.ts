/**
 * users.profileHeroSnapshot — Functions 側ビルド / 更新ヘルパ。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonKeyFromDateJST,
} from "../rankings/nbaSeason";

export const PROFILE_HERO_SNAPSHOT_VERSION = 2;

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

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asBucket(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object") return {};
  return v as Record<string, unknown>;
}

function pickSeasonBucket(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string
): Record<string, unknown> {
  if (!cumulative) return {};
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(bySeason[seasonKey]);
}

function pickPlayoffsBucket(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string
): Record<string, unknown> {
  if (!cumulative) return {};
  const byPlayoffs = (cumulative.rankingByNbaPlayoffs ?? {}) as Record<
    string,
    unknown
  >;
  return asBucket(byPlayoffs[seasonKey]);
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

function readRank(
  cumulative: Record<string, unknown> | null | undefined,
  metric: string
): number | null {
  if (!cumulative) return null;
  const nested = cumulative.snapshotRanks as Record<string, unknown> | undefined;
  const seasons = (nested?.seasons ??
    cumulative["snapshotRanks.seasons"]) as Record<
    string,
    Record<string, unknown>
  > | undefined;
  const raw = seasons?.[CURRENT_NBA_SEASON_KEY]?.[metric];
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

function ranksFromCumulative(
  cumulative: Record<string, unknown> | null | undefined
): ProfileHeroSnapshotRanks {
  return {
    totalPoints: readRank(cumulative, "totalPoints"),
    totalPrecision: readRank(cumulative, "totalPrecision"),
    totalUpset: readRank(cumulative, "totalUpset"),
    totalPointsDenominator: null,
    rankDeltaPlaces: null,
  };
}

function activeStreakFromCumulative(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string
): number {
  if (!cumulative) return 0;
  const key = cumulative.streakSeasonKeyBasketball;
  if (typeof key !== "string" || key !== seasonKey) return 0;
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
  const season = scopeFromBucket(pickSeasonBucket(cumulative, seasonKey));
  const playoffs = scopeFromBucket(pickPlayoffsBucket(cumulative, seasonKey));
  return {
    v: PROFILE_HERO_SNAPSHOT_VERSION,
    seasonKey,
    updatedAtMs: Date.now(),
    activeWinStreak: activeStreakFromCumulative(cumulative, seasonKey),
    ranks: ranksFromCumulative(cumulative),
    season,
    playoffs,
  };
}

export function parseStoredHeroSnapshot(
  user: Record<string, unknown>
): ProfileHeroSnapshot | null {
  const raw = user.profileHeroSnapshot;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== PROFILE_HERO_SNAPSHOT_VERSION) return null;
  const seasonKey =
    typeof o.seasonKey === "string" ? o.seasonKey.trim() : "";
  if (!seasonKey) return null;
  const parseScope = (s: unknown): ProfileHeroScopeStats | null => {
    if (!s || typeof s !== "object") return null;
    const x = s as Record<string, unknown>;
    const posts = safeInt(x.posts);
    const wins = safeInt(x.wins);
    return {
      posts,
      wins,
      winRate: safeNum(x.winRate),
      goalScorerHitCount: safeInt(x.goalScorerHitCount),
      pointsSumV3: safeNum(x.pointsSumV3),
      upsetPointsSum: safeNum(x.upsetPointsSum),
      upsetBonusSum: safeNum(x.upsetBonusSum),
      streakBonusSum: safeNum(x.streakBonusSum),
      basePointsSum: safeNum(x.basePointsSum),
      upsetChanceCount: safeInt(x.upsetChanceCount),
      upsetHitCount: safeInt(x.upsetHitCount),
    };
  };
  const season = parseScope(o.season);
  const playoffs = parseScope(o.playoffs);
  if (!season || !playoffs) return null;
  const ranksRaw = o.ranks;
  const ranks: ProfileHeroSnapshotRanks = {
    totalPoints: null,
    totalPrecision: null,
    totalUpset: null,
    totalPointsDenominator: null,
    rankDeltaPlaces: null,
  };
  if (ranksRaw && typeof ranksRaw === "object") {
    const r = ranksRaw as Record<string, unknown>;
    for (const key of [
      "totalPoints",
      "totalPrecision",
      "totalUpset",
    ] as const) {
      const n = typeof r[key] === "number" ? r[key] : Number(r[key]);
      ranks[key] = Number.isFinite(n) && n > 0 ? Math.floor(n as number) : null;
    }
  }
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

export function incrementHeroScope(
  scope: ProfileHeroScopeStats,
  inc: {
    isWin: boolean;
    points: number;
    upsetPoints: number;
    upsetBonus: number;
    streakBonus: number;
    goalScorerHit: boolean;
    hadUpsetGame: boolean;
    upsetHit: boolean;
  }
): ProfileHeroScopeStats {
  const posts = scope.posts + 1;
  const wins = scope.wins + (inc.isWin ? 1 : 0);
  const pointsSumV3 = scope.pointsSumV3 + inc.points;
  const upsetBonusSum = scope.upsetBonusSum + inc.upsetBonus;
  const streakBonusSum = scope.streakBonusSum + inc.streakBonus;
  return {
    posts,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    goalScorerHitCount:
      scope.goalScorerHitCount + (inc.goalScorerHit ? 1 : 0),
    pointsSumV3,
    upsetPointsSum: scope.upsetPointsSum + inc.upsetPoints,
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
    upsetChanceCount:
      scope.upsetChanceCount + (inc.hadUpsetGame ? 1 : 0),
    upsetHitCount: scope.upsetHitCount + (inc.upsetHit ? 1 : 0),
  };
}

export function emptyHeroSnapshot(seasonKey: string): ProfileHeroSnapshot {
  return {
    v: PROFILE_HERO_SNAPSHOT_VERSION,
    seasonKey,
    updatedAtMs: Date.now(),
    activeWinStreak: 0,
    ranks: {
      totalPoints: null,
      totalPrecision: null,
      totalUpset: null,
      totalPointsDenominator: null,
      rankDeltaPlaces: null,
    },
    season: emptyScope(),
    playoffs: emptyScope(),
  };
}

export { nbaSeasonKeyFromDateJST, CURRENT_NBA_SEASON_KEY };
