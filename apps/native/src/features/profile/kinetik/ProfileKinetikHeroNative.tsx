/**
 * Web `ProfileKinetikHero` 相当 — 表は Season/Playoff × Week/Month。
 * CAREER 裏面は通算（ALL）summary 固定。
 */
import { useEffect, useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import {
  getNbaKinetikScopeTitle,
  prefetchNbaKinetikWindowStats,
  useNbaKinetikWindowStats,
  type ProfileKinetikMetricsPeriod,
  type ProfileKinetikWindow,
} from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { preferredNbaKinetikPeriod } from "../../../../../../lib/rankings/nbaSeason";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { getUniterzApiBaseUrl } from "../../games/submitPredictionApi";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";
import ProfileKinetikFlipShellNative from "./ProfileKinetikFlipShellNative";
import ProfileCareerPanelNative from "../ProfileCareerPanelNative";

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
  profileViewCount?: number | null;
  unitBalance?: number | null;
  onOpenUnitLedger?: () => void;
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
  summary = null,
  summaryRanks = null,
  profileStatsContext,
  winStreak,
  statsLoading = false,
  isMe = false,
  onOpenMenu,
  menuUnreadCount = 0,
  badges = [],
  onBadgePress,
  style,
  targetUid = null,
  profileViewCount = null,
  unitBalance = null,
  onOpenUnitLedger,
}: ProfileKinetikHeroNativeProps) {
  const preferredPeriod = useMemo(() => preferredNbaKinetikPeriod(), []);
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>(() => preferredPeriod);
  const [metricsWindow, setMetricsWindow] =
    useState<ProfileKinetikWindow>("monthly");
  const apiBase = useMemo(() => getUniterzApiBaseUrl() ?? undefined, []);

  const { data: windowData, loading: windowLoading } = useNbaKinetikWindowStats(
    targetUid,
    metricsPeriod,
    metricsWindow,
    true,
    apiBase
  );

  useEffect(() => {
    const otherBoard: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    const otherWindow: ProfileKinetikWindow =
      metricsWindow === "monthly" ? "weekly" : "monthly";
    prefetchNbaKinetikWindowStats(
      targetUid,
      metricsPeriod,
      otherWindow,
      apiBase
    );
    prefetchNbaKinetikWindowStats(
      targetUid,
      otherBoard,
      metricsWindow,
      apiBase
    );
  }, [targetUid, metricsPeriod, metricsWindow, apiBase]);

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

  const mapped = useMemo(() => {
    return mapProfileToKinetikPanel({
      profile: profileBase,
      summary: windowData
        ? toSummaryInput(windowData.summary as ProfileSummaryNative)
        : undefined,
      summaryRanks: windowData
        ? toRanksInput(windowData.summaryRanks as ProfileSummaryRanksNative)
        : undefined,
      profileStatsContext,
      winStreak,
    });
  }, [windowData, profileBase, profileStatsContext, winStreak]);

  const statsPending = !windowData && (windowLoading || statsLoading);
  /** CAREER は通算 summary（ALL）固定。表の期間切替とは独立 */
  const careerPending = statsLoading && summary == null;

  return (
    <ProfileKinetikFlipShellNative
      language={language}
      front={
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
          metricsTitle={getNbaKinetikScopeTitle(
            metricsPeriod,
            windowData?.seasonKey
          )}
          canOpenMenu={isMe}
          onOpenMenu={isMe ? onOpenMenu : undefined}
          menuUnreadCount={menuUnreadCount}
          badges={badges}
          onBadgePress={onBadgePress}
          profileViewCount={profileViewCount}
          unitBalance={unitBalance}
          onOpenUnitLedger={isMe ? onOpenUnitLedger : undefined}
          shareHandle={handle}
          metricValueDeltas={null}
          rankingLeague="nba"
          statsPending={statsPending}
          metricsPeriod={metricsPeriod}
          onMetricsPeriodChange={setMetricsPeriod}
          metricsWindow={metricsWindow}
          onMetricsWindowChange={setMetricsWindow}
          onToggleMetricsScope={() =>
            setMetricsPeriod((prev) =>
              prev === "season" ? "playoffs" : "season"
            )
          }
        />
      }
      back={
        <ProfileCareerPanelNative
          language={language}
          variant="face"
          posts={summary?.posts ?? null}
          winRate={summary?.winRate ?? null}
          totalPointsRank={summaryRanks?.totalPoints ?? null}
          totalPointsRankDenominator={
            summaryRanks?.totalPointsDenominator ?? null
          }
          memberSinceMs={memberSinceMs}
          badges={badges}
          loading={summary == null && careerPending}
          isPro={plan === "pro"}
          planProBgVariant={planProBgVariant}
        />
      }
    />
  );
}
