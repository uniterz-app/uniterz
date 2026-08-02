// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2";

import { useUserStatsV2 } from "./useUserStatsV2";
import type { SummaryForCardsV2, SummaryRanksV2 } from "./useUserStatsV2";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { useProfileScopedStreak } from "@/lib/profile/useProfileScopedStreak";
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

  const { stats, summary, summaryRanks, metricValueDeltas, statsLoading, dailyTrend } =
    useUserStatsV2(targetUid, {
      ...profileStatsContext,
      prefetchOtherLeague: false,
      routeKey: handle,
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
    if (!summary) return undefined;
    return {
      ...summary,
      activeWinStreak: effectiveStreak.currentStreak,
    };
  }, [summary, effectiveStreak.currentStreak]);

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
    summaryRanks: summaryRanks ?? undefined,
    metricValueDeltas: metricValueDeltas ?? undefined,
    statsLoading,
    targetUid,
    profileDailyTrendSeed: dailyTrend,
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

  /** user-stats API の dailyTrend（あれば日次チャートは Firestore を読まない） */
  profileDailyTrendSeed?: ProfileDailyTrendRow[] | null;
  profileStatsContext: {
    rankingLeague: RankingLeagueSource;
  };
};
