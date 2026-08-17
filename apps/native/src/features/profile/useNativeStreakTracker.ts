import { useEffect, useState } from "react";
import type { ProfileChartsLast20Point } from "../../../../../lib/profile/profileChartsBundle";
import { loadProfileSettledPostsForStreakScope } from "../../../../../lib/profile/profileStreakPostsCache";
import {
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "../../../../../lib/profile/profileStreakScope";

/** Web `useProfileStreakTracker` と同じ */
export const STREAK_TRACKER_LAST_N = 20;

export type StreakTrackerPointNative = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
  streakAfter: number;
};

export function useNativeStreakTracker(
  uid: string | undefined,
  enabled: boolean,
  profileStatsContext?: ProfileStatsStreakContext,
  options?: {
    /**
     * cumulative_stats.profileCharts.last20。
     * null/undefined = 未取得（posts クエリ）。配列（空含む）= 確定。
     */
    seedLast20?: ProfileChartsLast20Point[] | null;
  }
) {
  const rankingLeague = profileStatsContext?.rankingLeague ?? "nba";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const scopeKey = resolveProfileStreakScopeKey({ rankingLeague, wcStage });
  const seedLast20 = options?.seedLast20;

  const [points, setPoints] = useState<StreakTrackerPointNative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !uid) {
      setPoints([]);
      setLoading(Boolean(enabled && !uid));
      return;
    }

    if (seedLast20 != null) {
      let streak = 0;
      const out: StreakTrackerPointNative[] = [];
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

    let alive = true;

    async function run() {
      if (!uid) return;
      setLoading(true);
      try {
        const scoped = await loadProfileSettledPostsForStreakScope(
          uid,
          scopeKey,
          STREAK_TRACKER_LAST_N
        );
        scoped.sort((a, b) => a.settledAtMs - b.settledAtMs);

        let streak = 0;
        const out: StreakTrackerPointNative[] = [];
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
      } catch {
        if (alive) setPoints([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [uid, enabled, scopeKey, seedLast20]);

  return { points, loading };
}
