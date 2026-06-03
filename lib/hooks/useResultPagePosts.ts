"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
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
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useResultLeagueFlags } from "@/lib/hooks/useResultLeagueFlags";
import {
  groupPostsByResultDay,
  mapDocToPostWithMillis,
  RESULT_POSTS_MAX_CACHED,
  RESULT_TAB_PAGE_SIZE,
  type PostWithMillis,
  type ResultDayGroup,
  type ResultListLeagueTab,
} from "@/lib/result/result-page-data";

export function useResultPagePosts(
  league: ResultListLeagueTab,
  options?: {
    enabled?: boolean;
    /** true: users の hasNbaPost/hasWcPost 読み込み後に一覧取得を開始 */
    waitForLeagueFlags?: boolean;
  }
): {
  uid: string | null;
  authReady: boolean;
  language: ReturnType<typeof useUserLanguage>["language"];
  posts: PostWithMillis[];
  loading: boolean;
  hasMore: boolean;
  /** メモリ上限により古い投稿が捨てられている（再スクロールで再取得はされない） */
  postsCacheCapped: boolean;
  setInfiniteScrollEnabled: (enabled: boolean) => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  grouped: ResultDayGroup[];
  refreshPosts: () => Promise<void>;
  flagsReady: boolean;
  showResultLeagueTabs: boolean;
  defaultLeagueTab: ResultListLeagueTab;
} {
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const { language } = useUserLanguage(uid);

  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);

  const {
    flagsReady,
    showResultLeagueTabs,
    defaultLeagueTab,
  } = useResultLeagueFlags(uid);

  const fetchEnabled =
    options?.enabled !== false &&
    (!options?.waitForLeagueFlags || flagsReady);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !fetchEnabled) return;
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
  }, [authReady, uid, league, fetchEnabled]);

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
        const pageLimit = RESULT_TAB_PAGE_SIZE;
        const base = [
          where("authorUid", "==", uid),
          where("league", "==", league),
          orderBy("createdAt", "desc"),
          limit(pageLimit),
        ] as const;

        const q = reset
          ? query(collection(db, "posts"), ...base)
          : lastDoc
            ? query(collection(db, "posts"), ...base, startAfter(lastDoc))
            : query(collection(db, "posts"), ...base);

        const snap = await getDocs(q);

        const list = snap.docs.map((d) =>
          mapDocToPostWithMillis(d.id, d.data())
        );

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
        const fullPage = snap.docs.length === pageLimit;
        setHasMore(!cappedAfterLoad && fullPage);
      } finally {
        setLoading(false);
      }
    },
    [uid, loading, hasMore, lastDoc, posts.length, league]
  );

  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled) return;
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid, league, fetchEnabled]);

  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled) return;
    if (!infiniteScrollEnabled) return;
    if (!sentinelRef.current) return;

    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (loading) return;
        if (!hasMore) return;
        void loadPage();
      },
      { root: null, rootMargin: "240px 0px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authReady,
    uid,
    league,
    fetchEnabled,
    loading,
    hasMore,
    lastDoc,
    infiniteScrollEnabled,
    loadPage,
  ]);

  const grouped = useMemo(
    () => groupPostsByResultDay(posts, language),
    [posts, language]
  );

  const postsCacheCapped = posts.length >= RESULT_POSTS_MAX_CACHED;

  const refreshPosts = useCallback(async () => {
    await loadPage({ reset: true });
  }, [loadPage]);

  return {
    uid,
    authReady,
    language,
    posts,
    loading,
    hasMore,
    postsCacheCapped,
    setInfiniteScrollEnabled,
    sentinelRef,
    grouped,
    refreshPosts,
    flagsReady,
    showResultLeagueTabs,
    defaultLeagueTab,
  };
}
