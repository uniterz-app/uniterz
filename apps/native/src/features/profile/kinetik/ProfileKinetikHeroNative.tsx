/**
 * Web `ProfileKinetikHero` 相当 — Season/Playoff × Total/Week/Month。
 */
import { useEffect, useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import {
  getNbaKinetikScopeTitle,
  prefetchNbaKinetikPeriodStats,
  prefetchNbaKinetikWindowStats,
  useNbaKinetikPeriodStats,
  useNbaKinetikWindowStats,
  type ProfileKinetikMetricsPeriod,
  type ProfileKinetikMetricsTab,
} from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { listRankingPeriodLabels } from "../../../../../../lib/rankings/rankingPeriod";
import { preferredNbaKinetikPeriod } from "../../../../../../lib/rankings/nbaSeason";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { getUniterzApiBaseUrl } from "../../games/submitPredictionApi";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";
import ProfileKinetikFlipShellNative from "./ProfileKinetikFlipShellNative";
import ProfileCareerPanelNative from "../ProfileCareerPanelNative";
import { useUserCareerNative } from "../useUserCareerNative";

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
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>(() => preferredNbaKinetikPeriod());
  const [metricsTab, setMetricsTab] =
    useState<ProfileKinetikMetricsTab>("total");
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const apiBase = useMemo(() => getUniterzApiBaseUrl() ?? undefined, []);

  const windowEnabled = metricsTab !== "total";
  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    metricsPeriod,
    metricsTab === "total",
    apiBase
  );
  const { data: windowData, loading: windowLoading } = useNbaKinetikWindowStats(
    targetUid,
    metricsPeriod,
    metricsTab === "weekly" || metricsTab === "monthly" ? metricsTab : "weekly",
    windowEnabled,
    apiBase,
    windowLabel
  );

  const { career, loading: careerDocLoading, error: careerError } =
    useUserCareerNative(targetUid, {
      apiBaseUrl: apiBase,
      enabled: true,
    });

  useEffect(() => {
    setWindowLabel(null);
  }, [metricsTab, metricsPeriod]);

  useEffect(() => {
    const otherBoard: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    prefetchNbaKinetikPeriodStats(targetUid, otherBoard, apiBase);
    if (metricsTab === "total") {
      prefetchNbaKinetikPeriodStats(targetUid, metricsPeriod, apiBase);
      return;
    }
    const otherTab: ProfileKinetikMetricsTab =
      metricsTab === "monthly" ? "weekly" : "monthly";
    prefetchNbaKinetikWindowStats(
      targetUid,
      metricsPeriod,
      otherTab,
      apiBase
    );
    prefetchNbaKinetikWindowStats(
      targetUid,
      otherBoard,
      metricsTab,
      apiBase
    );
  }, [targetUid, metricsPeriod, metricsTab, apiBase]);

  const periodLabels = useMemo(() => {
    if (metricsTab === "total") return [];
    return listRankingPeriodLabels(metricsTab);
  }, [metricsTab]);

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

  const activeData =
    metricsTab === "total"
      ? periodData
      : windowData
        ? {
            summary: windowData.summary,
            summaryRanks: windowData.summaryRanks,
            seasonKey: windowData.seasonKey,
          }
        : null;

  const mapped = useMemo(() => {
    if (!activeData) {
      return mapProfileToKinetikPanel({
        profile: profileBase,
        profileStatsContext,
        winStreak,
      });
    }
    return mapProfileToKinetikPanel({
      profile: profileBase,
      summary: toSummaryInput(activeData.summary as ProfileSummaryNative),
      summaryRanks: toRanksInput(
        activeData.summaryRanks as ProfileSummaryRanksNative
      ),
      profileStatsContext,
      winStreak,
    });
  }, [activeData, profileBase, profileStatsContext, winStreak]);

  const statsPending =
    metricsTab === "total"
      ? !periodData && (periodLoading || statsLoading)
      : !windowData && (windowLoading || statsLoading);
  const careerPending = careerDocLoading && !career;

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
            activeData?.seasonKey
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
          metricsTab={metricsTab}
          onMetricsTabChange={setMetricsTab}
          metricsWindowLabel={
            metricsTab === "total" ? null : windowData?.label ?? windowLabel
          }
          onMetricsWindowLabelChange={
            plan === "pro" ? setWindowLabel : undefined
          }
          metricsPeriodLabels={plan === "pro" ? periodLabels : []}
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
          career={career}
          badges={badges}
          loading={careerPending}
          loadError={careerError}
          isPro={plan === "pro"}
          planProBgVariant={planProBgVariant}
        />
      }
    />
  );
}
