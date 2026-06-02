"use client";

import { useEffect, useState } from "react";
import { loadProfileSettledTodayResultPosts } from "@/lib/profile/profileSettledTodayPosts";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { PostWithMillis } from "@/lib/result/result-page-data";

export function useProfileSettledTodayResults(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  enabled = true
) {
  const [posts, setPosts] = useState<PostWithMillis[]>([]);
  const [loading, setLoading] = useState(enabled && !!uid);

  const scopeKey = JSON.stringify(ctx);

  useEffect(() => {
    if (!enabled || !uid) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const safeUid = uid;
    let alive = true;

    async function run() {
      setLoading(true);
      try {
        const list = await loadProfileSettledTodayResultPosts(safeUid, ctx);
        if (alive) setPosts(list);
      } catch (e) {
        console.error("[useProfileSettledTodayResults]", e);
        if (alive) setPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [enabled, scopeKey, uid]);

  return { posts, loading };
}
