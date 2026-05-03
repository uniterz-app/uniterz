import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "./nativeResultModel";

export function useNativeResultPosts(uid: string | null | undefined, language: "ja" | "en") {
  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (!uid) return;
      if (loading) return;
      if (!hasMore && !reset) return;
      if (posts.length >= RESULT_POSTS_MAX_CACHED && !reset) {
        setHasMore(false);
        return;
      }

      setLoading(true);
      try {
        if (!reset && !lastDoc) return;
        const pageLimit = reset ? RESULT_INITIAL_PAGE_SIZE : RESULT_NEXT_PAGE_SIZE;
        const base = [
          where("authorUid", "==", uid),
          orderBy("createdAt", "desc"),
          limit(pageLimit),
        ] as const;

        const q = reset
          ? query(collection(db, "posts"), ...base)
          : lastDoc
            ? query(collection(db, "posts"), ...base, startAfter(lastDoc))
            : query(collection(db, "posts"), ...base);

        const snap = await getDocs(q);

        const list = snap.docs.map((d) => mapDocToPostWithMillis(d.id, d.data()));

        const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;

        let nextPostsLength = 0;
        setPosts((prev) => {
          if (reset) {
            const next =
              list.length > RESULT_POSTS_MAX_CACHED
                ? list.slice(0, RESULT_POSTS_MAX_CACHED)
                : list;
            nextPostsLength = next.length;
            return next;
          }
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
        const fullPage =
          snap.docs.length === (reset ? RESULT_INITIAL_PAGE_SIZE : RESULT_NEXT_PAGE_SIZE);
        setHasMore(!cappedAfterLoad && fullPage);
      } finally {
        setLoading(false);
      }
    },
    [uid, loading, hasMore, lastDoc, posts.length]
  );

  useEffect(() => {
    if (!uid) {
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
      return;
    }
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

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
    if (!loading && hasMore) void loadPage();
  }, [loadPage, loading, hasMore]);

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
