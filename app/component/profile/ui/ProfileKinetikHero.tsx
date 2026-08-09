"use client";

import { useEffect, useMemo, useState } from "react";
import type { Profile } from "@/app/component/profile/useProfile";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import ProfileCareerPanel from "@/app/component/profile/ui/ProfileCareerPanel";
import ProfileKinetikFlipShell from "@/app/component/profile/ui/ProfileKinetikFlipShell";
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
  getNbaKinetikScopeTitle,
  prefetchNbaKinetikPeriodStats,
  prefetchNbaKinetikWindowStats,
  useNbaKinetikPeriodStats,
  useNbaKinetikWindowStats,
  type ProfileKinetikMetricsPeriod,
  type ProfileKinetikWindow,
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
  /** 期間スタッツ取得用（NBA Season / Playoffs × Week / Month） */
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
  const [metricsWindow, setMetricsWindow] =
    useState<ProfileKinetikWindow>("monthly");

  /** 表カード: Week / Month（board 連動） */
  const { data: windowData, loading: windowLoading } = useNbaKinetikWindowStats(
    targetUid,
    metricsPeriod,
    metricsWindow,
    true
  );

  /** CAREER: Season / Playoffs 累計 */
  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    metricsPeriod,
    true
  );

  useEffect(() => {
    const otherBoard: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    const otherWindow: ProfileKinetikWindow =
      metricsWindow === "monthly" ? "weekly" : "monthly";
    prefetchNbaKinetikPeriodStats(targetUid, otherBoard);
    prefetchNbaKinetikWindowStats(targetUid, metricsPeriod, otherWindow);
    prefetchNbaKinetikWindowStats(targetUid, otherBoard, metricsWindow);
  }, [targetUid, metricsPeriod, metricsWindow]);

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

  const windowMapped = useMemo(() => {
    if (!windowData) return null;
    return mapProfileToKinetikPanel({
      profile,
      summary: windowData.summary,
      summaryRanks: windowData.summaryRanks,
      profileStatsContext,
      winStreak,
    });
  }, [windowData, profile, profileStatsContext, winStreak]);

  const mapped = windowMapped
    ? {
        ...windowMapped,
        metricsTitle: getNbaKinetikScopeTitle(
          metricsPeriod,
          windowData!.seasonKey
        ),
      }
    : {
        ...baseMapped,
        stats: { ...baseMapped.stats, ...EMPTY_NBA_STATS },
        metricsTitle: getNbaKinetikScopeTitle(metricsPeriod),
        totalPointsRank: null,
        totalPointsRankDenominator: null,
        rankDeltaPlaces: null,
      };

  const kinetikLanguage = toKinetikPanelLanguage(language);

  const statsPending = windowLoading && !windowData;
  const careerPending = periodLoading && !periodData;

  return (
    <div
      className={
        layout === "web" ? "mx-auto w-full" : "mx-auto w-full max-w-[520px]"
      }
    >
      <ProfileKinetikFlipShell
        language={language}
        front={
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
          <ProfileCareerPanel
            language={language}
            layout={layout}
            variant="face"
            posts={
              periodData?.summary.posts ??
              (careerPending ? null : summary?.posts ?? null)
            }
            winRate={
              periodData?.summary.winRate ??
              (careerPending ? null : summary?.winRate ?? null)
            }
            totalPointsRank={
              periodData?.summaryRanks.totalPoints ??
              summaryRanks?.totalPoints ??
              null
            }
            totalPointsRankDenominator={
              periodData?.summaryRanks.totalPointsDenominator ??
              summaryRanks?.totalPointsDenominator ??
              null
            }
            memberSinceMs={profile.memberSinceMs}
            badges={badges}
            loading={careerPending}
            isPro={profile.plan === "pro"}
            planProBgVariant={profile.planProBgVariant}
            metricsPeriod={metricsPeriod}
            onMetricsPeriodChange={setMetricsPeriod}
            seasonKey={periodData?.seasonKey ?? null}
          />
        }
      />
    </div>
  );
}
