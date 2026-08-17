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
  isFinalResultPost,
  RESULT_POSTS_MAX_CACHED,
  RESULT_INITIAL_PAGE_SIZE,
  RESULT_NEXT_PAGE_SIZE,
  type PostWithMillis,
  type ResultDayGroup,
  type ResultListLeagueTab,
} from "@/lib/result/result-page-data";
import { normalizeLeague, resolvePostListLeague } from "@/lib/leagues";
import {
  clearResultPostsListInflight,
  getResultPostsListInflight,
  invalidateResultPostsListCache,
  peekResultPostsListCache,
  setResultPostsListCache,
  setResultPostsListInflight,
  type ResultPostsListCacheEntry,
} from "@/lib/result/resultPostsListCache";

export function useResultPagePosts(
  league: ResultListLeagueTab,
  options: {
    enabled?: boolean;
    /** true: users の hasNbaPost/hasWcPost 読み込み後に一覧取得を開始 */
    waitForLeagueFlags?: boolean;
  } = {}
): {
  uid: string | null;
  authReady: boolean;
  language: ReturnType<typeof useUserLanguage>["language"];
  posts: PostWithMillis[];
  loading: boolean;
  /** 初回／リーグ切替後の一覧取得が1回完了したか（未完了時は NO DATA を出さない） */
  hasFetchedOnce: boolean;
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
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
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
  const resetGenRef = useRef(0);
  const loadingRef = useRef(false);

  /** Firestore の league 誤保存でタブ別クエリから漏れた投稿を補完する */
  const fetchLeagueOrphanPosts = useCallback(
    async (authorUid: string, tab: ResultListLeagueTab): Promise<PostWithMillis[]> => {
      const snap = await getDocs(
        query(
          collection(db, "posts"),
          where("authorUid", "==", authorUid),
          where("schemaVersion", "==", 2),
          orderBy("createdAt", "desc"),
          limit(RESULT_INITIAL_PAGE_SIZE)
        )
      );
      return snap.docs
        .map((d) => mapDocToPostWithMillis(d.id, d.data()))
        .filter((p) => {
          const resolved = resolvePostListLeague(p);
          if (resolved !== tab) return false;
          return normalizeLeague(p.league) !== tab;
        });
    },
    []
  );

  const mergePostsById = useCallback(
    (primary: PostWithMillis[], extra: PostWithMillis[]) => {
      if (extra.length === 0) return primary;
      const seen = new Set(primary.map((p) => p.id));
      const merged = [...primary];
      for (const p of extra) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        merged.push(p);
      }
      merged.sort(
        (a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0)
      );
      return merged;
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !fetchEnabled) {
      setHasFetchedOnce(false);
      return;
    }
    if (uid) {
      const cached = peekResultPostsListCache(uid, league);
      if (cached) {
        setPosts(cached.posts);
        setLastDoc(cached.lastDoc);
        setHasMore(cached.hasMore);
        setHasFetchedOnce(true);
        setLoading(false);
        return;
      }
    }
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setHasFetchedOnce(false);
    setLoading(true);
  }, [authReady, uid, league, fetchEnabled]);

  const capPosts = useCallback((list: PostWithMillis[]) => {
    return list.length > RESULT_POSTS_MAX_CACHED
      ? list.slice(0, RESULT_POSTS_MAX_CACHED)
      : list;
  }, []);

  const applyListEntry = useCallback((entry: ResultPostsListCacheEntry) => {
    setPosts(entry.posts);
    setLastDoc(entry.lastDoc);
    setHasMore(entry.hasMore);
    setHasFetchedOnce(true);
  }, []);

  const loadPage = useCallback(
    async ({
      reset = false,
      force = false,
    }: { reset?: boolean; force?: boolean } = {}) => {
      if (!uid) return;
      if (!fetchEnabled) return;
      if (loadingRef.current) return;
      if (!hasMore && !reset) return;
      if (posts.length >= RESULT_POSTS_MAX_CACHED && !reset) {
        setHasMore(false);
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
          loadingRef.current = true;
          setLoading(true);
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

          void fetchLeagueOrphanPosts(uid, league).then((orphans) => {
            if (isStale() || orphans.length === 0) return;
            setPosts((prev) => {
              const merged = capPosts(mergePostsById(prev, orphans));
              setResultPostsListCache(uid, league, {
                posts: merged,
                hasMore: entry.hasMore,
                lastDoc: entry.lastDoc,
              });
              return merged;
            });
          });

          return;
        }

        if (!lastDoc) return;

        const q = query(collection(db, "posts"), ...base, startAfter(lastDoc));

        const snap = await getDocs(q);

        const list = snap.docs.map((d) =>
          mapDocToPostWithMillis(d.id, d.data())
        );

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
      } catch {
        if (reset) setHasFetchedOnce(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [
      uid,
      hasMore,
      lastDoc,
      posts.length,
      league,
      fetchEnabled,
      fetchLeagueOrphanPosts,
      mergePostsById,
      capPosts,
      applyListEntry,
    ]
  );

  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled) return;
    void loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid, league, fetchEnabled]);

  /** タブ復帰時に再取得（連続切替の空振りを抑える） */
  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled) return;
    if (typeof document === "undefined") return;
    let lastAt = 0;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastAt < 30_000) return;
      lastAt = now;
      void loadPage({ reset: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid, league, fetchEnabled]);

  const hasPendingSettlement = useMemo(
    () => posts.some((p) => !isFinalResultPost(p)),
    [posts]
  );

  /** 未精算カードがある間は定期再取得（非表示タブは止める） */
  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled || !hasPendingSettlement) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void loadPage({ reset: true });
    };
    const id = setInterval(tick, 120_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid, league, fetchEnabled, hasPendingSettlement]);

  useEffect(() => {
    if (!authReady || !uid || !fetchEnabled) return;
    if (!infiniteScrollEnabled) return;
    if (!sentinelRef.current) return;

    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (loadingRef.current) return;
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

  const refreshPosts = useCallback(
    async (opts?: { force?: boolean }) => {
      await loadPage({ reset: true, force: opts?.force === true });
    },
    [loadPage]
  );

  return {
    uid,
    authReady,
    language,
    posts,
    loading,
    hasFetchedOnce,
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
