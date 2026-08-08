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

  const loadPage = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (!uid || !league) return;
      if (!fetchEnabled) return;
      if (loadingRef.current) return;
      if (!hasMoreRef.current && !reset) return;
      if (postsLenRef.current >= RESULT_POSTS_MAX_CACHED && !reset) {
        setHasMore(false);
        hasMoreRef.current = false;
        return;
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

          const snap = await getDocs(query(collection(db, "posts"), ...base));
          if (isStale()) return;

          const list = snap.docs.map((d) =>
            mapDocToPostWithMillis(d.id, d.data())
          );
          const newLast = snap.docs.length
            ? snap.docs[snap.docs.length - 1]
            : null;
          const fullPage = snap.docs.length === pageLimit;
          const next = capPosts(list);

          setPosts(next);
          postsLenRef.current = next.length;
          setLastDoc(newLast);
          lastDocRef.current = newLast;
          const nextHasMore = fullPage && next.length < RESULT_POSTS_MAX_CACHED;
          setHasMore(nextHasMore);
          hasMoreRef.current = nextHasMore;
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
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [uid, league, fetchEnabled, capPosts]
  );

  useEffect(() => {
    if (!uid || !fetchEnabled) {
      setPosts([]);
      setLastDoc(null);
      lastDocRef.current = null;
      setHasMore(true);
      hasMoreRef.current = true;
      postsLenRef.current = 0;
      return;
    }
    void loadPage({ reset: true });
  }, [uid, language, league, fetchEnabled, loadPage]);

  const grouped = useMemo(
    () => groupPostsByResultDay(posts, language),
    [posts, language]
  );

  const postsCacheCapped = posts.length >= RESULT_POSTS_MAX_CACHED;

  const refreshPosts = useCallback(async () => {
    await loadPage({ reset: true });
  }, [loadPage]);

  const removePostById = useCallback((id: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      postsLenRef.current = next.length;
      return next;
    });
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMoreRef.current) void loadPage();
  }, [loadPage]);

  return {
    posts,
    grouped,
    loading,
    hasMore,
    postsCacheCapped,
    refreshPosts,
    removePostById,
    loadMore,
  };
}
