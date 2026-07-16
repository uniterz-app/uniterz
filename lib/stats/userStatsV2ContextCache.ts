/**
 * 柱 3 タイミング用 — 大会/シーズン通算キャッシュ（設計 doc 準拠）
 * @see docs/pro-subscription-plan.md 柱 3
 */

export type ContextStatsBucket = {
  posts: number;
  wins: number;
  upsetPickCount?: number;
  upsetHitCount?: number;
  upsetOpportunityCount?: number;
};

export type ContextTeamBucket = {
  posts: number;
  wins: number;
};

export type UserStatsV2ContextCache = {
  schemaVersion: 1;
  uid: string;
  /** 例: "wc:2026:main" */
  contextId: string;
  league: string;
  scope?: string | null;
  periodStartDateKey: string;
  raw: ContextStatsBucket;
  homeAway: {
    home: ContextStatsBucket;
    away: ContextStatsBucket;
  };
  market: {
    favoritePickCount: number;
    underdogPickCount: number;
    favoriteWins: number;
    underdogWins: number;
  };
  teams: Record<string, ContextTeamBucket>;
};

export type ContextGlobalCache = {
  schemaVersion: 1;
  contextId: string;
  raw: { posts: number; wins: number };
  market?: {
    underdogPickCount: number;
    underdogWins: number;
  };
};

export function contextWinRate(bucket: {
  posts: number;
  wins: number;
}): number | null {
  if (bucket.posts <= 0) return null;
  return bucket.wins / bucket.posts;
}

export function contextUnderdogWinRate(
  market: UserStatsV2ContextCache["market"]
): number | null {
  if (market.underdogPickCount <= 0) return null;
  return market.underdogWins / market.underdogPickCount;
}

export function contextGlobalWinRate(
  global: ContextGlobalCache | null | undefined
): number | null {
  if (!global || global.raw.posts <= 0) return null;
  return global.raw.wins / global.raw.posts;
}

/** 大会/シーズンキー（投稿確定時に解決） */
export function resolveContextId(input: {
  league: string;
  season?: string | null;
  scope?: string | null;
}): string {
  const league = input.league.trim().toLowerCase();
  const season = input.season?.trim() || "current";
  const scope = input.scope?.trim() || "overall";
  return `${league}:${season}:${scope}`;
}
