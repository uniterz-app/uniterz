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
  /** 端末保存から復元しただけでまだ取り直していない gameId（表示には使い、取得は続ける） */
  unverified: Set<string>;
  /** 端末保存から復元した「無い」（表示待ちはしないが取り直す） */
  hydratedAbsent: Set<string>;
};

const cache = new Map<string, CacheEntry>();
const listeners = new Set<(uid: string) => void>();

function notify(uid: string) {
  for (const l of listeners) l(uid);
}

function ensure(uid: string): CacheEntry {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;
  const fresh: CacheEntry = {
    at: Date.now(),
    byGameId: {},
    absent: new Set(),
    unverified: new Set(),
    hydratedAbsent: new Set(),
  };
  // TTL 切れでも known posts は引き継ぎ（absent だけ捨てる）
  if (hit) {
    fresh.byGameId = { ...hit.byGameId };
    fresh.unverified = new Set(hit.unverified);
    fresh.hydratedAbsent = new Set([...hit.hydratedAbsent, ...hit.absent]);
  }
  cache.set(uid, fresh);
  return fresh;
}

/** キャッシュに無く、absent でもない gameId（復元しただけの分も含む）→ 取得対象 */
export function missingScheduleMyPostGameIds(
  uid: string,
  gameIds: readonly string[]
): string[] {
  const entry = ensure(uid);
  return gameIds.filter(
    (id) =>
      entry.unverified.has(id) || (!entry.byGameId[id] && !entry.absent.has(id))
  );
}

/** 予想の有無がまったく分からない gameId（端末保存にも無い）。一覧の先塗り待ち用 */
export function unknownScheduleMyPostGameIds(
  uid: string,
  gameIds: readonly string[]
): string[] {
  const entry = ensure(uid);
  return gameIds.filter(
    (id) =>
      !entry.byGameId[id] && !entry.absent.has(id) && !entry.hydratedAbsent.has(id)
  );
}

/** 端末保存から復元（取得済みの値は上書きしない） */
export function hydrateScheduleMyPosts(
  uid: string,
  saved: { byGameId: ScheduleMyPostsMap; absentIds: readonly string[] }
) {
  const entry = ensure(uid);
  for (const [gid, row] of Object.entries(saved.byGameId)) {
    if (entry.byGameId[gid] || entry.absent.has(gid)) continue;
    entry.byGameId[gid] = row;
    entry.unverified.add(gid);
  }
  for (const gid of saved.absentIds) {
    if (entry.byGameId[gid] || entry.absent.has(gid)) continue;
    entry.hydratedAbsent.add(gid);
  }
}

/** 端末保存用。updatedAt は Firestore Timestamp のことがあり JSON で壊れるので落とす */
export function exportScheduleMyPosts(uid: string): {
  byGameId: ScheduleMyPostsMap;
  absentIds: string[];
} {
  const entry = cache.get(uid);
  if (!entry) return { byGameId: {}, absentIds: [] };
  const byGameId: ScheduleMyPostsMap = {};
  for (const [gid, row] of Object.entries(entry.byGameId)) {
    byGameId[gid] = { ...row, updatedAt: null };
  }
  return {
    byGameId,
    absentIds: [...new Set([...entry.absent, ...entry.hydratedAbsent])],
  };
}

export function subscribeScheduleMyPosts(listener: (uid: string) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
    entry.unverified.delete(gid);
    entry.hydratedAbsent.delete(gid);
    if (!found[gid]) {
      delete entry.byGameId[gid];
      entry.absent.add(gid);
    }
  }
  cache.set(uid, entry);
  notify(uid);
  return peekScheduleMyPosts(uid, fetchedGameIds);
}

export function removeScheduleMyPostFromCache(uid: string, gameId: string) {
  const entry = cache.get(uid);
  if (!entry) return;
  delete entry.byGameId[gameId];
  entry.unverified.delete(gameId);
  entry.absent.add(gameId);
  entry.at = Date.now();
  notify(uid);
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
