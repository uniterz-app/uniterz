"use client";

import { useEffect, useMemo, useState } from "react";
import { loadProfileSettledTodayResultPosts } from "@/lib/profile/profileSettledTodayPosts";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { PostWithMillis } from "@/lib/result/result-page-data";

export function useProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  enabled = true
) {
  const scopeKey = JSON.stringify(ctx);
  const requestKey = enabled && uid ? `${uid}:${scopeKey}` : null;
  const [state, setState] = useState<{
    key: string | null;
    posts: PostWithMillis[];
    loading: boolean;
  }>(() => ({
    key: requestKey,
    posts: [],
    loading: Boolean(requestKey),
  }));

  useEffect(() => {
    if (!requestKey || !uid) {
      setState({ key: null, posts: [], loading: false });
      return;
    }

    const safeUid = uid;
    let alive = true;

    async function run() {
      setState((prev) => ({
        key: requestKey,
        posts: prev.key === requestKey ? prev.posts : [],
        loading: true,
      }));
      try {
        const list = await loadProfileSettledTodayResultPosts(safeUid, ctx);
        if (alive) setState({ key: requestKey, posts: list, loading: false });
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
