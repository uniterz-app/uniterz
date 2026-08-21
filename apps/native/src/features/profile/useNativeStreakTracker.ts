import { useEffect, useState } from "react";
import type { ProfileChartsLast20Point } from "../../../../../lib/profile/profileChartsBundle";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { streakTrackerPointsFromLast20 } from "../../../../../lib/profile/streakTrackerChartLayout";

/** Web `useProfileStreakTracker` と同じ */
export const STREAK_TRACKER_LAST_N = 20;

export type StreakTrackerPointNative = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
  streakAfter: number;
};

/**
 * cumulative_stats.profileCharts.last20 だけを見る。
 * posts には行かない。未書き込みは unavailable。
 *
 * seedLast20:
 * - undefined = 親がまだロード中
 * - null = ロード済みだが last20 が無い
 * - 配列（空含む）= 保存済み
 */
export function useNativeStreakTracker(
  uid: string | undefined,
  enabled: boolean,
  _profileStatsContext?: ProfileStatsStreakContext,
  options?: {
    seedLast20?: ProfileChartsLast20Point[] | null;
  }
) {
  const seedLast20 = options?.seedLast20;

  const [points, setPoints] = useState<StreakTrackerPointNative[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled || !uid) {
      setPoints([]);
      setUnavailable(false);
      setLoading(Boolean(enabled && !uid));
      return;
    }

    if (seedLast20 === undefined) {
      setPoints([]);
      setUnavailable(false);
      setLoading(true);
      return;
    }

    if (seedLast20 === null) {
      setPoints([]);
      setUnavailable(true);
      setLoading(false);
      return;
    }

    setPoints(streakTrackerPointsFromLast20(seedLast20));
    setUnavailable(false);
    setLoading(false);
  }, [uid, enabled, seedLast20]);

  return { points, loading, unavailable };
}
