"use client";

import { useMemo, useState } from "react";
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
import type { ProfileKinetikMetricsSection } from "@/lib/profile/profileKinetikMetricsSection";
import {
  getNbaKinetikPeriodTitle,
  useNbaKinetikPeriodStats,
  type ProfileKinetikMetricsPeriod,
} from "@/lib/profile/useNbaKinetikMonthlyStats";

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
  /** 期間スタッツ取得用（NBA Playoffs / Season 切替） */
  targetUid?: string | null;
  /** 累計プロフィール閲覧数（公開） */
  profileViewCount?: number | null;
};

const EMPTY_NBA_STATS = {
  winRate: 0,
  posts: 0,
  hits: 0,
  scorePrecision: 0,
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
  targetUid = null,
  profileViewCount = null,
}: Props) {
  const isNba = profileStatsContext.rankingLeague === "nba";
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>("playoffs");

  const effectivePeriod: ProfileKinetikMetricsPeriod = isNba
    ? metricsPeriod
    : "playoffs";

  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    effectivePeriod,
    isNba
  );

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

  const mapped = isNba
    ? periodMapped
      ? {
          ...periodMapped,
          metricsTitle: getNbaKinetikPeriodTitle(
            effectivePeriod,
            periodData!.seasonKey
          ),
        }
      : {
          ...baseMapped,
          stats: { ...baseMapped.stats, ...EMPTY_NBA_STATS },
          metricsTitle: getNbaKinetikPeriodTitle(effectivePeriod),
          totalPointsRank: null,
          totalPointsRankDenominator: null,
          rankDeltaPlaces: null,
        }
    : baseMapped;

  const kinetikLanguage = toKinetikPanelLanguage(language);

  const isWcStacked =
    profileStatsContext.rankingLeague === "worldcup" &&
    (wcStackedMetricsSections?.length ?? 0) > 0;
  const headerSection = isWcStacked ? wcStackedMetricsSections![0] : null;

  const statsPending =
    (statsLoading && summary == null && !isNba) ||
    (isNba && periodLoading && !periodData) ||
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
        profileViewCount={profileViewCount}
        unitBalance={profile.unitBalance}
        bio={profile.bio}
        countryCode={profile.countryCode}
        memberSinceMs={profile.memberSinceMs}
        isPro={profile.plan === "pro"}
        planProBgVariant={profile.planProBgVariant}
        shareHandle={profile.handle}
        metricValueDeltas={
          isNba
            ? null
            : (headerSection?.metricValueDeltas ?? metricValueDeltas)
        }
        rankingLeague={profileStatsContext.rankingLeague}
        visualEffects={visualEffects}
        metricsPeriod={isNba ? effectivePeriod : undefined}
        onMetricsPeriodChange={isNba ? setMetricsPeriod : undefined}
      />
    </div>
  );
}
