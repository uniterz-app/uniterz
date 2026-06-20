import type {
  CommunityGroupLeaderboardRow,
  CommunityGroupListPreview,
  CommunityGroupSummary,
} from "./communityApiNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";

export type CommunityGroupDetailCacheEntry = {
  summary: CommunityGroupSummary;
  rows: CommunityGroupLeaderboardRow[];
  metric: CommunityGroupSummary["rankingMetric"];
  fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CommunityGroupDetailCacheEntry>();
const inflight = new Map<string, Promise<CommunityGroupDetailCacheEntry | null>>();

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

export function getCachedCommunityGroupDetail(groupId: string): CommunityGroupDetailCacheEntry | null {
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
  getIdToken: () => Promise<string>
): Promise<CommunityGroupDetailCacheEntry | null> {
  const fresh = getCachedCommunityGroupDetail(groupId);
  if (fresh) return fresh;

  const pending = inflight.get(groupId);
  if (pending) return pending;

  const task = (async () => {
    const h = await communityAuthHeader(getIdToken);
    if (!h) return null;

    try {
      const [sRes, lRes] = await Promise.all([
        fetch(communityApiUrl(`/api/communities/${groupId}/summary`), {
          headers: { Authorization: h },
        }),
        fetch(communityApiUrl(`/api/communities/${groupId}/leaderboard`), {
          headers: { Authorization: h },
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

export function prefetchCommunityGroupDetail(groupId: string, getIdToken: () => Promise<string>) {
  void fetchCommunityGroupDetail(groupId, getIdToken);
}

export function prefetchCommunityGroupDetails(
  groupIds: string[],
  getIdToken: () => Promise<string>,
  limit = 5
) {
  for (const id of groupIds.slice(0, limit)) {
    prefetchCommunityGroupDetail(id, getIdToken);
  }
}
