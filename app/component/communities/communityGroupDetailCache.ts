"use client";

import { auth } from "@/lib/firebase";
import type { CommunityLeague, CommunityMetric } from "@/lib/communities/types";

export type CommunityGroupSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: string;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  archived: boolean;
  isOwner: boolean;
  inviteCode: string | null;
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
  totalPrecision?: number;
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
  memberCount: number;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  isOwner: boolean;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CommunityGroupDetailCacheEntry>();
const inflight = new Map<string, Promise<CommunityGroupDetailCacheEntry | null>>();

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return `Bearer ${await u.getIdToken()}`;
}

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
  groupId: string
): Promise<CommunityGroupDetailCacheEntry | null> {
  const fresh = getCachedCommunityGroupDetail(groupId);
  if (fresh) return fresh;

  const pending = inflight.get(groupId);
  if (pending) return pending;

  const task = (async () => {
    const h = await authHeader();
    if (!h) return null;

    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`/api/communities/${groupId}/summary`, {
          headers: { Authorization: h },
          cache: "no-store",
        }),
        fetch(`/api/communities/${groupId}/leaderboard`, {
          headers: { Authorization: h },
          cache: "no-store",
        }),
      ]);
      const sJson = await sRes.json().catch(() => ({}));
      const lJson = await lRes.json().catch(() => ({}));
      if (!sRes.ok || !sJson?.ok || !sJson.group) return null;

      const entry: CommunityGroupDetailCacheEntry = {
        summary: sJson.group as CommunityGroupSummary,
        rows: lRes.ok && lJson?.ok ? (lJson.rows ?? []) : [],
        metric: (sJson.group as CommunityGroupSummary).rankingMetric,
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

export function prefetchCommunityGroupDetails(groupIds: string[], limit = 5) {
  for (const id of groupIds.slice(0, limit)) {
    prefetchCommunityGroupDetail(id);
  }
}
