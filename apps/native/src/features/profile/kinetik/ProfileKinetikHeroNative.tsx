import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
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

  if (statsLoading && !summary) {
    return (
      <View style={[styles.loadingShell, style]}>
        <BlocksPulseLoader />
      </View>
    );
  }

  return (
    <ProfileKinetikPanelNative
      style={style}
      identity={mapped.identity}
      stats={mapped.stats}
      language={language}
      bio={bio}
      countryCode={countryCode}
      memberSinceMs={memberSinceMs}
      isPro={plan === "pro"}
      winStreak={mapped.winStreak}
      totalPointsRank={mapped.totalPointsRank}
      totalPointsRankDenominator={mapped.totalPointsRankDenominator}
      rankDeltaPlaces={mapped.rankDeltaPlaces}
      metricsTitle={mapped.metricsTitle}
      canOpenMenu={isMe}
      onOpenMenu={isMe ? onOpenMenu : undefined}
      menuUnreadCount={menuUnreadCount}
      onToggleMetricsScope={onToggleMetricsScope}
      badges={badges}
      onBadgePress={onBadgePress}
      shareHandle={handle}
      metricValueDeltas={metricValueDeltas}
      rankingLeague={profileStatsContext.rankingLeague}
    />
  );
}

const styles = StyleSheet.create({
  loadingShell: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
});
