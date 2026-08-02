/**
 * Web `ProfileKinetikHero` 相当 — NBA Playoffs / Season 切替付き。
 * プロフィールは NBA のみ。カード数字は cumulative_stats 直読（タブ両方を 1 read）。
 */
import { useEffect, useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import type { Profile } from "../../../../../../app/component/profile/useProfile";
import { mapProfileToKinetikPanel } from "../../../../../../lib/profile/mapProfileToKinetikPanel";
import type { ProfileStatsStreakContext } from "../../../../../../lib/profile/profileStreakScope";
import type { MyRankMetricValueDeltas } from "../../../../../../lib/rankings/myRankMetricValueDeltas";
import {
  getNbaKinetikPeriodTitle,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { preferredNbaKinetikPeriod } from "../../../../../../lib/rankings/nbaSeason";
import { profileOverviewSeasonKey } from "../../../../../../lib/profile/profileOverviewSeason";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "../profileApi";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../../lib/profile/profilePlanProBgVariants";
import {
  prefetchNbaKinetikBothPeriodsFirestore,
  type NbaProfileCardPhaseFirestore,
} from "../fetchNbaProfileCardPhaseFirestore";
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
  profileViewCount?: number | null;
  unitBalance?: number | null;
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

type PeriodBundle = Partial<
  Record<ProfileKinetikMetricsPeriod, NbaProfileCardPhaseFirestore>
>;

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
}: ProfileKinetikHeroNativeProps) {
  const preferredPeriod = useMemo(() => preferredNbaKinetikPeriod(), []);
  const [metricsPeriod, setMetricsPeriod] =
    useState<ProfileKinetikMetricsPeriod>(() => preferredPeriod);
  const [byPeriod, setByPeriod] = useState<PeriodBundle>({});
  const [fsReady, setFsReady] = useState(false);

  useEffect(() => {
    const uid = targetUid?.trim() ?? "";
    if (!uid) {
      setByPeriod({});
      setFsReady(true);
      return;
    }
    let alive = true;
    setFsReady(false);
    void prefetchNbaKinetikBothPeriodsFirestore(uid).then((both) => {
      if (!alive) return;
      if (both) {
        setByPeriod({
          season: both.season,
          playoffs: both.playoffs,
        });
      }
      setFsReady(true);
    });
    return () => {
      alive = false;
    };
  }, [targetUid]);

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

  const activePhase: NbaProfileCardPhaseFirestore | null =
    byPeriod[metricsPeriod] ??
    (metricsPeriod === preferredPeriod && summary
      ? {
          summary,
          summaryRanks: summaryRanks ?? {
            totalPrecision: null,
            totalUpset: null,
            totalPoints: null,
            totalPointsDenominator: null,
            rankDeltaPlaces: null,
          },
          profileCharts: null,
          chartsPath: "missing" as const,
          overviewSeasonKey: profileOverviewSeasonKey(),
        }
      : null);

  const mapped = useMemo(() => {
    const phaseSummary = activePhase?.summary;
    const phaseRanks = activePhase?.summaryRanks;
    return mapProfileToKinetikPanel({
      profile: profileBase,
      summary: toSummaryInput(phaseSummary ?? null),
      summaryRanks: toRanksInput(phaseRanks ?? null),
      profileStatsContext,
      winStreak,
    });
  }, [activePhase, profileBase, profileStatsContext, winStreak]);

  /** 切替中は 0 埋めせず pending（—）。両方の period は 1 read で揃うので通常は即表示 */
  const statsPending =
    !activePhase && (!fsReady || (metricsPeriod === preferredPeriod && statsLoading));
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
      metricsTitle={getNbaKinetikPeriodTitle(metricsPeriod)}
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
