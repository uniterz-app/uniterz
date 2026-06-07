import type { CommunityLeague, CommunityMetric, CommunityPeriodType } from "@/lib/communities/types";

type RankedRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan: "free" | "pro";
  countryCode: string | null;
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;
  sortValue: number;
};

export type LeaderboardResponsePayload = {
  ok: true;
  rankingMetric: CommunityMetric;
  periodType: CommunityPeriodType;
  rankingLeague: CommunityLeague;
  rows: RankedRow[];
  myRow: RankedRow | null;
};

type CacheEntry = {
  key: string;
  value: LeaderboardResponsePayload;
  expiresAt: number;
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

function teamIdsKey(teamIds: string[]): string {
  return [...teamIds].sort().join(",");
}

function makeCacheKey(params: {
  groupId: string;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  periodType: CommunityPeriodType;
  rankingStartDateKey: string;
  memberCount: number;
  topMemberUidSample: string;
}) {
  return [
    params.groupId,
    params.rankingMetric,
    params.rankingLeague,
    teamIdsKey(params.rankingTeamIds),
    params.periodType,
    params.rankingStartDateKey,
    params.memberCount,
    params.topMemberUidSample,
  ].join("|");
}

export function getCachedLeaderboardResponse(params: {
  groupId: string;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  periodType: CommunityPeriodType;
  rankingStartDateKey: string;
  memberCount: number;
  topMemberUidSample: string;
}): LeaderboardResponsePayload | null {
  const key = makeCacheKey(params);
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedLeaderboardResponse(
  params: {
    groupId: string;
    rankingMetric: CommunityMetric;
    rankingLeague: CommunityLeague;
    rankingTeamIds: string[];
    periodType: CommunityPeriodType;
    rankingStartDateKey: string;
    memberCount: number;
    topMemberUidSample: string;
  },
  value: LeaderboardResponsePayload
) {
  const key = makeCacheKey(params);
  cache.set(key, {
    key,
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

