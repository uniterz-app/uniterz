import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  groupPostsByResultDay,
  mapDocToPostWithMillis,
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
} from "@/lib/result/resultPostsListCache";

export function useNativeResultPosts(
  uid: string | null | undefined,
  language: "ja" | "en",
  options?: {
    league: ResultListLeagueTab | null;
    enabled?: boolean;
  }
) {
  const league = options?.league ?? null;
  const fetchEnabled = options?.enabled !== false && league !== null;

  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  /** 初回（またはリーグ切替後）の reset 取得が1回完了するまで NO DATA を出さない */
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const resetGenRef = useRef(0);
  const loadingRef = useRef(false);
  /** loadPage を安定させ、focus 効果の無限再取得を防ぐ */
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const hasMoreRef = useRef(true);
  const postsLenRef = useRef(0);
  lastDocRef.current = lastDoc;
  hasMoreRef.current = hasMore;
  postsLenRef.current = posts.length;

  const capPosts = useCallback((list: PostWithMillis[]) => {
    return list.length > RESULT_POSTS_MAX_CACHED
      ? list.slice(0, RESULT_POSTS_MAX_CACHED)
      : list;
  }, []);

  const applyListEntry = useCallback((entry: ResultPostsListCacheEntry) => {
    setPosts(entry.posts);
    postsLenRef.current = entry.posts.length;
    setLastDoc(entry.lastDoc);
    lastDocRef.current = entry.lastDoc;
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
          applyListEntry(cached);
          setLoading(false);
          return;
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
        const base = [
          where("authorUid", "==", uid),
          where("league", "==", league),
          orderBy("createdAt", "desc"),
          limit(pageLimit),
        ] as const;

        if (reset) {
          const gen = ++resetGenRef.current;
          const isStale = () => gen !== resetGenRef.current;

          const fetchPromise = (async (): Promise<ResultPostsListCacheEntry | null> => {
            const snap = await getDocs(query(collection(db, "posts"), ...base));
            if (isStale()) return null;
            const list = snap.docs.map((d) =>
              mapDocToPostWithMillis(d.id, d.data())
            );
            const newLast = snap.docs.length
              ? snap.docs[snap.docs.length - 1]
              : null;
            const fullPage = snap.docs.length === pageLimit;
            const next = capPosts(list);
            const nextHasMore =
              fullPage && next.length < RESULT_POSTS_MAX_CACHED;
            const entry: ResultPostsListCacheEntry = {
              at: Date.now(),
              posts: next,
              hasMore: nextHasMore,
              lastDoc: newLast,
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

        const cursor = lastDocRef.current;
        if (!cursor) return;

        const q = query(collection(db, "posts"), ...base, startAfter(cursor));
        const snap = await getDocs(q);

        const list = snap.docs.map((d) =>
          mapDocToPostWithMillis(d.id, d.data())
        );

        const newLast = snap.docs.length
          ? snap.docs[snap.docs.length - 1]
          : null;

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

        setLastDoc(newLast);
        lastDocRef.current = newLast;
        const cappedAfterLoad = nextPostsLength >= RESULT_POSTS_MAX_CACHED;
        const fullPage = snap.docs.length === pageLimit;
        const nextHasMore = !cappedAfterLoad && fullPage;
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
      setLastDoc(null);
      lastDocRef.current = null;
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
      setLoading(false);
      return;
    }
    setHasFetchedOnce(false);
    setLoading(true);
    void loadPage({ reset: true });
  }, [uid, language, league, fetchEnabled, loadPage, applyListEntry]);

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
              lastDoc: cached.lastDoc,
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
