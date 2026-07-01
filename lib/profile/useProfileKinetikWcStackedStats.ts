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

const WC_STACKED_STATS_CACHE_TTL_MS = 5 * 60 * 1000;
const wcStackedStatsCache = new Map<
  string,
  { at: number; sections: ProfileKinetikMetricsSection[] }
>();

function readWcStackedStatsCache(
  uid: string
): ProfileKinetikMetricsSection[] | null {
  const hit = wcStackedStatsCache.get(uid);
  if (!hit || Date.now() - hit.at > WC_STACKED_STATS_CACHE_TTL_MS) return null;
  return hit.sections;
}

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
    () => (enabled && uid ? readWcStackedStatsCache(uid) : null)
  );
  const [loading, setLoading] = useState(() => {
    if (!enabled || !uid) return false;
    return readWcStackedStatsCache(uid) == null;
  });

  useEffect(() => {
    if (!enabled || !uid) {
      setLoading(false);
      return;
    }

    const cached = readWcStackedStatsCache(uid);
    if (cached) {
      setSections(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;

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
        const built = WC_KINETIK_STACKED_STAGES.map((stage, index) => {
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
          return buildProfileKinetikMetricsSection(stage as WcKinetikStackedStage, {
            ...results[index],
            winStreak: resolvedStreak,
          });
        });
        wcStackedStatsCache.set(uid, { at: Date.now(), sections: built });
        setSections(built);
      } catch {
        if (!cancelled && !cached) setSections(null);
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
