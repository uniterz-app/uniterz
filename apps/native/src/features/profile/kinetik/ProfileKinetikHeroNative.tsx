/**
 * Web `ProfileKinetikHero` 相当 — NBA Playoffs / Season 切替付き。
 * プロフィールは NBA のみ（W杯 stacked 経路は使わない）。
 */
import { useEffect, useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import {
  getNbaKinetikPeriodTitle,
  prefetchNbaKinetikPeriodStats,
  useNbaKinetikPeriodStats,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { preferredNbaKinetikPeriod } from "../../../../../../lib/rankings/nbaSeason";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { getUniterzApiBaseUrl } from "../../games/submitPredictionApi";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";

export type ProfileKinetikHeroNativeProps = {
  displayName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  countryCode: string;
  plan: "free" | "pro";
  planProBgVariant?: ProfilePlanProBgVariant;
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
  menuUnreadCount?: number;
  badges?: ResolvedBadgeNative[];
  onBadgePress?: (badge: ResolvedBadgeNative) => void;
  style?: ViewStyle;
  targetUid?: string | null;
  /** 累計プロフィール閲覧数（公開） */
  profileViewCount?: number | null;
  /** 保有 Unit（公開） */
  unitBalance?: number | null;
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

function toSummaryInput(summary?: ProfileSummaryNative | null) {
  if (!summary) return undefined;
  return {
    posts: summary.posts,
    fullPosts: summary.fullPosts,
    recent3Posts: summary.recent3Posts,
    wins: summary.wins,
    winRate: summary.winRate,
    exactHitCount: summary.exactHitCount,
    goalScorerHitCount: summary.goalScorerHitCount,
    upsetPointsSum: summary.upsetPointsSum,
    pointsSumV3: summary.pointsSumV3,
    upsetChanceCount: summary.upsetChanceCount,
    upsetHitCount: summary.upsetHitCount,
    upsetBonusSum: summary.upsetBonusSum,
    streakBonusSum: summary.streakBonusSum,
    basePointsSum: summary.basePointsSum,
  };
}

function toRanksInput(summaryRanks?: ProfileSummaryRanksNative | null) {
  if (!summaryRanks) return undefined;
  return {
    totalPrecision: summaryRanks.totalPrecision,
    totalUpset: summaryRanks.totalUpset,
    totalPoints: summaryRanks.totalPoints,
    totalPointsDenominator: summaryRanks.totalPointsDenominator ?? null,
    rankDeltaPlaces: summaryRanks.rankDeltaPlaces ?? null,
  };
}

export default function ProfileKinetikHeroNative({
  displayName,
  handle,
  avatarUrl,
  bio,
  countryCode,
  plan,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
  memberSinceMs = null,
  language,
  summary,
  summaryRanks,
  profileStatsContext,
  winStreak,
  statsLoading: _statsLoading = false,
  isMe = false,
  onOpenMenu,
  menuUnreadCount = 0,
  badges = [],
  onBadgePress,
  style,
  targetUid = null,
  profileViewCount = null,
  unitBalance = null,
}: ProfileKinetikHeroNativeProps) {
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>(() => preferredNbaKinetikPeriod());
  const apiBase = getUniterzApiBaseUrl() || undefined;
  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    metricsPeriod,
    true,
    apiBase
  );

  useEffect(() => {
    const other: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    prefetchNbaKinetikPeriodStats(targetUid, other, apiBase);
  }, [targetUid, metricsPeriod, apiBase]);

  const profileBase: Profile = useMemo(
    () => ({
      displayName,
      handle,
      avatarUrl,
      bio,
      countryCode: countryCode.trim() || null,
      plan,
      planProBgVariant,
      memberSinceMs: memberSinceMs ?? null,
      counts: { posts: summary?.posts ?? 0 },
      currentStreak: winStreak,
      maxStreak: winStreak,
      unitBalance: unitBalance ?? 0,
    }),
    [
      avatarUrl,
      bio,
      countryCode,
      displayName,
      handle,
      memberSinceMs,
      plan,
      planProBgVariant,
      summary?.posts,
      unitBalance,
      winStreak,
    ]
  );

  const baseMapped = useMemo(
    () =>
      mapProfileToKinetikPanel({
        profile: profileBase,
        summary: toSummaryInput(summary),
        summaryRanks: toRanksInput(summaryRanks),
        profileStatsContext,
        winStreak,
      }),
    [profileBase, profileStatsContext, summary, summaryRanks, winStreak]
  );

  const periodMapped = useMemo(() => {
    if (!periodData) return null;
    return mapProfileToKinetikPanel({
      profile: profileBase,
      summary: periodData.summary,
      summaryRanks: periodData.summaryRanks,
      profileStatsContext,
      winStreak,
    });
  }, [periodData, profileBase, profileStatsContext, winStreak]);

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

  const statsPending = periodLoading && !periodData;

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
      planProBgVariant={planProBgVariant}
      winStreak={mapped.winStreak}
      totalPointsRank={mapped.totalPointsRank}
      totalPointsRankDenominator={mapped.totalPointsRankDenominator}
      rankDeltaPlaces={mapped.rankDeltaPlaces}
      metricsTitle={mapped.metricsTitle}
      canOpenMenu={isMe}
      onOpenMenu={isMe ? onOpenMenu : undefined}
      menuUnreadCount={menuUnreadCount}
      badges={badges}
      onBadgePress={onBadgePress}
      profileViewCount={profileViewCount}
      unitBalance={unitBalance}
      shareHandle={handle}
      metricValueDeltas={null}
      rankingLeague="nba"
      statsPending={statsPending}
      metricsPeriod={metricsPeriod}
      onMetricsPeriodChange={setMetricsPeriod}
    />
  );
}
