"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";

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
      <div className="p-6 text-center text-sm text-white/70">loading...</div>
    ),
  }
);

const ProPreviewLazy = dynamic(
  () => import("@/app/component/pro/analysis/ProPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-center text-sm text-white/70">loading...</div>
    ),
  }
);

const PlayoffFullBracketMobileLazy = dynamic(
  () => import("@/app/component/predict/PlayoffFullBracketMobile"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 min-h-[280px] rounded-2xl border border-white/15 bg-white/5 p-6 text-center text-sm text-white/70">
        loading...
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
import SummaryCardsV2 from "./ui/SummaryCardsV2";
import SummaryCardReveal from "./ui/SummaryCardReveal";
import ProfileHeroCard from "./ui/ProfileHeroCard";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/mobile/badges/BadgeDetailModal";

import AnalysisWinCard from "./ui/summary/AnalysisWinCard";
import TotalScoreCard from "./ui/summary/TotalScoreCard";
import ScorePrecisionCard from "./ui/summary/ScorePrecisionCard";
import UpsetCard from "./ui/summary/UpsetCard";
import MaxStreakCard from "./ui/summary/MaxStreakCard";

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
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  getProfileActiveStreakBadgeLabel,
  getProfileMaxStreakLabels,
  getProfileStatsTitle,
} from "@/lib/profile/profileStatsDisplay";
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

  const { profile, tab, setTab, summary, summaryRanks, targetUid, statsLoading } =
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

  const canOpenSettings = isMe;

  const { unreadCount: menuUnreadCount } = useAnnouncementsUnread({
    enabled: isMe,
  });

  const posts = summary?.posts ?? 0;
  const wins = (summary as any)?.wins ?? 0;
  const totalPoints = summary?.pointsSumV3 ?? 0;

  const upsetBonusSum = summary?.upsetBonusSum ?? 0;
  const streakBonusSum = summary?.streakBonusSum ?? 0;
  const basePointsSum =
    summary?.basePointsSum ??
    Math.max(0, totalPoints - upsetBonusSum - streakBonusSum);

  const upsetPointsSum = summary?.upsetPointsSum ?? 0;
  const upsetChanceCount = (summary as any)?.upsetChanceCount ?? 0;
  const upsetHitCount = (summary as any)?.upsetHitCount ?? 0;

  const m = t(language);
  const periodLabel =
    rankingLeague === "worldcup" ? "World Cup" : m.profile.playoffs;
  const statsTitle = useMemo(
    () => getProfileStatsTitle(props.profileStatsContext, language),
    [language, props.profileStatsContext]
  );
  const maxStreakLabels = useMemo(
    () => getProfileMaxStreakLabels(props.profileStatsContext, language),
    [language, props.profileStatsContext]
  );
  const activeStreakBadgeLabel = useMemo(
    () => getProfileActiveStreakBadgeLabel(props.profileStatsContext, language),
    [language, props.profileStatsContext]
  );

  const maxStreak = profile.maxStreak ?? 0;
  const currentStreak = Math.max(
    0,
    (profile as any)?.currentStreak ?? 0
  );
  const showCurrentStreakBadge = currentStreak >= 3;

  const proSummaryTotal = 5;
  const summaryMountKey = `profile-summary-${resolvedUid ?? "x"}`;
  /** 成績APIと日次トレンドの両方が揃うまでサマリー・グラフを出さない */
  const summaryReady = !resolvedUid || !statsLoading;
  const overviewReady =
    !resolvedUid ||
    (!statsLoading && !dailyTrendLoading && !rankTrendLoading);

  useEffect(() => {
    if (tab !== "bracket") {
      setBracketReveal(false);
      return;
    }
    setBracketReveal(false);
    const id = window.requestAnimationFrame(() => setBracketReveal(true));
    return () => window.cancelAnimationFrame(id);
  }, [tab, playoffDisplayData?.season]);

  const heroUidKey = resolvedUid ?? "x";
  const prevHeroUidRef = useRef(heroUidKey);
  const [heroEntranceLocked, setHeroEntranceLocked] = useState(false);
  useEffect(() => {
    if (prevHeroUidRef.current !== heroUidKey) {
      setHeroEntranceLocked(false);
      prevHeroUidRef.current = heroUidKey;
    }
  }, [heroUidKey]);
  const playHeroEntrance = !heroEntranceLocked;

  if (isMe && loadingPlan) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  return (
    <LazyMotion features={domAnimation}>
    <div className="mx-auto min-h-screen max-w-[640px] px-4 py-4 pb-bottom-nav text-white">
      <Suspense fallback={null}>
        <RankingsReturnNavLink language={language} />
      </Suspense>
      <ProfileHeroCard
        key={heroUidKey}
        layout="mobile"
        playEntrance={playHeroEntrance}
        onEntranceComplete={() => setHeroEntranceLocked(true)}
        language={language}
        displayProfile={{
          displayName: profile.displayName,
          handle: profile.handle,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
        }}
        showProBadge={isProView}
        showCurrentStreakBadge={showCurrentStreakBadge}
        currentStreak={currentStreak}
        currentStreakLabel={activeStreakBadgeLabel}
        canOpenSettings={canOpenSettings}
        onOpenSettings={() => setDrawerOpen(true)}
        menuUnreadCount={isMe ? menuUnreadCount : 0}
      >
        {resolvedBadges.length > 0 ? (
          <div className="flex flex-wrap content-start gap-1.5 sm:gap-2">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                type="button"
                title={b.title}
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-16 sm:w-16"
                onClick={() => {
                  setSelectedBadge(b);
                  setBadgeModalOpen(true);
                }}
              >
                {b.icon ? (
                  <img
                    src={b.icon}
                    alt={b.title}
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <span className="truncate px-0.5 text-center text-[9px] leading-tight text-white/55">
                    {b.title}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </ProfileHeroCard>

      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} />
      </div>

      <div className="mt-1">
        {tab === "overview" ? (
          <>
            <div className="mt-4 mb-0.5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className="text-cyan-200/85 transition active:scale-[0.98]"
              >
                ◀
              </button>
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className={[
                  nameBebas.className,
                  "text-center text-[clamp(1.25rem,5.9vw,1.7rem)] leading-none tracking-[0.12em] text-cyan-200/90 transition active:scale-[0.98]",
                ].join(" ")}
              >
                {statsTitle}
              </button>
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className="text-cyan-200/85 transition active:scale-[0.98]"
              >
                ▶
              </button>
            </div>
            {summaryReady ? (
              <>
              <div key={summaryMountKey} className="min-h-[100px]">
              {currentIsProView ? (
                <>
                  <div className="grid grid-cols-5 items-stretch gap-3">
                    <SummaryCardReveal
                      index={0}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="col-span-3 h-full min-w-0"
                    >
                      <AnalysisWinCard
                        posts={posts}
                        wins={wins}
                        language={language}
                      />
                    </SummaryCardReveal>

                    <SummaryCardReveal
                      index={1}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="col-span-2 h-full min-w-0"
                    >
                      <MaxStreakCard
                        compact
                        maxStreak={maxStreak}
                        language={language}
                        streakLabels={maxStreakLabels}
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-2 items-stretch gap-3">
                    <SummaryCardReveal
                      index={2}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="h-full min-w-0"
                    >
                      <ScorePrecisionCard
                        compact
                        scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                        analyses={posts}
                        language={language}
                        totalPrecisionRank={summaryRanks?.totalPrecision ?? null}
                      />
                    </SummaryCardReveal>

                    <SummaryCardReveal
                      index={3}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="h-full min-w-0"
                    >
                      <UpsetCard
                        compact
                        upsetPointsSum={upsetPointsSum}
                        analyses={posts}
                        upsetChanceCount={upsetChanceCount}
                        upsetHitCount={upsetHitCount}
                        language={language}
                        totalUpsetRank={summaryRanks?.totalUpset ?? null}
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-5 items-stretch gap-3">
                    <SummaryCardReveal
                      index={4}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="col-span-5 h-full min-w-0"
                    >
                      <TotalScoreCard
                        compact
                        periodLabel={periodLabel}
                        totalPoints={totalPoints}
                        analyses={posts}
                        basePoints={basePointsSum}
                        upsetBonusPoints={upsetBonusSum}
                        streakBonusPoints={streakBonusSum}
                        language={language}
                        totalPointsRank={summaryRanks?.totalPoints ?? null}
                      />
                    </SummaryCardReveal>
                  </div>
                </>
              ) : (
                <SummaryCardsV2
                  compact
                  period="30d"
                  summaryRanks={summaryRanks}
                  language={language}
                  reveal={false}
                  maxStreakLabel={maxStreakLabels.title}
                  maxStreakTooltip={maxStreakLabels.tooltip}
                  data={{
                    fullPosts: summary?.fullPosts ?? 0,
                    recent3Posts: summary?.recent3Posts ?? 0,
                    posts: summary?.posts ?? 0,
                    wins: (summary as any)?.wins ?? 0,
                    winRate: summary?.winRate ?? 0,
                    scorePrecisionSum: summary?.scorePrecisionSum ?? 0,
                    upsetPointsSum: summary?.upsetPointsSum ?? 0,
                    maxStreak,
                    pointsSumV3: summary?.pointsSumV3 ?? 0,
                  }}
                />
              )}
              </div>

            {overviewReady ? (
            <div className="mt-6 space-y-4">
              <div className="min-w-0 overflow-hidden">
                <ProfileDailyTrendChartLazy
                  data={dailyTrendForChart}
                  range="30d"
                  allowAll={currentIsProView}
                  language={language}
                />
              </div>
              <div className="min-w-0 overflow-hidden pt-0">
                <ProfilePlayoffRankTrendChartLazy
                  data={rankPlayoffTrendRows}
                  loading={rankTrendLoading}
                  language={language}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <StreakTrackerCardLazy
                  uid={resolvedUid}
                  language={language}
                  profileStatsContext={props.profileStatsContext}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <ProfileSettledTodayResultsLazy
                  uid={resolvedUid}
                  language={language}
                  layout="mobile"
                  profileStatsContext={props.profileStatsContext}
                  viewerUid={isMe ? targetUid : null}
                  gamesRoutePrefix="/mobile"
                />
              </div>
            </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
              </>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          playoffBracketLoading ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">loading...</p>
            </div>
          ) : !playoffDisplayData ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
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
          <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
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