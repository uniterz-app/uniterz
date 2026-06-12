"use client";

import { useEffect, useMemo, useState } from "react";
import { loadProfileSettledTodayResultPosts } from "@/lib/profile/profileSettledTodayPosts";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { PostWithMillis } from "@/lib/result/result-page-data";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "@/lib/time/zonedTime";

type SettledTodayCacheEntry = {
  posts: PostWithMillis[];
  promise?: Promise<PostWithMillis[]>;
};

const settledTodayCache = new Map<string, SettledTodayCacheEntry>();

function todayCacheDateKey(): string {
  return toDateKeyInTimeZone(new Date(), TIMEZONE_JST);
}

function settledTodayCacheKey(
  uid: string,
  ctx: ProfileStatsStreakContext,
  dateKey: string
): string {
  return `${dateKey}:${uid}:${JSON.stringify(ctx)}`;
}

async function loadSettledTodayOnce(
  uid: string,
  ctx: ProfileStatsStreakContext,
  key: string
): Promise<PostWithMillis[]> {
  const cached = settledTodayCache.get(key);
  if (cached?.posts) return cached.posts;
  if (cached?.promise) return cached.promise;

  const promise = loadProfileSettledTodayResultPosts(uid, ctx).then((posts) => {
    settledTodayCache.set(key, { posts });
    return posts;
  });
  settledTodayCache.set(key, { posts: [], promise });
  return promise;
}

export function useProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  enabled = true
) {
  const scopeKey = JSON.stringify(ctx);
  const dateKey = todayCacheDateKey();
  const requestKey = enabled && uid ? settledTodayCacheKey(uid, ctx, dateKey) : null;
  const cachedPosts = requestKey
    ? settledTodayCache.get(requestKey)?.posts
    : undefined;
  const [state, setState] = useState<{
    key: string | null;
    posts: PostWithMillis[];
    loading: boolean;
  }>(() => ({
    key: requestKey,
    posts: cachedPosts ?? [],
    loading: Boolean(requestKey) && cachedPosts == null,
  }));

  useEffect(() => {
    if (!requestKey || !uid) {
      setState({ key: null, posts: [], loading: false });
      return;
    }

    const cached = settledTodayCache.get(requestKey);
    if (cached?.posts) {
      setState({ key: requestKey, posts: cached.posts, loading: false });
      return;
    }

    const safeUid = uid;
    const safeRequestKey = requestKey;
    let alive = true;

    async function run() {
      setState((prev) => ({
        key: requestKey,
        posts: prev.key === requestKey ? prev.posts : [],
        loading: prev.key === requestKey && prev.posts.length > 0 ? false : true,
      }));
      try {
        const list = await loadSettledTodayOnce(safeUid, ctx, safeRequestKey);
        if (alive) setState({ key: safeRequestKey, posts: list, loading: false });
      } catch (e) {
        console.error("[useProfileSettledTodayResults]", e);
        if (alive) setState({ key: requestKey, posts: [], loading: false });
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [requestKey, scopeKey, uid]);

  return useMemo(
    () => ({
      posts: state.key === requestKey ? state.posts : [],
      loading: Boolean(requestKey) && (state.loading || state.key !== requestKey),
    }),
    [requestKey, state.key, state.loading, state.posts]
  );
}
