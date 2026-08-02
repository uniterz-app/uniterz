"use client";

import { useEffect, useMemo, useState } from "react";
import type { Profile } from "@/app/component/profile/useProfile";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import {
  mapProfileToKinetikPanel,
  toKinetikPanelLanguage,
} from "@/lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { Language } from "@/lib/i18n/language";
import type { ResolvedBadge } from "@/lib/profile/useProfileBadges";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { ProfileVisualEffects } from "@/lib/profile/profileVisualEffects";
import {
  getNbaKinetikPeriodTitle,
  prefetchNbaKinetikPeriodStats,
  useNbaKinetikPeriodStats,
  type ProfileKinetikMetricsPeriod,
} from "@/lib/profile/useNbaKinetikMonthlyStats";
import { preferredNbaKinetikPeriod } from "@/lib/rankings/nbaSeason";

type Props = {
  layout: "web" | "mobile";
  language: Language;
  profile: Profile;
  summary?: SummaryForCardsV2;
  summaryRanks?: SummaryRanksV2;
  profileStatsContext: ProfileStatsStreakContext;
  winStreak: number;
  statsLoading?: boolean;
  metricValueDeltas?: MyRankMetricValueDeltas | null;
  isMe?: boolean;
  onOpenMenu?: () => void;
  menuUnreadCount?: number;
  badges?: ResolvedBadge[];
  onBadgeClick?: (badge: ResolvedBadge) => void;
  visualEffects?: ProfileVisualEffects;
  /** 期間スタッツ取得用（NBA Season / Playoffs 切替） */
  targetUid?: string | null;
  /** 累計プロフィール閲覧数（公開） */
  profileViewCount?: number | null;
};

const EMPTY_NBA_STATS = {
  winRate: 0,
  posts: 0,
  hits: 0,
  exactHits: 0,
  goalScorerHits: 0,
  totalPoints: 0,
  upset: 0,
  totalPointsRank: null as number | null,
  totalPointsRankDenominator: null as number | null,
  rankDeltaPlaces: null as number | null,
};

export default function ProfileKinetikHero({
  layout,
  language,
  profile,
  summary,
  summaryRanks,
  profileStatsContext,
  winStreak,
  isMe = false,
  onOpenMenu,
  menuUnreadCount = 0,
  badges = [],
  onBadgeClick,
  visualEffects = "full",
  targetUid = null,
  profileViewCount = null,
}: Props) {
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>(() => preferredNbaKinetikPeriod());

  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    metricsPeriod,
    true
  );

  useEffect(() => {
    const other: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    prefetchNbaKinetikPeriodStats(targetUid, other);
  }, [targetUid, metricsPeriod]);

  const baseMapped = useMemo(
    () =>
      mapProfileToKinetikPanel({
        profile,
        summary,
        summaryRanks,
        profileStatsContext,
        winStreak,
      }),
    [profile, profileStatsContext, summary, summaryRanks, winStreak]
  );

  const periodMapped = useMemo(() => {
    if (!periodData) return null;
    return mapProfileToKinetikPanel({
      profile,
      summary: periodData.summary,
      summaryRanks: periodData.summaryRanks,
      profileStatsContext,
      winStreak,
    });
  }, [periodData, profile, profileStatsContext, winStreak]);

  const mapped = periodMapped
    ? {
        ...periodMapped,
        metricsTitle: getNbaKinetikPeriodTitle(
          metricsPeriod,
          periodData!.seasonKey
        ),
      }
    : {
        ...baseMapped,
        stats: { ...baseMapped.stats, ...EMPTY_NBA_STATS },
        metricsTitle: getNbaKinetikPeriodTitle(metricsPeriod),
        totalPointsRank: null,
        totalPointsRankDenominator: null,
        rankDeltaPlaces: null,
      };

  const kinetikLanguage = toKinetikPanelLanguage(language);

  const statsPending = periodLoading && !periodData;

  return (
    <div
      className={
        layout === "web" ? "mx-auto w-full" : "mx-auto w-full max-w-[520px]"
      }
    >
      <ProfileEditKinetikPanel
        layout={layout}
        language={kinetikLanguage}
        identity={mapped.identity}
        stats={mapped.stats}
        winStreak={mapped.winStreak}
        totalPointsRank={mapped.totalPointsRank}
        totalPointsRankDenominator={mapped.totalPointsRankDenominator}
        rankDeltaPlaces={mapped.rankDeltaPlaces}
        metricsTitle={mapped.metricsTitle}
        statsPending={statsPending}
        editable={isMe}
        canOpenMenu={isMe}
        onOpenMenu={isMe ? onOpenMenu : undefined}
        menuUnreadCount={menuUnreadCount}
        badges={badges}
        onBadgeClick={onBadgeClick}
        profileViewCount={profileViewCount}
        unitBalance={profile.unitBalance}
        bio={profile.bio}
        countryCode={profile.countryCode}
        memberSinceMs={profile.memberSinceMs}
        isPro={profile.plan === "pro"}
        planProBgVariant={profile.planProBgVariant}
        shareHandle={profile.handle}
        metricValueDeltas={null}
        rankingLeague="nba"
        visualEffects={visualEffects}
        metricsPeriod={metricsPeriod}
        onMetricsPeriodChange={setMetricsPeriod}
      />
    </div>
  );
}
