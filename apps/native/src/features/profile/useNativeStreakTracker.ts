import { useEffect, useState } from "react";
import { filterPostsForScope } from "../../../../../lib/profile/profileStreakPostsCompute";
import { loadProfileSettledPosts } from "../../../../../lib/profile/profileStreakPostsCache";
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
  profileStatsContext?: ProfileStatsStreakContext
) {
  const rankingLeague = profileStatsContext?.rankingLeague ?? "worldcup";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const scopeKey = resolveProfileStreakScopeKey({ rankingLeague, wcStage });

  const [points, setPoints] = useState<StreakTrackerPointNative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !uid) {
      setPoints([]);
      setLoading(Boolean(enabled && !uid));
      return;
    }

    let alive = true;

    async function run() {
      setLoading(true);
      try {
        const rows = await loadProfileSettledPosts(uid);
        const scoped = filterPostsForScope(rows, scopeKey, STREAK_TRACKER_LAST_N);
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
  }, [uid, enabled, scopeKey]);

  return { points, loading };
}
