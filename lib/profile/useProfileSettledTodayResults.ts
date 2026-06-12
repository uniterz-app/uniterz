"use client";

import { useEffect, useMemo, useState } from "react";
import { loadProfileSettledTodayResultPosts } from "@/lib/profile/profileSettledTodayPosts";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { PostWithMillis } from "@/lib/result/result-page-data";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "@/lib/time/zonedTime";

type SettledTodayCacheEntry = {
  posts: PostWithMillis[];
  /** 取得完了後のみ true（空配列でも確定結果として扱う） */
  resolved: boolean;
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

function readResolvedPosts(key: string): PostWithMillis[] | null {
  const cached = settledTodayCache.get(key);
  if (!cached?.resolved) return null;
  return cached.posts;
}

async function loadSettledTodayOnce(
  uid: string,
  ctx: ProfileStatsStreakContext,
  key: string
): Promise<PostWithMillis[]> {
  const cached = settledTodayCache.get(key);
  if (cached?.resolved) return cached.posts;
  if (cached?.promise) return cached.promise;

  const promise = loadProfileSettledTodayResultPosts(uid, ctx).then((posts) => {
    settledTodayCache.set(key, { posts, resolved: true });
    return posts;
  });
  settledTodayCache.set(key, { posts: [], resolved: false, promise });
  return promise;
}

/** ランキング→プロフィール遷移前に今日の確定投稿を先読み */
export function prefetchProfileSettledTodayResults(
  uid: string,
  ctx: ProfileStatsStreakContext
): void {
  const safeUid = uid.trim();
  if (!safeUid) return;
  const key = settledTodayCacheKey(safeUid, ctx, todayCacheDateKey());
  if (settledTodayCache.get(key)?.resolved) return;
  void loadSettledTodayOnce(safeUid, ctx, key).catch(() => {});
}

export function useProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  enabled = true
) {
  const scopeKey = JSON.stringify(ctx);
  const dateKey = todayCacheDateKey();
  const requestKey = enabled && uid ? settledTodayCacheKey(uid, ctx, dateKey) : null;
  const resolvedPosts = requestKey ? readResolvedPosts(requestKey) : null;
  const [state, setState] = useState<{
    key: string | null;
    posts: PostWithMillis[];
    loading: boolean;
  }>(() => ({
    key: requestKey,
    posts: resolvedPosts ?? [],
    loading: Boolean(requestKey) && resolvedPosts == null,
  }));

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

    const inFlight = settledTodayCache.get(safeRequestKey)?.promise;
    if (inFlight) {
      setState((prev) => ({
        key: safeRequestKey,
        posts: prev.key === safeRequestKey ? prev.posts : [],
        loading: true,
      }));
      void inFlight.then((list) => {
        if (!alive) return;
        setState({ key: safeRequestKey, posts: list, loading: false });
      });
      return () => {
        alive = false;
      };
    }

    setState((prev) => ({
      key: safeRequestKey,
      posts: prev.key === safeRequestKey ? prev.posts : [],
      loading: true,
    }));

    void loadSettledTodayOnce(safeUid, ctx, safeRequestKey)
      .then((list) => {
        if (!alive) return;
        setState({ key: safeRequestKey, posts: list, loading: false });
      })
      .catch((e) => {
        console.error("[useProfileSettledTodayResults]", e);
        if (!alive) return;
        setState({ key: safeRequestKey, posts: [], loading: false });
        settledTodayCache.set(safeRequestKey, { posts: [], resolved: true });
      });

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
