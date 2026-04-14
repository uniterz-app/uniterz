"use client";

import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

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

const ProfileNbaPredictionMapLazy = dynamic(
  () => import("@/app/component/profile/ui/ProfileNbaPredictionMap"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[360px] rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";
import SummaryCardReveal from "./ui/SummaryCardReveal";
import ProfileHeroCard from "./ui/ProfileHeroCard";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/web/badges/BadgeDetailModal";
import ScoringRulesChangeNoticeModal from "@/app/component/profile/ScoringRulesChangeNoticeModal";

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
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import {
  clearSideMenuOrigin,
  consumeOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";

export default function WebProfileViewV2(props: ProfileViewPropsV2) {
  const { profile, tab, setTab, range, setRange, summary, targetUid, statsLoading } =
    props;

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

  const periodLabel =
    range === "7d"
      ? language === "en"
        ? "Last 7 days"
        : "7日"
      : range === "30d"
      ? language === "en"
        ? "Last 30 days"
        : "30日"
      : language === "en"
      ? "All"
      : "All";

  const maxStreak = profile.maxStreak ?? 0;
  const currentStreak = Math.max(
    0,
    (profile as any)?.currentStreak ?? 0
  );
  const showCurrentStreakBadge = currentStreak >= 3;

  const proSummaryTotal = 5;
  const summaryMountKey = `profile-summary-${resolvedUid ?? "x"}-${range}`;
  /** 成績APIと日次トレンドの両方が揃うまでサマリー・グラフを出さない */
  const overviewReady =
    !resolvedUid || (!statsLoading && !dailyTrendLoading);

  const summaryEntranceLockedRef = useRef(false);
  useEffect(() => {
    if (tab !== "overview") summaryEntranceLockedRef.current = true;
  }, [tab]);
  useEffect(() => {
    if (tab !== "bracket") {
      setBracketReveal(false);
      return;
    }
    setBracketReveal(false);
    const id = window.requestAnimationFrame(() => setBracketReveal(true));
    return () => window.cancelAnimationFrame(id);
  }, [tab, playoffDisplayData?.season]);
  const playSummaryEntrance =
    !summaryEntranceLockedRef.current && !statsLoading && overviewReady;

  const [chartEntranceDone, setChartEntranceDone] = useState(false);
  const onChartRevealComplete = useCallback(() => {
    setChartEntranceDone(true);
  }, []);

  useEffect(() => {
    if (!overviewReady) setChartEntranceDone(false);
  }, [overviewReady]);

  useEffect(() => {
    if (!playSummaryEntrance) setChartEntranceDone(true);
  }, [playSummaryEntrance]);

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
        showCurrentStreakBadge={showCurrentStreakBadge}
        currentStreak={currentStreak}
        canOpenSettings={canOpenSettings}
        onOpenSettings={() => setDrawerOpen(true)}
        menuUnreadCount={isMe ? menuUnreadCount : 0}
      >
        {resolvedBadges.length > 0 ? (
          <div className="grid grid-cols-10 gap-0.5">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="h-12 w-12 rounded-lg"
                onClick={() => {
                  setSelectedBadge(b);
                  setBadgeModalOpen(true);
                }}
              >
                <img
                  src={b.icon}
                  alt={b.title}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </ProfileHeroCard>

      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} size="lg" />
        {tab === "overview" && (
          <PeriodToggle value={range} onChange={setRange} language={language} />
        )}
      </div>

      <div className="mt-6">
        {tab === "overview" ? (
          <>
            {overviewReady ? (
              <>
              <div key={summaryMountKey} className="min-h-[120px]">
              {currentIsProView ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryCardReveal
                      index={0}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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
                      enabled={playSummaryEntrance}
                      className="min-w-0"
                    >
                      <MaxStreakCard
                        compact
                        maxStreak={maxStreak}
                        language={language}
                      />
                    </SummaryCardReveal>
                    <SummaryCardReveal
                      index={2}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
                      enterVariant="fade"
                      className="min-w-0"
                    >
                      <ScorePrecisionCard
                        compact
                        scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                        analyses={posts}
                        language={language}
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <SummaryCardReveal
                      index={3}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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
                      />
                    </SummaryCardReveal>
                    <SummaryCardReveal
                      index={4}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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
                      />
                    </SummaryCardReveal>
                  </div>
                </>
              ) : (
                <SummaryCardsV2
                  compact
                  period={range}
                  language={language}
                  reveal={playSummaryEntrance}
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

            <div className="mt-6 space-y-4">
              <SummaryCardReveal
                index={5}
                total={8}
                enabled={playSummaryEntrance}
                className="min-w-0 overflow-hidden"
                onAnimationComplete={onChartRevealComplete}
              >
                <ProfileDailyTrendChartLazy
                  data={chartData}
                  range={range}
                  allowAll={currentIsProView}
                  language={language}
                  entranceSync
                  rechartsAfterEntrance={
                    !playSummaryEntrance || chartEntranceDone
                  }
                />
              </SummaryCardReveal>
              <SummaryCardReveal
                index={6}
                total={8}
                enabled={playSummaryEntrance}
                className="min-w-0 overflow-hidden"
              >
                <StreakTrackerCardLazy
                  uid={resolvedUid}
                  language={language}
                  layout="web"
                  entranceReady={!playSummaryEntrance || chartEntranceDone}
                />
              </SummaryCardReveal>
              <SummaryCardReveal
                index={7}
                total={8}
                enabled={playSummaryEntrance}
                className="min-w-0 overflow-hidden"
              >
                <div className="pt-0">
                  <ProfileNbaPredictionMapLazy
                    uid={resolvedUid}
                    language={language}
                  />
                </div>
              </SummaryCardReveal>
            </div>
              </>
            ) : null}
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
            {language === "en"
              ? "This user isn't on the Pro plan."
              : "対象ユーザーはPro未加入"}
          </div>
        )}
      </div>

      <SideMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenMenu={() => setDrawerOpen(true)}
        variant="web"
      />

      <ScoringRulesChangeNoticeModal
        language={language}
        enabled={!!resolvedUid}
      />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
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