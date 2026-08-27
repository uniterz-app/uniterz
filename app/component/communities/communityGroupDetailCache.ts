"use client";

import { auth } from "@/lib/firebase";
import { prefetchCommunityHeaderImage } from "@/lib/communities/prefetchCommunityHeaderImage";
import type { CommunityLeague, CommunityMetric } from "@/lib/communities/types";

export type CommunityGroupSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  headerImagePositionY: number;
  rankingMetric: CommunityMetric;
  periodType: string;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  archived: boolean;
  isOwner: boolean;
  inviteCode: string | null;
  rankingStartDateKey?: string | null;
};

export type CommunityGroupLeaderboardRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  countryCode?: string;
  totalPosts?: number;
  totalWins?: number;
  sortValue: number;
  winRate: number;
  activeWinStreak: number;
  totalPoints: number;
  totalUpset?: number;
};

export type CommunityGroupDetailCacheEntry = {
  summary: CommunityGroupSummary;
  rows: CommunityGroupLeaderboardRow[];
  metric: CommunityMetric;
  fetchedAt: number;
};

/** 一覧カードから即時表示するためのプレビュー */
export type CommunityGroupListPreview = {
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImagePositionY?: number;
  memberCount: number;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  isOwner: boolean;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CommunityGroupDetailCacheEntry>();
const inflight = new Map<string, Promise<CommunityGroupDetailCacheEntry | null>>();

let cachedAuthHeader: { value: string; until: number } | null = null;

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const now = Date.now();
  if (cachedAuthHeader && now < cachedAuthHeader.until) {
    return cachedAuthHeader.value;
  }
  const token = await u.getIdToken();
  if (!token) return null;
  const value = `Bearer ${token}`;
  cachedAuthHeader = { value, until: now + 4 * 60_000 };
  return value;
}

export type CommunityGroupDetailPartial = {
  summary?: CommunityGroupSummary;
  rows?: CommunityGroupLeaderboardRow[];
  metric?: CommunityMetric;
};

export function listPreviewToSummary(
  groupId: string,
  preview: CommunityGroupListPreview
): CommunityGroupSummary {
  return {
    id: groupId,
    name: preview.name,
    description: preview.description,
    ownerUid: "",
    memberCount: preview.memberCount,
    headerImageUrl: preview.headerImageUrl,
    headerImagePositionY: preview.headerImagePositionY ?? 50,
    rankingMetric: preview.rankingMetric,
    periodType: "from_now",
    rankingLeague: preview.rankingLeague,
    rankingTeamIds: preview.rankingTeamIds ?? [],
    archived: false,
    isOwner: preview.isOwner,
    inviteCode: null,
  };
}

export function getCachedCommunityGroupDetail(
  groupId: string
): CommunityGroupDetailCacheEntry | null {
  const hit = cache.get(groupId);
  if (!hit) return null;
  if (Date.now() - hit.fetchedAt > CACHE_TTL_MS) {
    cache.delete(groupId);
    return null;
  }
  return hit;
}

export function invalidateCommunityGroupDetail(groupId: string) {
  cache.delete(groupId);
  inflight.delete(groupId);
}

export async function fetchCommunityGroupDetail(
  groupId: string,
  opts?: { onPartial?: (partial: CommunityGroupDetailPartial) => void }
): Promise<CommunityGroupDetailCacheEntry | null> {
  const fresh = getCachedCommunityGroupDetail(groupId);
  if (fresh) return fresh;

  const pending = inflight.get(groupId);
  if (pending) return pending;

  const task = (async () => {
    const h = await authHeader();
    if (!h) return null;

    const headers = { Authorization: h };
    const emitPartial = (partial: CommunityGroupDetailPartial) => {
      opts?.onPartial?.(partial);
    };

    try {
      // leaderboard が group summary も返すので 1 往復・membership 1 回にまとめる
      const lJson = await fetch(`/api/communities/${groupId}/leaderboard`, {
        headers,
        cache: "default",
      }).then((res) => res.json().catch(() => ({})));

      if (!lJson?.ok || !lJson.group) return null;

      const summary = lJson.group as CommunityGroupSummary;
      prefetchCommunityHeaderImage(summary.headerImageUrl);
      emitPartial({
        summary,
        rows: lJson.rows ?? [],
        metric: lJson.rankingMetric as CommunityMetric | undefined,
      });

      const entry: CommunityGroupDetailCacheEntry = {
        summary,
        rows: lJson.rows ?? [],
        metric:
          (lJson.rankingMetric as CommunityMetric | undefined) ??
          summary.rankingMetric,
        fetchedAt: Date.now(),
      };
      cache.set(groupId, entry);
      return entry;
    } finally {
      inflight.delete(groupId);
    }
  })();

  inflight.set(groupId, task);
  return task;
}

export function prefetchCommunityGroupDetail(groupId: string) {
  void fetchCommunityGroupDetail(groupId);
}

export function prefetchCommunityGroupDetails(groupIds: string[], limit = 2) {
  for (const id of groupIds.slice(0, limit)) {
    prefetchCommunityGroupDetail(id);
  }
}
