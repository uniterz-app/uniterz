"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import React, { Suspense, useEffect, useState } from "react";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import { useProfileOverviewStage } from "@/lib/profile/useProfileOverviewStage";
import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

const ProfileDailyTrendChartLazy = dynamic(
  () => import("@/app/component/profile/ui/ProfileDailyTrendChart"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

const StreakTrackerCardLazy = dynamic(
  () => import("@/app/component/profile/ui/StreakTrackerCard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[204px] rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

const ProfileSettledTodayResultsLazy = dynamic(
  () => import("@/app/component/profile/ui/ProfileSettledTodayResults"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[120px] rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

const ProAnalysisLazy = dynamic(
  () => import("@/app/component/pro/analysis/ProAnalysis"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-6">
        <CandleChartLoader />
      </div>
    ),
  }
);

const ProPreviewLazy = dynamic(
  () => import("@/app/component/pro/analysis/ProPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-6">
        <CandleChartLoader />
      </div>
    ),
  }
);

const PlayoffFullBracketMobileLazy = dynamic(
  () => import("@/app/component/predict/PlayoffFullBracketMobile"),
  {
    ssr: false,
    loading: () => (
      <div className={`${CYBER_GLASS_PANEL} mt-4 flex min-h-[280px] items-center justify-center p-6`}>
        <CandleChartLoader />
      </div>
    ),
  }
);

const ProfilePlayoffRankTrendChartLazy = dynamic(
  () => import("@/app/component/profile/ui/ProfilePlayoffRankTrendChart"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[240px] rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

import Tabs from "./ui/Tabs";
import ProfileKinetikHero from "./ui/ProfileKinetikHero";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/mobile/badges/BadgeDetailModal";

import { useProfilePlan } from "@/lib/profile/useProfilePlan";
import {
  useProfileBadges,
  type ResolvedBadge,
} from "@/lib/profile/useProfileBadges";
import { useProfilePlayoffBracket } from "@/lib/profile/useProfilePlayoffBracket";
import { useProfileDailyTrendChart } from "@/lib/profile/useProfileDailyTrendChart";
import { useProfilePlayoffRankTrend } from "@/lib/profile/useProfilePlayoffRankTrend";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  clearSideMenuOrigin,
  consumeOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";
import RankingsReturnNavLink from "@/app/component/profile/ui/RankingsReturnNavLink";
import { nameBebas } from "@/lib/fonts";
export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    history.scrollRestoration = "manual";
  }, []);

  const { profile, tab, setTab, summary, summaryRanks, metricValueDeltas, targetUid, statsLoading } =
    props;
  const rankingLeague = props.profileStatsContext.rankingLeague;
  const onToggleStatsLeague = props.onToggleStatsLeague;

  const resolvedUid = typeof targetUid === "string" ? targetUid : null;
  const { language } = useUserLanguage(resolvedUid);

  const {
    myPlan,
    loadingPlan,
    isMe,
    isMyPro,
    isTargetPro,
    isProView,
  } = useProfilePlan({
    targetUid,
    profilePlan: profile.plan,
  });

  const forceProView = false;
  const currentIsProView = forceProView || isProView;

  const fetchOverviewExtras = tab === "overview";
  const fetchBracketData = tab === "bracket";

  const { resolvedBadges } = useProfileBadges(resolvedUid);

  const { chartData: dailyTrendForChart, loading: dailyTrendLoading } =
    useProfileDailyTrendChart(resolvedUid, {
      enabled: fetchOverviewExtras,
      seedRows: props.profileDailyTrendSeed ?? undefined,
      rankingLeague,
      wcStage: props.profileStatsContext.wcStage,
    });

  const { chartRows: rankPlayoffTrendRows, loading: rankTrendLoading } =
    useProfilePlayoffRankTrend(resolvedUid, {
      enabled: fetchOverviewExtras,
      rankingLeague,
      wcStage: props.profileStatsContext.wcStage,
    });

  const {
    loading: playoffBracketLoading,
    playoffDisplayData,
    playoffScore,
    playoffBracketDoc,
    officialResults,
  } = useProfilePlayoffBracket(resolvedUid, { enabled: fetchBracketData });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(null);
  const [bracketReveal, setBracketReveal] = useState(false);

  useEffect(() => {
    if (!isMe) return;
    clearSideMenuOrigin();
    if (consumeOpenProfileSideMenu()) {
      setDrawerOpen(true);
    }
  }, [isMe]);

  const { unreadCount: menuUnreadCount } = useAnnouncementsUnread({
    enabled: isMe,
  });

  const m = t(language);
  const currentStreak = Math.max(
    0,
    (profile as { currentStreak?: number }).currentStreak ?? 0
  );

  const chartsReady = !resolvedUid || !statsLoading;
  const overviewStage = useProfileOverviewStage(chartsReady);

  useEffect(() => {
    if (tab !== "bracket") {
      setBracketReveal(false);
      return;
    }
    setBracketReveal(false);
    const id = window.requestAnimationFrame(() => setBracketReveal(true));
    return () => window.cancelAnimationFrame(id);
  }, [tab, playoffDisplayData?.season]);

  if (isMe && loadingPlan) {
    return (
      <div className="flex justify-center p-4">
        <CandleChartLoader />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
    <div className="mx-auto min-h-screen max-w-[640px] px-4 py-4 pb-bottom-nav text-white">
      <Suspense fallback={null}>
        <RankingsReturnNavLink language={language} />
      </Suspense>
      <ProfileKinetikHero
        key={resolvedUid ?? profile.handle}
        layout="mobile"
        language={language}
        profile={profile}
        summary={summary}
        summaryRanks={summaryRanks}
        metricValueDeltas={metricValueDeltas}
        profileStatsContext={props.profileStatsContext}
        winStreak={currentStreak}
        statsLoading={statsLoading}
        isMe={isMe}
        onOpenMenu={() => setDrawerOpen(true)}
        onToggleMetricsScope={onToggleStatsLeague}
        menuUnreadCount={isMe ? menuUnreadCount : 0}
        badges={resolvedBadges}
        onBadgeClick={(badge) => {
          setSelectedBadge(badge);
          setBadgeModalOpen(true);
        }}
      />

      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} />
      </div>

      <div className="mt-1">
        {tab === "overview" ? (
          <>
            {resolvedUid ? (
              <div className="mt-6 min-w-0 overflow-hidden">
                <ProfileSettledTodayResultsLazy
                  uid={resolvedUid}
                  language={language}
                  layout="mobile"
                  profileStatsContext={props.profileStatsContext}
                  viewerUid={isMe ? targetUid : null}
                  gamesRoutePrefix="/mobile"
                />
              </div>
            ) : null}
            {chartsReady ? (
            <div className="mt-6 space-y-4">
              {overviewStage >= 1 ? (
              <div className="min-w-0 overflow-hidden">
                {dailyTrendLoading ? (
                  <div className="h-44 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                ) : (
                  <ProfileDailyTrendChartLazy
                    data={dailyTrendForChart}
                    range="30d"
                    allowAll={currentIsProView}
                    language={language}
                  />
                )}
              </div>
              ) : null}
              {overviewStage >= 2 ? (
              <div className="min-w-0 overflow-hidden pt-0">
                <ProfilePlayoffRankTrendChartLazy
                  data={rankPlayoffTrendRows}
                  loading={rankTrendLoading}
                  language={language}
                />
              </div>
              ) : null}
              {overviewStage >= 3 ? (
              <div className="min-w-0 overflow-hidden">
                <StreakTrackerCardLazy
                  uid={resolvedUid}
                  language={language}
                  profileStatsContext={props.profileStatsContext}
                />
              </div>
              ) : null}
            </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-44 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          playoffBracketLoading ? (
            <div className={`${CYBER_GLASS_PANEL} mt-4 flex justify-center p-6`}>
              <CandleChartLoader />
            </div>
          ) : !playoffDisplayData ? (
            <div className={`${CYBER_GLASS_PANEL} mt-4 space-y-3 p-6 text-center`}>
              <p
                className={[
                  nameBebas.className,
                  "text-[clamp(1.75rem,9vw,2.7rem)] leading-none tracking-[0.22em]",
                ].join(" ")}
                style={cyberNoDataLabelStyle}
              >
                NO DATA
              </p>
            </div>
          ) : (
            <div
              className="relative mt-4 overflow-visible transition-all duration-500 ease-out"
              style={{
                opacity: bracketReveal ? 1 : 0,
                transform: bracketReveal
                  ? "translateY(0px)"
                  : "translateY(14px)",
                filter: bracketReveal ? "blur(0px)" : "blur(10px)",
              }}
            >
              <PlayoffFullBracketMobileLazy
                league="nba"
                score={playoffScore}
                season={playoffDisplayData.season}
                leftRound1={playoffDisplayData.leftRound1}
                leftRound2={playoffDisplayData.leftRound2}
                leftRound3={playoffDisplayData.leftRound3}
                leftRound4={playoffDisplayData.leftRound4}
                rightRound1={playoffDisplayData.rightRound1}
                rightRound2={playoffDisplayData.rightRound2}
                rightRound3={playoffDisplayData.rightRound3}
                rightRound4={playoffDisplayData.rightRound4}
                champion={playoffDisplayData.champion}
                bracket={playoffBracketDoc?.bracket}
                results={officialResults ?? undefined}
                hitLegend={{ language }}
                showGlassShell={false}
              />
            </div>
          )
        ) : currentIsProView ? (
          <ProAnalysisLazy />
        ) : isMe ? (
          myPlan === "pro" ? (
            <ProAnalysisLazy />
          ) : (
            <ProPreviewLazy />
          )
        ) : isMyPro && isTargetPro ? (
          <ProAnalysisLazy />
        ) : (
          <div className={`${CYBER_GLASS_PANEL} space-y-3 p-6 text-center`}>
            <p className="text-sm text-white/70">
              {m.pro.upgradeToSeeAll}
            </p>
          </div>
        )}
      </div>

      <SideMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenMenu={() => setDrawerOpen(true)}
        variant="mobile"
      />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          language={language}
          onClose={() => {
            setBadgeModalOpen(false);
            setSelectedBadge(null);
          }}
        />
      )}
    </div>
    </LazyMotion>
  );
}