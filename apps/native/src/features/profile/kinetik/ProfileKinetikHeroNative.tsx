import { useMemo } from "react";
import type { ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import type { ProfileKinetikMetricsSection } from "../../../../../../lib/profile/profileKinetikMetricsSection";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";

export type ProfileKinetikHeroNativeProps = {
  displayName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  countryCode: string;
  plan: "free" | "pro";
  memberSinceMs?: number | null;
  language: "ja" | "en";
  summary?: ProfileSummaryNative | null;
  summaryRanks?: ProfileSummaryRanksNative | null;
  profileStatsContext: ProfileStatsStreakContext;
  winStreak: number;
  statsLoading?: boolean;
  metricValueDeltas?: MyRankMetricValueDeltas | null;
  isMe?: boolean;
  onOpenMenu?: () => void;
  onToggleMetricsScope?: () => void;
  menuUnreadCount?: number;
  badges?: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
  style?: ViewStyle;
  wcStackedMetricsSections?: ProfileKinetikMetricsSection[];
  wcStackedStatsLoading?: boolean;
};

export default function ProfileKinetikHeroNative({
  displayName,
  handle,
  avatarUrl,
  bio,
  countryCode,
  plan,
  memberSinceMs = null,
  language,
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
  onBadgePress,
  style,
  wcStackedMetricsSections,
  wcStackedStatsLoading = false,
}: ProfileKinetikHeroNativeProps) {
  const mapped = useMemo(() => {
    const profile: Profile = {
      displayName,
      handle,
      avatarUrl,
      bio,
      countryCode: countryCode.trim() || null,
      plan,
      memberSinceMs: memberSinceMs ?? null,
      counts: { posts: summary?.posts ?? 0 },
      currentStreak: winStreak,
      maxStreak: winStreak,
    };
    return mapProfileToKinetikPanel({
      profile,
        summary: summary
          ? {
              posts: summary.posts,
              fullPosts: summary.fullPosts,
              recent3Posts: summary.recent3Posts,
              wins: summary.wins,
              winRate: summary.winRate,
              scorePrecisionSum: summary.scorePrecisionSum,
              upsetPointsSum: summary.upsetPointsSum,
              pointsSumV3: summary.pointsSumV3,
              upsetChanceCount: summary.upsetChanceCount,
              upsetHitCount: summary.upsetHitCount,
              upsetBonusSum: summary.upsetBonusSum,
              streakBonusSum: summary.streakBonusSum,
              basePointsSum: summary.basePointsSum,
            }
          : undefined,
        summaryRanks: summaryRanks
          ? {
              totalPrecision: summaryRanks.totalPrecision,
              totalUpset: summaryRanks.totalUpset,
              totalPoints: summaryRanks.totalPoints,
              totalPointsDenominator: summaryRanks.totalPointsDenominator ?? null,
              rankDeltaPlaces: summaryRanks.rankDeltaPlaces ?? null,
            }
          : undefined,
        profileStatsContext,
        winStreak,
      });
  }, [
      avatarUrl,
      bio,
      countryCode,
      displayName,
      handle,
      memberSinceMs,
      plan,
      profileStatsContext,
      summary,
      summaryRanks,
      winStreak,
  ]);

  const statsPending =
    (statsLoading && !summary) ||
    (profileStatsContext.rankingLeague === "worldcup" &&
      wcStackedStatsLoading &&
      !wcStackedMetricsSections?.length);

  const isWcStacked =
    profileStatsContext.rankingLeague === "worldcup" &&
    (wcStackedMetricsSections?.length ?? 0) > 0;
  const headerSection = isWcStacked ? wcStackedMetricsSections![0] : null;

  return (
    <ProfileKinetikPanelNative
      style={style}
      identity={mapped.identity}
      stats={headerSection?.stats ?? mapped.stats}
      language={language}
      bio={bio}
      countryCode={countryCode}
      memberSinceMs={memberSinceMs}
      isPro={plan === "pro"}
      winStreak={headerSection?.winStreak ?? mapped.winStreak}
      totalPointsRank={headerSection?.totalPointsRank ?? mapped.totalPointsRank}
      totalPointsRankDenominator={
        headerSection?.totalPointsRankDenominator ??
        mapped.totalPointsRankDenominator
      }
      rankDeltaPlaces={headerSection?.rankDeltaPlaces ?? mapped.rankDeltaPlaces}
      metricsTitle={mapped.metricsTitle}
      canOpenMenu={isMe}
      onOpenMenu={isMe ? onOpenMenu : undefined}
      menuUnreadCount={menuUnreadCount}
      onToggleMetricsScope={onToggleMetricsScope}
      badges={badges}
      onBadgePress={onBadgePress}
      shareHandle={handle}
      metricValueDeltas={
        headerSection?.metricValueDeltas ?? metricValueDeltas
      }
      rankingLeague={profileStatsContext.rankingLeague}
      stackedMetricsSections={
        isWcStacked ? wcStackedMetricsSections : undefined
      }
      statsPending={statsPending}
    />
  );
}
