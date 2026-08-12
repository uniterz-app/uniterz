/** 試合一覧の「自分の予想」マップ。TTL キャッシュでチャンク getDocs を抑える */

export type ScheduleMyPostEntry = {
  postId: string;
  winner?: "home" | "away" | "draw";
  score?: { home: number; away: number };
  comment?: string;
  updatedAt?: unknown;
  goalScorer?: unknown;
  postStats?: Record<string, unknown> | null;
};

export type ScheduleMyPostsMap = Record<string, ScheduleMyPostEntry>;

const CACHE_TTL_MS = 3 * 60 * 1000;

type CacheEntry = {
  at: number;
  byGameId: ScheduleMyPostsMap;
  /** 直近で「無い」と確認した gameId（空振り再クエリ防止） */
  absent: Set<string>;
};

const cache = new Map<string, CacheEntry>();

function ensure(uid: string): CacheEntry {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;
  const fresh: CacheEntry = { at: Date.now(), byGameId: {}, absent: new Set() };
  // TTL 切れでも known posts は引き継ぎ（absent だけ捨てる）
  if (hit) {
    fresh.byGameId = { ...hit.byGameId };
  }
  cache.set(uid, fresh);
  return fresh;
}

/** キャッシュに無く、absent でもない gameId → 取得対象 */
export function missingScheduleMyPostGameIds(
  uid: string,
  gameIds: readonly string[]
): string[] {
  const entry = ensure(uid);
  return gameIds.filter(
    (id) => !entry.byGameId[id] && !entry.absent.has(id)
  );
}

export function peekScheduleMyPosts(
  uid: string,
  gameIds: readonly string[]
): ScheduleMyPostsMap {
  const entry = ensure(uid);
  const out: ScheduleMyPostsMap = {};
  for (const id of gameIds) {
    const row = entry.byGameId[id];
    if (row) out[id] = row;
  }
  return out;
}

export function mergeScheduleMyPostsCache(
  uid: string,
  fetchedGameIds: readonly string[],
  found: ScheduleMyPostsMap
): ScheduleMyPostsMap {
  const entry = ensure(uid);
  entry.at = Date.now();
  for (const [gid, row] of Object.entries(found)) {
    entry.byGameId[gid] = row;
    entry.absent.delete(gid);
  }
  for (const gid of fetchedGameIds) {
    if (!found[gid]) entry.absent.add(gid);
  }
  cache.set(uid, entry);
  return peekScheduleMyPosts(uid, fetchedGameIds);
}

export function removeScheduleMyPostFromCache(uid: string, gameId: string) {
  const entry = cache.get(uid);
  if (!entry) return;
  delete entry.byGameId[gameId];
  entry.absent.add(gameId);
  entry.at = Date.now();
}

/** 予想保存後などに「無い」判定を捨てて再取得させる */
export function clearScheduleMyPostsAbsent(
  uid: string,
  gameIds?: readonly string[]
) {
  const entry = cache.get(uid);
  if (!entry) return;
  if (!gameIds || gameIds.length === 0) {
    entry.absent.clear();
    return;
  }
  for (const id of gameIds) entry.absent.delete(id);
}

export function invalidateScheduleMyPostsCache(uid?: string) {
  if (uid) {
    cache.delete(uid);
    return;
  }
  cache.clear();
}
