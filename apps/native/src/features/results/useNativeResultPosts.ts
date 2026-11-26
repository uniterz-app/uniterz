import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatResultDateLabel,
  groupPostsByResultDay,
  RESULT_INITIAL_PAGE_SIZE,
  RESULT_NEXT_PAGE_SIZE,
  RESULT_POSTS_MAX_CACHED,
  type PostWithMillis,
  type ResultListLeagueTab,
} from "@/lib/result/result-page-data";
import {
  clearResultPostsListInflight,
  getResultPostsListInflight,
  invalidateResultPostsListCache,
  peekResultPostsListCache,
  setResultPostsListCache,
  setResultPostsListInflight,
  type ResultPostsListCacheEntry,
  type ResultPostsListCursor,
} from "@/lib/result/resultPostsListCache";
import { fetchMyResultPostsNative } from "../../lib/myPostsApiNative";

/** リザルトを開いたとき、日付帯がこの日数そろうまで取る */
const RESULT_OPEN_DAY_COUNT = 2;

function resultPostDayLabel(
  post: PostWithMillis,
  language: import("../../../../../lib/i18n/language").Language
): string {
  const start = post.startAtMillis;
  const created = post.createdAtMillis;
  const ms =
    typeof start === "number" && Number.isFinite(start) && start > 0
      ? start
      : typeof created === "number" && Number.isFinite(created)
        ? created
        : 0;
  return formatResultDateLabel(ms, language);
}

function resultPostDayCount(
  posts: readonly PostWithMillis[],
  language: import("../../../../../lib/i18n/language").Language
): number {
  const labels = new Set<string>();
  for (const post of posts) labels.add(resultPostDayLabel(post, language));
  return labels.size;
}

export function useNativeResultPosts(
  uid: string | null | undefined,
  language: import("../../../../../lib/i18n/language").Language,
  options?: {
    league: ResultListLeagueTab | null;
    enabled?: boolean;
  }
) {
  const league = options?.league ?? null;
  const fetchEnabled = options?.enabled !== false && league !== null;

  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [lastCursor, setLastCursor] = useState<ResultPostsListCursor | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  /** 初回（またはリーグ切替後）の reset 取得が1回完了するまで NO DATA を出さない */
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const resetGenRef = useRef(0);
  const loadingRef = useRef(false);
  const lastCursorRef = useRef<ResultPostsListCursor | null>(null);
  const hasMoreRef = useRef(true);
  const postsLenRef = useRef(0);
  const languageRef = useRef(language);
  lastCursorRef.current = lastCursor;
  hasMoreRef.current = hasMore;
  postsLenRef.current = posts.length;
  languageRef.current = language;

  const capPosts = useCallback((list: PostWithMillis[]) => {
    return list.length > RESULT_POSTS_MAX_CACHED
      ? list.slice(0, RESULT_POSTS_MAX_CACHED)
      : list;
  }, []);

  const applyListEntry = useCallback((entry: ResultPostsListCacheEntry) => {
    setPosts(entry.posts);
    postsLenRef.current = entry.posts.length;
    const cursor = entry.lastCursor ?? null;
    setLastCursor(cursor);
    lastCursorRef.current = cursor;
    setHasMore(entry.hasMore);
    hasMoreRef.current = entry.hasMore;
    setHasFetchedOnce(true);
  }, []);

  const loadPage = useCallback(
    async ({
      reset = false,
      force = false,
    }: { reset?: boolean; force?: boolean } = {}) => {
      if (!uid || !league) return;
      if (!fetchEnabled) return;
      if (loadingRef.current) return;
      if (!hasMoreRef.current && !reset) return;
      if (postsLenRef.current >= RESULT_POSTS_MAX_CACHED && !reset) {
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      if (reset && force) {
        invalidateResultPostsListCache(uid, league);
      }

      if (reset && !force) {
        const cached = peekResultPostsListCache(uid, league);
        if (cached) {
          const enough =
            resultPostDayCount(cached.posts, languageRef.current) >=
              RESULT_OPEN_DAY_COUNT || !cached.hasMore;
          if (enough) {
            applyListEntry(cached);
            setLoading(false);
            return;
          }
        }
        const pending = getResultPostsListInflight(uid, league);
        if (pending) {
          setLoading(true);
          loadingRef.current = true;
          try {
            const entry = await pending;
            if (entry) applyListEntry(entry);
            else setHasFetchedOnce(true);
          } finally {
            loadingRef.current = false;
            setLoading(false);
          }
          return;
        }
      }

      loadingRef.current = true;
      setLoading(true);
      try {
        const pageLimit = reset
          ? RESULT_INITIAL_PAGE_SIZE
          : RESULT_NEXT_PAGE_SIZE;

        if (reset) {
          const gen = ++resetGenRef.current;
          const isStale = () => gen !== resetGenRef.current;

          const fetchPromise = (async (): Promise<ResultPostsListCacheEntry | null> => {
            const data = await fetchMyResultPostsNative({
              league,
              lang: languageRef.current,
              limit: RESULT_INITIAL_PAGE_SIZE,
              fillDays: RESULT_OPEN_DAY_COUNT,
            });
            if (isStale()) return null;
            const next = capPosts(data.posts);
            const entry: ResultPostsListCacheEntry = {
              at: Date.now(),
              posts: next,
              hasMore: data.hasMore && next.length >= data.posts.length,
              lastDoc: null,
              lastCursor: data.nextCursor,
            };
            setResultPostsListCache(uid, league, entry);
            return entry;
          })().finally(() => {
            clearResultPostsListInflight(uid, league);
          });

          setResultPostsListInflight(uid, league, fetchPromise);
          const entry = await fetchPromise;
          if (!entry || isStale()) return;
          applyListEntry(entry);
          return;
        }

        const cursor = lastCursorRef.current;
        if (!cursor) return;

        const data = await fetchMyResultPostsNative({
          league,
          lang: languageRef.current,
          limit: pageLimit,
          beforeMs: cursor.createdAtMs,
        });

        const list = data.posts;
        let nextPostsLength = 0;
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const filtered = list.filter((p) => !seen.has(p.id));
          const merged = [...prev, ...filtered];
          const next =
            merged.length > RESULT_POSTS_MAX_CACHED
              ? merged.slice(0, RESULT_POSTS_MAX_CACHED)
              : merged;
          nextPostsLength = next.length;
          postsLenRef.current = next.length;
          return next;
        });

        setLastCursor(data.nextCursor);
        lastCursorRef.current = data.nextCursor;
        const cappedAfterLoad = nextPostsLength >= RESULT_POSTS_MAX_CACHED;
        const nextHasMore = !cappedAfterLoad && data.hasMore;
        setHasMore(nextHasMore);
        hasMoreRef.current = nextHasMore;
      } catch {
        if (reset) setHasFetchedOnce(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [uid, league, fetchEnabled, capPosts, applyListEntry]
  );

  useEffect(() => {
    if (!uid || !fetchEnabled || !league) {
      setPosts([]);
      setLastCursor(null);
      lastCursorRef.current = null;
      setHasMore(true);
      hasMoreRef.current = true;
      postsLenRef.current = 0;
      setHasFetchedOnce(false);
      setLoading(false);
      return;
    }
    const cached = peekResultPostsListCache(uid, league);
    if (cached) {
      applyListEntry(cached);
      const enough =
        resultPostDayCount(cached.posts, languageRef.current) >=
          RESULT_OPEN_DAY_COUNT || !cached.hasMore;
      if (enough) {
        setLoading(false);
        return;
      }
      void loadPage({ reset: true });
      return;
    }
    setHasFetchedOnce(false);
    setLoading(true);
    void loadPage({ reset: true });
  }, [uid, league, fetchEnabled, loadPage, applyListEntry]);

  const grouped = useMemo(
    () => groupPostsByResultDay(posts, language),
    [posts, language]
  );

  const postsCacheCapped = posts.length >= RESULT_POSTS_MAX_CACHED;

  const refreshPosts = useCallback(
    async (opts?: { force?: boolean }) => {
      await loadPage({ reset: true, force: opts?.force === true });
    },
    [loadPage]
  );

  const removePostById = useCallback(
    (id: string) => {
      setPosts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        postsLenRef.current = next.length;
        if (uid && league) {
          const cached = peekResultPostsListCache(uid, league);
          if (cached) {
            setResultPostsListCache(uid, league, {
              posts: next.slice(0, RESULT_INITIAL_PAGE_SIZE),
              hasMore: cached.hasMore,
              lastDoc: null,
              lastCursor: cached.lastCursor,
            });
          } else {
            invalidateResultPostsListCache(uid, league);
          }
        }
        return next;
      });
    },
    [uid, league]
  );

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMoreRef.current) void loadPage();
  }, [loadPage]);

  return {
    posts,
    grouped,
    loading,
    hasFetchedOnce,
    hasMore,
    postsCacheCapped,
    refreshPosts,
    removePostById,
    loadMore,
  };
}
