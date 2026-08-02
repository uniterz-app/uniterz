// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2";

import type { SummaryForCardsV2, SummaryRanksV2 } from "./useUserStatsV2";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import type { ProfileChartsLast20Point } from "@/lib/profile/profileChartsBundle";
import { useProfileScopedStreak } from "@/lib/profile/useProfileScopedStreak";
import { useNbaProfileOverviewClient } from "@/lib/profile/useNbaProfileOverviewClient";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";

type Props = { handle: string; variant?: "web" | "mobile" };

const NBA_PROFILE_STATS_CONTEXT: ProfileStatsStreakContext = {
  rankingLeague: "nba",
};

export default function ProfilePageBaseV2({ handle, variant = "web" }: Props) {
  const {
    profile,
    loading,
    targetUid,
  } = useProfile(handle);

  const [tab, setTab] = useState<"overview" | "stats" | "bracket">(
    "overview"
  );

  const profileStatsContext = NBA_PROFILE_STATS_CONTEXT;

  /** Native と同じ: cumulative_stats 1 read（カード + overview charts） */
  const overview = useNbaProfileOverviewClient(targetUid, {
    enabled: !!targetUid,
  });

  const scopedStreak = useProfileScopedStreak(targetUid, profileStatsContext);

  const effectiveStreak = useMemo(
    () => ({
      currentStreak: Math.max(0, Math.floor(scopedStreak.currentStreak)),
      maxWinStreak: Math.max(0, Math.floor(scopedStreak.maxWinStreak)),
    }),
    [scopedStreak.currentStreak, scopedStreak.maxWinStreak]
  );

  const normalizedProfile = useMemo<Profile | undefined>(() => {
    if (!profile) return undefined;

    const p = profile as Profile & { photoURL?: string | null };
    const merged =
      (p.photoURL && p.photoURL.trim().length > 0
        ? p.photoURL
        : p.avatarUrl) ?? "";

    return { ...p, avatarUrl: merged };
  }, [profile]);

  const mergedProfile = useMemo<Profile | null>(() => {
    if (!normalizedProfile) return null;

    return {
      ...normalizedProfile,
      currentStreak: effectiveStreak.currentStreak,
      maxStreak: effectiveStreak.maxWinStreak,
    };
  }, [
    normalizedProfile,
    effectiveStreak.currentStreak,
    effectiveStreak.maxWinStreak,
  ]);

  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    if (!overview.summary) return undefined;
    return {
      ...(overview.summary as SummaryForCardsV2),
      activeWinStreak: effectiveStreak.currentStreak,
    };
  }, [overview.summary, effectiveStreak.currentStreak]);

  const summaryRanksV2: SummaryRanksV2 | undefined = useMemo(() => {
    if (!overview.summaryRanks) return undefined;
    return overview.summaryRanks as SummaryRanksV2;
  }, [overview.summaryRanks]);

  if (loading && !targetUid) {
    return (
      <div className="flex justify-center" style={{ padding: 24 }}>
        <CandleChartLoader />
      </div>
    );
  }
  if (!loading && !targetUid) {
    return <div style={{ padding: 24 }}>Not found</div>;
  }
  if (!mergedProfile) {
    return (
      <div className="flex justify-center" style={{ padding: 24 }}>
        <CandleChartLoader />
      </div>
    );
  }

  const viewProps: ProfileViewPropsV2 = {
    profile: mergedProfile,
    tab,
    setTab,
    summary: summaryV2,
    summaryRanks: summaryRanksV2,
    metricValueDeltas: undefined,
    statsLoading: overview.loading,
    targetUid,
    profileDailyTrendSeed: overview.dailyTrend,
    profileDailyTrendSeedComplete: !overview.loading,
    profileRankTrendSeed: overview.rankTrend,
    profileRankTrendSeedComplete: !overview.loading,
    profileLast20Seed: overview.loading ? null : overview.last20,
    profileStatsContext,
  };

  return variant === "web" ? (
    <WebProfileViewV2 {...viewProps} />
  ) : (
    <MobileProfileViewV2 {...viewProps} />
  );
}

export type ProfileViewPropsV2 = {
  profile: Profile;

  tab: "overview" | "stats" | "bracket";
  setTab: (v: "overview" | "stats" | "bracket") => void;

  summary?: SummaryForCardsV2;
  summaryRanks?: SummaryRanksV2;
  metricValueDeltas?: MyRankMetricValueDeltas;
  statsLoading: boolean;

  targetUid: string | null;

  /** cumulative profileCharts.dailyTrend（空配列も確定） */
  profileDailyTrendSeed?: ProfileDailyTrendRow[] | null;
  profileDailyTrendSeedComplete?: boolean;
  /** cumulative profileCharts.rankTrend */
  profileRankTrendSeed?: { dateKey: string; rank: number }[] | null;
  profileRankTrendSeedComplete?: boolean;
  /** cumulative profileCharts.last20 */
  profileLast20Seed?: ProfileChartsLast20Point[] | null;
  profileStatsContext: {
    rankingLeague: RankingLeagueSource;
  };
};
