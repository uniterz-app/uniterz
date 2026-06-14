"use client";

import { useMemo } from "react";
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
import CandleChartLoader from "@/app/component/common/CandleChartLoader";

import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

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
  onToggleMetricsScope?: () => void;
  menuUnreadCount?: number;
  badges?: ResolvedBadge[];
  onBadgeClick?: (badge: ResolvedBadge) => void;
};

export default function ProfileKinetikHero({
  layout,
  language,
  profile,
  summary,
  summaryRanks,
  profileStatsContext,
  winStreak,
  statsLoading = false,
  metricValueDeltas = null,
  isMe = false,
  onOpenMenu,
  onToggleMetricsScope,
  menuUnreadCount = 0,
  badges = [],
  onBadgeClick,
}: Props) {
  const mapped = useMemo(
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

  const kinetikLanguage = toKinetikPanelLanguage(language);

  return (
    <div
      className={
        layout === "web" ? "mx-auto w-full" : "mx-auto w-full max-w-[520px]"
      }
    >
      {statsLoading && !summary ? (
        <div className="flex min-h-[280px] items-center justify-center rounded border border-white/10 bg-transparent">
          <CandleChartLoader />
        </div>
      ) : (
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
          editable={isMe}
          canOpenMenu={isMe}
          onOpenMenu={isMe ? onOpenMenu : undefined}
          menuUnreadCount={menuUnreadCount}
          onToggleMetricsScope={onToggleMetricsScope}
          badges={badges}
          onBadgeClick={onBadgeClick}
          bio={profile.bio}
          countryCode={profile.countryCode}
          memberSinceMs={profile.memberSinceMs}
          isPro={profile.plan === "pro"}
          shareHandle={profile.handle}
          metricValueDeltas={metricValueDeltas}
          rankingLeague={profileStatsContext.rankingLeague}
        />
      )}
    </div>
  );
}
