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
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { ProfileVisualEffects } from "@/lib/profile/profileVisualEffects";
import type { ProfileKinetikMetricsSection } from "@/lib/profile/profileKinetikMetricsSection";

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
  visualEffects?: ProfileVisualEffects;
  wcStackedMetricsSections?: ProfileKinetikMetricsSection[];
  wcStackedStatsLoading?: boolean;
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
  visualEffects = "full",
  wcStackedMetricsSections,
  wcStackedStatsLoading = false,
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

  const isWcStacked =
    profileStatsContext.rankingLeague === "worldcup" &&
    (wcStackedMetricsSections?.length ?? 0) > 0;
  const headerSection = isWcStacked ? wcStackedMetricsSections![0] : null;

  const statsPending =
    (statsLoading && summary == null) ||
    (profileStatsContext.rankingLeague === "worldcup" &&
      wcStackedStatsLoading &&
      !wcStackedMetricsSections?.length);

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
        stats={headerSection?.stats ?? mapped.stats}
        winStreak={headerSection?.winStreak ?? mapped.winStreak}
        totalPointsRank={
          headerSection?.totalPointsRank ?? mapped.totalPointsRank
        }
        totalPointsRankDenominator={
          headerSection?.totalPointsRankDenominator ??
          mapped.totalPointsRankDenominator
        }
        rankDeltaPlaces={
          headerSection?.rankDeltaPlaces ?? mapped.rankDeltaPlaces
        }
        metricsTitle={mapped.metricsTitle}
        statsPending={statsPending}
        stackedMetricsSections={
          isWcStacked ? wcStackedMetricsSections : undefined
        }
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
        metricValueDeltas={
          headerSection?.metricValueDeltas ?? metricValueDeltas
        }
        rankingLeague={profileStatsContext.rankingLeague}
        visualEffects={visualEffects}
      />
    </div>
  );
}
