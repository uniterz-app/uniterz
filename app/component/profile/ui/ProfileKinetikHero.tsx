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
  type ProfileKinetikMetricsTab,
} from "@/lib/profile/useNbaKinetikMonthlyStats";
import { listRankingPeriodLabels } from "@/lib/rankings/rankingPeriod";
import { preferredNbaKinetikPeriod } from "@/lib/rankings/nbaSeason";
import { useUserCareer } from "@/lib/profile/useUserCareer";

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
  targetUid?: string | null;
  profileViewCount?: number | null;
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
  const [metricsTab, setMetricsTab] =
    useState<ProfileKinetikMetricsTab>("total");
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  const windowEnabled = metricsTab !== "total";
  const { data: periodData, loading: periodLoading } = useNbaKinetikPeriodStats(
    targetUid,
    metricsPeriod,
    metricsTab === "total"
  );
  const { data: windowData, loading: windowLoading } = useNbaKinetikWindowStats(
    targetUid,
    metricsPeriod,
    metricsTab === "weekly" || metricsTab === "monthly" ? metricsTab : "weekly",
    windowEnabled,
    undefined,
    windowLabel
  );

  const activeData =
    metricsTab === "total"
      ? periodData
      : windowData
        ? {
            summary: windowData.summary,
            summaryRanks: windowData.summaryRanks,
            seasonKey: windowData.seasonKey,
            label: windowData.label,
          }
        : null;

  const { career, loading: careerDocLoading } = useUserCareer(targetUid, {
    enabled: true,
  });

  useEffect(() => {
    setWindowLabel(null);
  }, [metricsTab, metricsPeriod]);

  useEffect(() => {
    const otherBoard: ProfileKinetikMetricsPeriod =
      metricsPeriod === "season" ? "playoffs" : "season";
    prefetchNbaKinetikPeriodStats(targetUid, otherBoard);
    if (metricsTab === "total") {
      prefetchNbaKinetikPeriodStats(targetUid, metricsPeriod);
      return;
    }
    const otherTab: ProfileKinetikMetricsTab =
      metricsTab === "monthly" ? "weekly" : "monthly";
    prefetchNbaKinetikWindowStats(targetUid, metricsPeriod, otherTab);
    prefetchNbaKinetikWindowStats(targetUid, otherBoard, metricsTab);
  }, [targetUid, metricsPeriod, metricsTab]);

  const periodLabels = useMemo(() => {
    if (metricsTab === "total") return [];
    return listRankingPeriodLabels(metricsTab);
  }, [metricsTab]);

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

  const mapped = useMemo(() => {
    if (!activeData) {
      return {
        ...baseMapped,
        metricsTitle: getNbaKinetikScopeTitle(metricsPeriod),
        totalPointsRank: null,
        totalPointsRankDenominator: null,
        rankDeltaPlaces: null,
      };
    }
    const panel = mapProfileToKinetikPanel({
      profile,
      summary: activeData.summary,
      summaryRanks: activeData.summaryRanks,
      profileStatsContext,
      winStreak,
    });
    return {
      ...panel,
      metricsTitle: getNbaKinetikScopeTitle(
        metricsPeriod,
        activeData.seasonKey
      ),
    };
  }, [
    activeData,
    baseMapped,
    metricsPeriod,
    profile,
    profileStatsContext,
    winStreak,
  ]);

  const kinetikLanguage = toKinetikPanelLanguage(language);
  const statsPending =
    metricsTab === "total"
      ? periodLoading && !periodData
      : windowLoading && !windowData;
  const careerPending = careerDocLoading && !career;

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
            metricsTab={metricsTab}
            onMetricsTabChange={setMetricsTab}
            metricsWindowLabel={
              metricsTab === "total" ? null : windowData?.label ?? windowLabel
            }
            onMetricsWindowLabelChange={
              profile.plan === "pro" ? setWindowLabel : undefined
            }
            metricsPeriodLabels={profile.plan === "pro" ? periodLabels : []}
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
            career={career}
            badges={badges}
            loading={careerPending}
            isPro={profile.plan === "pro"}
            planProBgVariant={profile.planProBgVariant}
          />
        }
      />
    </div>
  );
}
