"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Suspense, useEffect, useState } from "react";

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
      <div className="min-h-[248px] rounded-2xl bg-white/5" aria-hidden />
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

const PlayoffFullBracketWebLazy = dynamic(
  () => import("@/app/component/predict/PlayoffFullBracketWeb"),
  {
    ssr: false,
    loading: () => (
      <div className={`${CYBER_GLASS_PANEL} flex min-h-[320px] items-center justify-center p-6`}>
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
import BadgeDetailModal from "@/app/web/badges/BadgeDetailModal";

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
import { nameBebas } from "@/lib/fonts";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  clearSideMenuOrigin,
  consumeOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";
import RankingsReturnNavLink from "@/app/component/profile/ui/RankingsReturnNavLink";
export default function WebProfileViewV2(props: ProfileViewPropsV2) {
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

  const { chartData, loading: dailyTrendLoading } =
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

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-bottom-nav text-white">
      <Suspense fallback={null}>
        <RankingsReturnNavLink language={language} />
      </Suspense>
      <ProfileKinetikHero
        key={resolvedUid ?? profile.handle}
        layout="web"
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

      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} size="lg" />
      </div>

      <div className="mt-6">
        {tab === "overview" ? (
          <>
            {resolvedUid ? (
              <div className="mt-6 min-w-0 overflow-hidden">
                <ProfileSettledTodayResultsLazy
                  uid={resolvedUid}
                  language={language}
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                  viewerUid={isMe ? targetUid : null}
                  gamesRoutePrefix="/web"
                />
              </div>
            ) : null}
            {chartsReady ? (
            <div className="mt-6 space-y-4">
              {overviewStage >= 1 ? (
              <div className="min-w-0 overflow-hidden">
                {dailyTrendLoading ? (
                  <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                ) : (
                  <ProfileDailyTrendChartLazy
                    data={chartData}
                    range="30d"
                    allowAll={currentIsProView}
                    language={language}
                    rankingLeague={rankingLeague}
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
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                />
              </div>
              ) : null}
            </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          playoffBracketLoading ? (
            <div className={`${CYBER_GLASS_PANEL} flex justify-center p-6`}>
              <CandleChartLoader />
            </div>
          ) : !playoffDisplayData ? (
            <div className={`${CYBER_GLASS_PANEL} p-6 text-center`}>
              <p
                className={[
                  nameBebas.className,
                  "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
                ].join(" ")}
                style={cyberNoDataLabelStyle}
              >
                NO DATA
              </p>
            </div>
          ) : (
            <div
              className="mt-2 overflow-visible transition-all duration-500 ease-out sm:mt-0"
              style={{
                opacity: bracketReveal ? 1 : 0,
                transform: bracketReveal
                  ? "translateY(0px)"
                  : "translateY(14px)",
                filter: bracketReveal ? "blur(0px)" : "blur(10px)",
              }}
            >
              <PlayoffFullBracketWebLazy
                league="nba"
                score={playoffScore}
                {...playoffDisplayData}
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
          myPlan === "pro" ? <ProAnalysisLazy /> : <ProPreviewLazy />
        ) : isMyPro && isTargetPro ? (
          <ProAnalysisLazy />
        ) : (
          <div className={`${CYBER_GLASS_PANEL} p-6 text-center`}>
            {m.pro.upgradeToSeeAll}
          </div>
        )}
      </div>

      <SideMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenMenu={() => setDrawerOpen(true)}
        variant="web"
      />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          language={language as Language}
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