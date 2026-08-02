"use client";

import { useEffect, useState } from "react";
import { loadProfileSettledPostsForStreakScope } from "@/lib/profile/profileStreakPostsCache";
import {
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "@/lib/profile/profileStreakScope";
import type { ProfileChartsLast20Point } from "@/lib/profile/profileChartsBundle";

/** Last20 Tracker 用の表示件数 */
export const STREAK_TRACKER_LAST_N = 20;

export type StreakTrackerPoint = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
  /** 表示ウィンドウ内のみで再計算した連勝（正）／連敗（負） */
  streakAfter: number;
};

/**
 * 確定済み投稿をスコープで絞り、古い順に並べ替えて
 * ウィンドウ内ローカルの連勝／連敗（符号付き）を各投稿直後に付与する。
 */
export function useProfileStreakTracker(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext,
  options?: {
    /**
     * cumulative_stats.profileCharts.last20。
     * null/undefined = 未取得（posts クエリ）。配列（空含む）= 確定。
     */
    seedLast20?: ProfileChartsLast20Point[] | null;
  }
) {
  const scopeKey = resolveProfileStreakScopeKey(ctx);
  const seedLast20 = options?.seedLast20;
  const [points, setPoints] = useState<StreakTrackerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPoints([]);
      setLoading(true);
      return;
    }

    if (seedLast20 != null) {
      let streak = 0;
      const out: StreakTrackerPoint[] = [];
      for (const r of seedLast20) {
        if (r.isWin) {
          streak = streak > 0 ? streak + 1 : 1;
        } else {
          streak = streak < 0 ? streak - 1 : -1;
        }
        out.push({
          postId: r.postId,
          settledAtMs: r.settledAtMs,
          isWin: r.isWin,
          streakAfter: streak,
        });
      }
      setPoints(out);
      setLoading(false);
      return;
    }

    const safeUid = uid;
    let alive = true;

    async function run() {
      setLoading(true);
      try {
        const scoped = await loadProfileSettledPostsForStreakScope(
          safeUid,
          scopeKey,
          STREAK_TRACKER_LAST_N
        );
        scoped.sort((a, b) => a.settledAtMs - b.settledAtMs);

        let streak = 0;
        const out: StreakTrackerPoint[] = [];
        for (const r of scoped) {
          if (r.isWin) {
            streak = streak > 0 ? streak + 1 : 1;
          } else {
            streak = streak < 0 ? streak - 1 : -1;
          }
          out.push({
            postId: r.postId,
            settledAtMs: r.settledAtMs,
            isWin: r.isWin,
            streakAfter: streak,
          });
        }

        if (alive) setPoints(out);
      } catch (e) {
        console.error("[useProfileStreakTracker]", e);
        if (alive) setPoints([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [uid, scopeKey, seedLast20]);

  return { points, loading };
}
