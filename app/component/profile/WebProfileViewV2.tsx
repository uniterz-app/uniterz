"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileEditSheet from "@/app/component/profile/ProfileEditSheet";
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

import ProfileKinetikHero from "./ui/ProfileKinetikHero";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";
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
import { readTutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import { readTutorialWelcomeHandoff } from "@/lib/tutorial/tutorialWelcomeHandoff";
import type { Language } from "@/lib/i18n/language";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { nameBebas } from "@/lib/fonts";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  clearSideMenuOrigin,
  consumeOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";
import RankingsReturnNavLink from "@/app/component/profile/ui/RankingsReturnNavLink";
import ProfileAwardsTab from "./ProfileAwardsTab";
import ProfileMonthlyReportPanel from "./ProfileMonthlyReportPanel";
import ProfileReportDeliveryOverlay from "./ProfileReportDeliveryOverlay";
import ProfileProSkinUnlockOverlay from "./pro/ProfileProSkinUnlockOverlay";
import Tabs from "./ui/Tabs";
import { useProReportDeliveryOverlay } from "@/lib/reports/useProReportDeliveryOverlay";
import { useProSkinUnlockOverlay } from "@/lib/profile/useProSkinUnlockOverlay";
import {
  profileVisualEffectsForViewer,
  isProfileVisualLite,
} from "@/lib/profile/profileVisualEffects";
import { useProfileViewCount } from "@/lib/profile/useProfileViewCount";
export default function WebProfileViewV2(props: ProfileViewPropsV2) {
  const { profile, tab, setTab, summary, summaryRanks, metricValueDeltas, targetUid, statsLoading } =
    props;
  const rankingLeague = props.profileStatsContext.rankingLeague;

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
  const visualEffects = profileVisualEffectsForViewer(isMe);
  const visualEffectsLite = isProfileVisualLite(visualEffects);
  const { count: profileViewCount } = useProfileViewCount(resolvedUid);

  const reportOverlayEnabled =
    Boolean(isMe && !loadingPlan && (currentIsProView || myPlan === "pro"));
  const { active: reportOverlay, dismiss: dismissReportOverlay } =
    useProReportDeliveryOverlay({
      uid: resolvedUid,
      enabled: reportOverlayEnabled,
    });
  const skinUnlockEnabled =
    Boolean(isMe && resolvedUid) && reportOverlay == null;
  const {
    activeIds: skinUnlockIds,
    ownerCounts: skinUnlockOwnerCounts,
    preview: skinUnlockPreview,
    dismiss: dismissSkinUnlock,
  } = useProSkinUnlockOverlay({
    uid: resolvedUid,
    enabled: skinUnlockEnabled,
  });

  const fetchOverviewExtras = tab === "overview";
  const fetchBracketData = tab === "bracket";

  const { resolvedBadges } = useProfileBadges(resolvedUid);

  const { chartData, loading: dailyTrendLoading } =
    useProfileDailyTrendChart(resolvedUid, {
      enabled: fetchOverviewExtras && !statsLoading,
      seedRows: props.profileDailyTrendSeed ?? undefined,
      seedComplete: props.profileDailyTrendSeedComplete,
      rankingLeague,
    });

  const { chartRows: rankPlayoffTrendRows, loading: rankTrendLoading } =
    useProfilePlayoffRankTrend(resolvedUid, {
      enabled: fetchOverviewExtras && !statsLoading,
      rankingLeague,
      seedPoints: props.profileRankTrendSeed ?? undefined,
      seedComplete: props.profileRankTrendSeedComplete,
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
  const [welcomeProfileFly, setWelcomeProfileFly] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [bracketReveal, setBracketReveal] = useState(false);

  useEffect(() => {
    if (!isMe) return;
    clearSideMenuOrigin();
    if (consumeOpenProfileSideMenu()) {
      setDrawerOpen(true);
    }
  }, [isMe]);

  useEffect(() => {
    const sync = () => {
      setWelcomeProfileFly(
        readTutorialLivePhase() === "welcome" &&
          readTutorialWelcomeHandoff() === "profile"
      );
    };
    sync();
    window.addEventListener("uniterz-tutorial-welcome-handoff", sync);
    return () => {
      window.removeEventListener("uniterz-tutorial-welcome-handoff", sync);
    };
  }, []);

  const { unreadCount: menuUnreadCount } = useAnnouncementsUnread({
    enabled: isMe,
  });

  const currentStreak = Math.max(
    0,
    (profile as { currentStreak?: number }).currentStreak ?? 0
  );

  const chartsReady = Boolean(resolvedUid);
  const overviewStage = useProfileOverviewStage(chartsReady, {
    instant: visualEffectsLite,
  });

  useEffect(() => {
    if (tab !== "bracket") {
      setBracketReveal(false);
      return;
    }
    if (visualEffectsLite) {
      setBracketReveal(true);
      return;
    }
    setBracketReveal(false);
    const id = window.requestAnimationFrame(() => setBracketReveal(true));
    return () => window.cancelAnimationFrame(id);
  }, [tab, playoffDisplayData?.season, visualEffectsLite]);

  // BRACKET タブは当面非表示（実装が揃うまで）
  useEffect(() => {
    if (tab === "bracket") setTab("overview");
  }, [tab, setTab]);

  if (isMe && loadingPlan && !welcomeProfileFly) {
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
        menuUnreadCount={isMe ? menuUnreadCount : 0}
        badges={resolvedBadges}
        onBadgeClick={(badge) => {
          setSelectedBadge(badge);
          setBadgeModalOpen(true);
        }}
        visualEffects={visualEffects}
        targetUid={resolvedUid}
        profileViewCount={profileViewCount}
      />

      {isMe ? (
        <ProfileMenuEdgeHandle
          onOpen={() => setDrawerOpen(true)}
          unreadCount={menuUnreadCount}
          hidden={drawerOpen || welcomeProfileFly}
        />
      ) : null}

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          size="lg"
          layout="split"
          showBracket={false}
        />
        {tab === "overview" ? (
          <>
            <div className="mt-6 w-full min-w-0 space-y-4 overflow-visible">
            {resolvedUid ? (
              <div className="w-full min-w-0">
                <ProfileSettledTodayResultsLazy
                  uid={resolvedUid}
                  language={language}
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                  viewerUid={isMe ? targetUid : null}
                  gamesRoutePrefix="/web"
                  visualEffects={visualEffects}
                />
              </div>
            ) : null}
            {chartsReady ? (
            <div className="w-full min-w-0 space-y-4">
              {overviewStage >= 1 ? (
              <div className="w-full min-w-0 overflow-visible pt-0">
                <ProfilePlayoffRankTrendChartLazy
                  data={rankPlayoffTrendRows}
                  loading={rankTrendLoading}
                  language={language}
                  visualEffectsLite={visualEffectsLite}
                />
              </div>
              ) : null}
              {overviewStage >= 2 && resolvedUid ? (
              <div className="min-w-0 overflow-visible">
                <StreakTrackerCardLazy
                  uid={resolvedUid}
                  language={language}
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                  seedLast20={props.profileLast20Seed}
                />
              </div>
              ) : null}
              {overviewStage >= 3 ? (
              <div className="min-w-0 overflow-visible">
                {dailyTrendLoading ? (
                  <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                ) : (
                  <ProfileDailyTrendChartLazy
                    data={chartData}
                    range="30d"
                    allowAll={currentIsProView}
                    language={language}
                    rankingLeague={rankingLeague}
                    visualEffects={visualEffects}
                  />
                )}
              </div>
              ) : null}
            </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
            </div>
          </>
        ) : tab === "report" ? (
          <ProfileMonthlyReportPanel
            uid={resolvedUid}
            language={language}
            canViewReport={
              currentIsProView || (isMe ? myPlan === "pro" : isMyPro && isTargetPro)
            }
            showUpgrade={isMe && !currentIsProView && myPlan !== "pro"}
          />
        ) : tab === "awards" ? (
          <ProfileAwardsTab
            uid={resolvedUid}
            language={language === "ja" ? "ja" : "en"}
          />
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
              style={
                visualEffectsLite
                  ? undefined
                  : {
                      opacity: bracketReveal ? 1 : 0,
                      transform: bracketReveal
                        ? "translateY(0px)"
                        : "translateY(14px)",
                      filter: bracketReveal ? "blur(0px)" : "blur(10px)",
                    }
              }
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
        ) : null}
      </div>

      <SideMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenProfileEdit={() => {
          setDrawerOpen(false);
          setProfileEditOpen(true);
        }}
        variant="web"
        from="right"
      />

      {profileEditOpen
        ? createPortal(
            <ProfileEditSheet
              onClose={() => setProfileEditOpen(false)}
              reopenMenu={() => setDrawerOpen(true)}
            />,
            document.body
          )
        : null}

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

      {reportOverlay ? (
        <ProfileReportDeliveryOverlay
          active={reportOverlay}
          language={language === "ja" ? "ja" : "en"}
          onDismiss={dismissReportOverlay}
        />
      ) : null}

      {skinUnlockIds && skinUnlockIds.length > 0 ? (
        <ProfileProSkinUnlockOverlay
          unlockedIds={skinUnlockIds}
          language={language === "ja" ? "ja" : "en"}
          preview={skinUnlockPreview}
          platform="web"
          ownerCounts={skinUnlockOwnerCounts}
          onDismiss={dismissSkinUnlock}
        />
      ) : null}
    </div>
    </LazyMotion>
  );
}