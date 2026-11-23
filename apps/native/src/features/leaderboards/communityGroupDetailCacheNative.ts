import type {
  CommunityGroupLeaderboardRow,
  CommunityGroupListPreview,
  CommunityGroupSummary,
} from "./communityApiNative";
import { prefetchCommunityHeaderImageNative } from "./prefetchCommunityHeaderImageNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import type { CommunityGamesScope } from "../../../../../lib/communities/communityGamesScope";
import { parseCommunityGamesScope } from "../../../../../lib/communities/communityGamesScope";

export type CommunityGroupDetailCacheEntry = {
  summary: CommunityGroupSummary;
  rows: CommunityGroupLeaderboardRow[];
  metric: CommunityGroupSummary["rankingMetric"];
  gamesScope: CommunityGamesScope;
  fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CommunityGroupDetailCacheEntry>();
const inflight = new Map<string, Promise<CommunityGroupDetailCacheEntry | null>>();

function cacheKey(groupId: string, gamesScope: CommunityGamesScope): string {
  return `${groupId}|${gamesScope}`;
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
  groupId: string,
  gamesScope?: CommunityGamesScope
): CommunityGroupDetailCacheEntry | null {
  if (gamesScope) {
    return readCacheEntry(cacheKey(groupId, gamesScope));
  }
  // scope 未指定: グループのいずれかの新鮮なエントリ
  for (const scope of ["all", "pickup"] as const) {
    const hit = readCacheEntry(cacheKey(groupId, scope));
    if (hit) return hit;
  }
  return null;
}

function readCacheEntry(key: string): CommunityGroupDetailCacheEntry | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  /** Pro なのにスキン欠落の古いキャッシュは捨てる（チタン固定の残骸） */
  if (
    hit.rows.some(
      (r) => r.plan === "pro" && typeof r.planProBgVariant !== "string"
    )
  ) {
    cache.delete(key);
    return null;
  }
  return hit;
}

/** グループの全 scope キャッシュを捨てる */
export function invalidateCommunityGroupDetail(groupId: string) {
  for (const key of [...cache.keys()]) {
    if (key === groupId || key.startsWith(`${groupId}|`)) {
      cache.delete(key);
    }
  }
  for (const key of [...inflight.keys()]) {
    if (key === groupId || key.startsWith(`${groupId}|`)) {
      inflight.delete(key);
    }
  }
}

/** 一覧・詳細のスキン反映漏れを避けるため detail キャッシュを捨てる */
export function invalidateAllCommunityGroupDetails() {
  cache.clear();
  inflight.clear();
}

export async function fetchCommunityGroupDetail(
  groupId: string,
  getIdToken: () => Promise<string>,
  opts?: { gamesScope?: CommunityGamesScope }
): Promise<CommunityGroupDetailCacheEntry | null> {
  const requestedScope =
    opts?.gamesScope != null
      ? parseCommunityGamesScope(opts.gamesScope)
      : null;
  const lookupKey = requestedScope
    ? cacheKey(groupId, requestedScope)
    : `pending:${groupId}`;

  if (requestedScope) {
    const fresh = getCachedCommunityGroupDetail(groupId, requestedScope);
    if (fresh) return fresh;
  } else {
    const fresh = getCachedCommunityGroupDetail(groupId);
    if (fresh) return fresh;
  }

  const pending = inflight.get(lookupKey);
  if (pending) return pending;

  const task = (async () => {
    const h = await communityAuthHeader(getIdToken);
    if (!h) return null;

    try {
      const qs =
        requestedScope != null
          ? `?gamesScope=${encodeURIComponent(requestedScope)}`
          : "";
      const lRes = await fetch(
        communityApiUrl(`/api/communities/${groupId}/leaderboard${qs}`),
        { headers: { Authorization: h } }
      );
      const lJson = await lRes.json().catch(() => ({}));
      if (!lRes.ok || !lJson?.ok || !lJson.group) return null;

      const summary = lJson.group as CommunityGroupSummary;
      /**
       * 明示リクエスト時は API が同じ scope をエコーすること。
       * 未対応の本番 API だと group のデフォルト（all）に落ち、
       * ピックアップなのに全試合得点のままになる。
       */
      const echoedRaw =
        lJson.rankingGamesScope ?? lJson.appliedRule?.rankingGamesScope;
      if (requestedScope != null) {
        if (echoedRaw == null || String(echoedRaw).trim() === "") {
          return null;
        }
        if (parseCommunityGamesScope(echoedRaw) !== requestedScope) {
          return null;
        }
      }
      const appliedScope = parseCommunityGamesScope(
        echoedRaw ?? summary.rankingGamesScope ?? requestedScope ?? "all"
      );
      const entry: CommunityGroupDetailCacheEntry = {
        summary: {
          ...summary,
          rankingGamesScope: appliedScope,
        },
        rows: Array.isArray(lJson.rows) ? lJson.rows : [],
        metric:
          (lJson.rankingMetric as CommunityGroupSummary["rankingMetric"]) ??
          summary.rankingMetric,
        gamesScope: appliedScope,
        fetchedAt: Date.now(),
      };
      prefetchCommunityHeaderImageNative(entry.summary.headerImageUrl);
      cache.set(cacheKey(groupId, appliedScope), entry);
      return entry;
    } finally {
      inflight.delete(lookupKey);
    }
  })();

  inflight.set(lookupKey, task);
  return task;
}

export function prefetchCommunityGroupDetail(
  groupId: string,
  getIdToken: () => Promise<string>
) {
  void fetchCommunityGroupDetail(groupId, getIdToken);
}

export function prefetchCommunityGroupDetails(
  groupIds: string[],
  getIdToken: () => Promise<string>,
  limit = 2
) {
  for (const id of groupIds.slice(0, limit)) {
    prefetchCommunityGroupDetail(id, getIdToken);
  }
}
