"use client";

import { useEffect, useMemo, useState } from "react";
import { withTimeout } from "@/lib/async/withTimeout";
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
const SETTLED_TODAY_TIMEOUT_MS = 15_000;

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

function markSettledTodayFailed(key: string): PostWithMillis[] {
  const empty: PostWithMillis[] = [];
  settledTodayCache.set(key, { posts: empty, resolved: true });
  return empty;
}

async function loadSettledTodayOnce(
  uid: string,
  ctx: ProfileStatsStreakContext,
  key: string
): Promise<PostWithMillis[]> {
  const cached = settledTodayCache.get(key);
  if (cached?.resolved) return cached.posts;
  if (cached?.promise) return cached.promise;

  const promise = withTimeout(
    loadProfileSettledTodayResultPosts(uid, ctx),
    SETTLED_TODAY_TIMEOUT_MS,
    "settled-today-timeout"
  )
    .then((posts) => {
      settledTodayCache.set(key, { posts, resolved: true });
      return posts;
    })
    .catch((err) => {
      console.error("[useProfileSettledTodayResults]", err);
      return markSettledTodayFailed(key);
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
  void loadSettledTodayOnce(safeUid, ctx, key);
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
      .catch(() => {
        if (!alive) return;
        setState({
          key: safeRequestKey,
          posts: markSettledTodayFailed(safeRequestKey),
          loading: false,
        });
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
