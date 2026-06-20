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
      if (!hasMore && !reset) return;
      if (posts.length >= RESULT_POSTS_MAX_CACHED && !reset) {
        setHasMore(false);
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      try {
        const pageLimit = RESULT_NEXT_PAGE_SIZE;
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
          setLastDoc(newLast);
          setHasMore(fullPage && next.length < RESULT_POSTS_MAX_CACHED);
          return;
        }

        if (!lastDoc) return;

        const q = query(collection(db, "posts"), ...base, startAfter(lastDoc));
        const snap = await getDocs(q);

        const list = snap.docs.map((d) => mapDocToPostWithMillis(d.id, d.data()));

        const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

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
          return next;
        });

        setLastDoc(newLast);
        const cappedAfterLoad = nextPostsLength >= RESULT_POSTS_MAX_CACHED;
        const fullPage = snap.docs.length === pageLimit;
        setHasMore(!cappedAfterLoad && fullPage);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [uid, league, fetchEnabled, hasMore, lastDoc, posts.length, capPosts]
  );

  useEffect(() => {
    if (!uid || !fetchEnabled) {
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
      return;
    }
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, language, league, fetchEnabled]);

  const grouped = useMemo(
    () => groupPostsByResultDay(posts, language),
    [posts, language]
  );

  const postsCacheCapped = posts.length >= RESULT_POSTS_MAX_CACHED;

  const refreshPosts = useCallback(async () => {
    await loadPage({ reset: true });
  }, [loadPage]);

  const removePostById = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) void loadPage();
  }, [loadPage, hasMore]);

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
