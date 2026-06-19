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

const RESULT_LIST_INITIAL_MAX_DAY_GROUPS = 5;

type NativeResultListPageFetchResult = {
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  fullPage: boolean;
};

function flattenNativeResultDayGroups(
  groups: ReturnType<typeof groupPostsByResultDay>
): PostWithMillis[] {
  const out: PostWithMillis[] = [];
  for (const day of groups) {
    for (const p of day.pending) out.push(p);
    for (const p of day.final) out.push(p);
  }
  return out;
}

function trimNativePostsToMaxDayGroups(
  posts: readonly PostWithMillis[],
  language: "ja" | "en",
  maxDayGroups: number
): { posts: PostWithMillis[]; trimmed: boolean } {
  const groups = groupPostsByResultDay([...posts], language);
  if (groups.length <= maxDayGroups) return { posts: [...posts], trimmed: false };
  return {
    posts: flattenNativeResultDayGroups(groups.slice(0, maxDayGroups)),
    trimmed: true,
  };
}

async function fetchInitialNativeResultPostsByDayWindow(opts: {
  language: "ja" | "en";
  fetchPage: (cursor: DocumentSnapshot | null) => Promise<NativeResultListPageFetchResult>;
  mergePosts: (primary: PostWithMillis[], extra: PostWithMillis[]) => PostWithMillis[];
  maxDayGroups?: number;
}): Promise<{
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  const maxDay = opts.maxDayGroups ?? RESULT_LIST_INITIAL_MAX_DAY_GROUPS;
  let accumulated: PostWithMillis[] = [];
  let lastDoc: DocumentSnapshot | null = null;
  let lastFullPage = false;

  while (true) {
    const page = await opts.fetchPage(lastDoc);
    lastDoc = page.lastDoc;
    lastFullPage = page.fullPage;
    accumulated = opts.mergePosts(accumulated, page.posts);

    const dayCount = groupPostsByResultDay(accumulated, opts.language).length;
    if (dayCount >= maxDay) break;
    if (!page.fullPage) break;
  }

  const { posts, trimmed } = trimNativePostsToMaxDayGroups(
    accumulated,
    opts.language,
    maxDay
  );
  return {
    posts,
    lastDoc,
    hasMore: trimmed || lastFullPage,
  };
}

function mergePostsById(primary: PostWithMillis[], extra: PostWithMillis[]) {
  if (extra.length === 0) return primary;
  const seen = new Set(primary.map((p) => p.id));
  const merged = [...primary];
  for (const p of extra) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  merged.sort((a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0));
  return merged;
}

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
        const pageLimit = reset ? RESULT_INITIAL_PAGE_SIZE : RESULT_NEXT_PAGE_SIZE;
        const base = [
          where("authorUid", "==", uid),
          orderBy("createdAt", "desc"),
          limit(pageLimit),
        ] as const;

        if (reset) {
          const fetchPage = async (cursor: DocumentSnapshot | null) => {
            const q = cursor
              ? query(collection(db, "posts"), ...base, startAfter(cursor))
              : query(collection(db, "posts"), ...base);
            const snap = await getDocs(q);
            const list = snap.docs.map((d) =>
              mapDocToPostWithMillis(d.id, d.data())
            );
            return {
              posts: list,
              lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
              fullPage: snap.docs.length === pageLimit,
            };
          };

          const initial = await fetchInitialNativeResultPostsByDayWindow({
            language,
            fetchPage,
            mergePosts: mergePostsById,
          });

          const next =
            initial.posts.length > RESULT_POSTS_MAX_CACHED
              ? initial.posts.slice(0, RESULT_POSTS_MAX_CACHED)
              : initial.posts;

          setPosts(next);
          setLastDoc(initial.lastDoc);
          setHasMore(
            initial.hasMore && next.length < RESULT_POSTS_MAX_CACHED
          );
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
        setLoading(false);
      }
    },
    [uid, loading, hasMore, lastDoc, posts.length, language]
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
  }, [uid, language]);

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
