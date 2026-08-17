/**
 * Result 一覧（初回ページ）の短 TTL メモリ。
 * タブ再訪・focus 再取得の重複 getDocs を抑える。
 */
import type { DocumentSnapshot } from "firebase/firestore";
import type { PostWithMillis } from "@/lib/result/result-page-data";

const LIST_TTL_MS = 45 * 1000;

export type ResultPostsListCacheEntry = {
  at: number;
  posts: PostWithMillis[];
  /** 次ページがあるか（初回ページ時点） */
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
};

const listCache = new Map<string, ResultPostsListCacheEntry>();
const listInflight = new Map<string, Promise<ResultPostsListCacheEntry | null>>();

function listKey(uid: string, league: string): string {
  return `${uid.trim()}|${league}`;
}

export function peekResultPostsListCache(
  uid: string,
  league: string
): ResultPostsListCacheEntry | undefined {
  const key = listKey(uid, league);
  const hit = listCache.get(key);
  if (!hit || Date.now() - hit.at >= LIST_TTL_MS) return undefined;
  return hit;
}

export function setResultPostsListCache(
  uid: string,
  league: string,
  entry: Omit<ResultPostsListCacheEntry, "at">
): void {
  listCache.set(listKey(uid, league), { ...entry, at: Date.now() });
}

export function getResultPostsListInflight(
  uid: string,
  league: string
): Promise<ResultPostsListCacheEntry | null> | undefined {
  return listInflight.get(listKey(uid, league));
}

export function setResultPostsListInflight(
  uid: string,
  league: string,
  promise: Promise<ResultPostsListCacheEntry | null>
): void {
  listInflight.set(listKey(uid, league), promise);
}

export function clearResultPostsListInflight(uid: string, league: string): void {
  listInflight.delete(listKey(uid, league));
}

export function invalidateResultPostsListCache(
  uid?: string,
  league?: string
): void {
  if (uid && league) {
    const key = listKey(uid, league);
    listCache.delete(key);
    listInflight.delete(key);
    return;
  }
  if (uid) {
    const prefix = `${uid.trim()}|`;
    for (const key of [...listCache.keys()]) {
      if (key.startsWith(prefix)) listCache.delete(key);
    }
    for (const key of [...listInflight.keys()]) {
      if (key.startsWith(prefix)) listInflight.delete(key);
    }
    return;
  }
  listCache.clear();
  listInflight.clear();
}
