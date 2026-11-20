/**
 * Web `useProfileSettledTodayResults` 相当。
 */
import { useEffect, useMemo, useState } from "react";
import { withTimeout } from "../../../../../lib/async/withTimeout";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { peekLatestNbaSlateDateKey } from "../../../../../lib/games/latestNbaSlate";
import { useLatestNbaSlateDateKey } from "../../../../../lib/games/useLatestNbaSlateDateKey";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { loadProfileSettledTodayResultPostsNative } from "./loadProfileSettledTodayNative";
import type { PostWithMillis } from "../results/nativeResultModel";

type SettledTodayCacheEntry = {
  posts: PostWithMillis[];
  resolved: boolean;
  fetchedAtMs?: number;
  promise?: Promise<PostWithMillis[]>;
};

const settledTodayCache = new Map<string, SettledTodayCacheEntry>();
const SETTLED_TODAY_TIMEOUT_MS = 15_000;
/** 試合日のあいだも予想は順に確定していくので、取り直すまでの時間 */
const SETTLED_TODAY_TTL_MS = 3 * 60_000;

function isFresh(entry: SettledTodayCacheEntry | undefined): boolean {
  return (
    entry?.resolved === true &&
    entry.fetchedAtMs != null &&
    Date.now() - entry.fetchedAtMs < SETTLED_TODAY_TTL_MS
  );
}

/** プロフィール Overview は NBA のみ */
export const NATIVE_PROFILE_SETTLED_TODAY_CTX: ProfileStatsStreakContext = {
  rankingLeague: "nba",
};


function settledTodayCacheKey(
  uid: string,
  ctx: ProfileStatsStreakContext,
  dateKey: string
): string {
  return `${dateKey}:${uid}:${JSON.stringify(ctx)}`;
}

function readResolvedPosts(key: string): PostWithMillis[] | null {
  const cached = settledTodayCache.get(key);
  if (!isFresh(cached)) return null;
  return cached!.posts;
}

/** 前回の成功結果（期限切れでも）。取り直し中・失敗時に空にしないため */
function readStalePosts(key: string): PostWithMillis[] {
  const cached = settledTodayCache.get(key);
  return cached?.resolved ? cached.posts : [];
}

async function loadSettledTodayOnce(
  uid: string,
  ctx: ProfileStatsStreakContext,
  slateDateKey: string,
  key: string
): Promise<PostWithMillis[]> {
  const cached = settledTodayCache.get(key);
  if (isFresh(cached)) return cached!.posts;
  if (cached?.promise) return cached.promise;

  const promise = withTimeout(
    loadProfileSettledTodayResultPostsNative(uid, ctx, slateDateKey),
    SETTLED_TODAY_TIMEOUT_MS,
    "settled-today-timeout"
  )
    .then((posts) => {
      settledTodayCache.set(key, {
        posts,
        resolved: true,
        fetchedAtMs: Date.now(),
      });
      return posts;
    })
    .catch((err) => {
      console.warn("[useNativeProfileSettledTodayResults]", err);
      const prev = settledTodayCache.get(key);
      const posts = prev?.resolved ? prev.posts : [];
      if (prev?.resolved) {
        settledTodayCache.set(key, { ...prev, promise: undefined });
      } else {
        settledTodayCache.delete(key);
      }
      return posts;
    });

  settledTodayCache.set(key, {
    posts: cached?.posts ?? [],
    resolved: cached?.resolved ?? false,
    fetchedAtMs: cached?.fetchedAtMs,
    promise,
  });
  return promise;
}

/** ランキング→プロフィール / idle 先読み。同一キーは inflight 共有（追加 read なし） */
export function prefetchNativeProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext = NATIVE_PROFILE_SETTLED_TODAY_CTX
): void {
  const safeUid = typeof uid === "string" ? uid.trim() : "";
  if (!safeUid) return;
  const slateDateKey = peekLatestNbaSlateDateKey(getUniterzApiBaseUrl());
  const key = settledTodayCacheKey(safeUid, ctx, slateDateKey);
  if (isFresh(settledTodayCache.get(key))) return;
  void loadSettledTodayOnce(safeUid, ctx, slateDateKey, key);
}

export function useNativeProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  enabled = true
) {
  const scopeKey = JSON.stringify(ctx);
  const dateKey = useLatestNbaSlateDateKey(getUniterzApiBaseUrl());
  const requestKey =
    enabled && uid ? settledTodayCacheKey(uid, ctx, dateKey) : null;
  const resolvedPosts = requestKey ? readResolvedPosts(requestKey) : null;
  const [state, setState] = useState<{
    key: string | null;
    posts: PostWithMillis[];
    loading: boolean;
  }>(() => {
    const hasPrior =
      requestKey != null && settledTodayCache.get(requestKey)?.resolved === true;
    return {
      key: requestKey,
      posts: resolvedPosts ?? (requestKey ? readStalePosts(requestKey) : []),
      loading: Boolean(requestKey) && resolvedPosts == null && !hasPrior,
    };
  });

  useEffect(() => {
    if (!requestKey || !uid) {
      setState({ key: null, posts: [], loading: false });
      return;
    }

    const safeUid = uid;
    const safeRequestKey = requestKey;
    let alive = true;

    const resolved = readResolvedPosts(safeRequestKey);
    if (resolved != null) {
      setState({ key: safeRequestKey, posts: resolved, loading: false });
      return;
    }

    const stale = readStalePosts(safeRequestKey);
    setState((prev) => ({
      key: safeRequestKey,
      posts: prev.key === safeRequestKey ? prev.posts : stale,
      loading: stale.length === 0 && !settledTodayCache.get(safeRequestKey)?.resolved,
    }));

    void loadSettledTodayOnce(safeUid, ctx, dateKey, safeRequestKey)
      .then((list) => {
        if (!alive) return;
        setState({ key: safeRequestKey, posts: list, loading: false });
      })
      .catch(() => {
        if (!alive) return;
        setState({
          key: safeRequestKey,
          posts: readStalePosts(safeRequestKey),
          loading: false,
        });
      });

    return () => {
      alive = false;
    };
  }, [requestKey, scopeKey, uid, ctx, dateKey]);

  return useMemo(
    () => ({
      slateDateKey: dateKey,
      posts: state.key === requestKey ? state.posts : [],
      loading:
        Boolean(requestKey) &&
        (state.loading || state.key !== requestKey),
    }),
    [dateKey, requestKey, state.key, state.loading, state.posts]
  );
}
