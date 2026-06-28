"use client";

import { useEffect, useState } from "react";
import { fetchProfileKinetikPhase } from "@/lib/profile/fetchProfileKinetikPhase";
import { computeAllScopeMetrics } from "@/lib/profile/profileStreakPostsCompute";
import { loadProfileSettledPosts } from "@/lib/profile/profileStreakPostsCache";
import {
  buildProfileKinetikMetricsSection,
  type ProfileKinetikMetricsSection,
  WC_KINETIK_STACKED_STAGES,
  type WcKinetikStackedStage,
} from "@/lib/profile/profileKinetikMetricsSection";

export function useProfileKinetikWcStackedStats(
  uid: string | null | undefined,
  enabled: boolean,
  winStreak: number,
  apiBase?: string
): {
  sections: ProfileKinetikMetricsSection[] | null;
  loading: boolean;
} {
  const [sections, setSections] = useState<ProfileKinetikMetricsSection[] | null>(
    null
  );
  const [loading, setLoading] = useState(enabled && !!uid);

  useEffect(() => {
    if (!enabled || !uid) {
      setSections(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [results, settledRows] = await Promise.all([
          Promise.all(
            WC_KINETIK_STACKED_STAGES.map((stage) =>
              fetchProfileKinetikPhase(uid, stage, apiBase)
            )
          ),
          loadProfileSettledPosts(uid).catch(() => [] as const),
        ]);
        if (cancelled) return;
        const scopedStreaks =
          settledRows.length > 0 ? computeAllScopeMetrics(settledRows) : null;
        setSections(
          WC_KINETIK_STACKED_STAGES.map((stage, index) => {
            const scopeKey =
              stage === "main" ? ("wc:main" as const) : ("wc:qualifying" as const);
            const postStreak = scopedStreaks?.[scopeKey]?.currentStreak;
            const apiStreak = results[index].summary?.activeWinStreak;
            const resolvedStreak =
              postStreak != null
                ? postStreak
                : apiStreak != null
                  ? apiStreak
                  : winStreak;
            return buildProfileKinetikMetricsSection(
              stage as WcKinetikStackedStage,
              {
                ...results[index],
                winStreak: resolvedStreak,
              }
            );
          })
        );
      } catch {
        if (!cancelled) setSections(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, enabled, uid, winStreak]);

  return { sections, loading };
}
