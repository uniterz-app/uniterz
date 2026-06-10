"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

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
      <div className="p-6 text-center text-white/60">loading...</div>
    ),
  }
);

const ProPreviewLazy = dynamic(
  () => import("@/app/component/pro/analysis/ProPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-center text-white/60">loading...</div>
    ),
  }
);

const PlayoffFullBracketWebLazy = dynamic(
  () => import("@/app/component/predict/PlayoffFullBracketWeb"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center text-white/60">
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
import BadgeDetailModal from "@/app/web/badges/BadgeDetailModal";

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
import { nameBebas } from "@/lib/fonts";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  getProfileMaxStreakLabels,
  getProfileStatsTitle,
} from "@/lib/profile/profileStatsDisplay";
import {
  clearSideMenuOrigin,
  consumeOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";
import RankingsReturnNavLink from "@/app/component/profile/ui/RankingsReturnNavLink";
export default function WebProfileViewV2(props: ProfileViewPropsV2) {
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

  const { chartData, loading: dailyTrendLoading } =
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
  const maxStreak = profile.maxStreak ?? 0;
  const currentStreak = Math.max(0, (profile as { currentStreak?: number }).currentStreak ?? 0);

  const proSummaryTotal = 5;
  const summaryMountKey = `profile-summary-${resolvedUid ?? "x"}`;
  /** サマリーは stats だけで先に表示（体感速度優先） */
  const summaryReady = !resolvedUid || !statsLoading;
  /** チャート群は従来どおり全データ揃ってから表示 */
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
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-bottom-nav text-white">
      <Suspense fallback={null}>
        <RankingsReturnNavLink language={language} />
      </Suspense>
      <ProfileHeroCard
        key={heroUidKey}
        layout="web"
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
        currentStreak={currentStreak}
        canOpenSettings={canOpenSettings}
        onOpenSettings={() => setDrawerOpen(true)}
        menuUnreadCount={isMe ? menuUnreadCount : 0}
      >
        {resolvedBadges.length > 0 ? (
          <div className="flex flex-wrap content-start gap-1 sm:gap-1.5">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                type="button"
                title={b.title}
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-16 sm:w-16"
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

      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} size="lg" />
      </div>

      <div className="mt-6">
        {tab === "overview" ? (
          <>
            <div className="mt-4 mb-1 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className="text-cyan-200/85 transition hover:text-cyan-100"
              >
                ◀
              </button>
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className={[
                  nameBebas.className,
                  "text-center text-[clamp(1.6rem,3.8vw,2.35rem)] leading-none tracking-[0.12em] text-cyan-200/90 transition hover:text-cyan-100",
                ].join(" ")}
              >
                {statsTitle}
              </button>
              <button
                type="button"
                aria-label="Switch stats league"
                onClick={onToggleStatsLeague}
                className="text-cyan-200/85 transition hover:text-cyan-100"
              >
                ▶
              </button>
            </div>
            {summaryReady ? (
              <>
              <div key={summaryMountKey} className="min-h-[120px]">
              {currentIsProView ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryCardReveal
                      index={0}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="min-w-0"
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
                      className="min-w-0"
                    >
                      <MaxStreakCard
                        compact
                        maxStreak={maxStreak}
                        language={language}
                        streakLabels={maxStreakLabels}
                      />
                    </SummaryCardReveal>
                    <SummaryCardReveal
                      index={2}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="min-w-0"
                    >
                      <ScorePrecisionCard
                        compact
                        scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                        analyses={posts}
                        language={language}
                        totalPrecisionRank={summaryRanks?.totalPrecision ?? null}
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <SummaryCardReveal
                      index={3}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="min-w-0"
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
                    <SummaryCardReveal
                      index={4}
                      total={proSummaryTotal}
                      enabled={false}
                      enterVariant="fade"
                      className="min-w-0"
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
                    posts,
                    wins,
                    winRate: summary?.winRate ?? 0,
                    scorePrecisionSum: summary?.scorePrecisionSum ?? 0,
                    upsetPointsSum,
                    maxStreak,
                    pointsSumV3: totalPoints,
                  }}
                />
              )}
              </div>

            {overviewReady ? (
            <div className="mt-6 space-y-4">
              <div className="min-w-0 overflow-hidden">
                <ProfileDailyTrendChartLazy
                  data={chartData}
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
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <ProfileSettledTodayResultsLazy
                  uid={resolvedUid}
                  language={language}
                  layout="web"
                  profileStatsContext={props.profileStatsContext}
                  viewerUid={isMe ? targetUid : null}
                  gamesRoutePrefix="/web"
                />
              </div>
            </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-52 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-52 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
              </>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="h-36 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
                <div className="h-56 skeleton-scan rounded-2xl border border-white/10 bg-white/6" />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          playoffBracketLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
              loading...
            </div>
          ) : !playoffDisplayData ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
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
          <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
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