"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";
import SummaryCardReveal from "./ui/SummaryCardReveal";
import ProfileHeroCard from "./ui/ProfileHeroCard";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/mobile/badges/BadgeDetailModal";
import ScoringRulesChangeNoticeModal from "@/app/component/profile/ScoringRulesChangeNoticeModal";

import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";
import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import StreakTrackerCard from "@/app/component/profile/ui/StreakTrackerCard";

import AnalysisWinCard from "./ui/summary/AnalysisWinCard";
import TotalScoreCard from "./ui/summary/TotalScoreCard";
import ScorePrecisionCard from "./ui/summary/ScorePrecisionCard";
import UpsetCard from "./ui/summary/UpsetCard";
import MaxStreakCard from "./ui/summary/MaxStreakCard";

import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";

import { useProfilePlan } from "@/lib/profile/useProfilePlan";
import {
  useProfileBadges,
  type ResolvedBadge,
} from "@/lib/profile/useProfileBadges";
import { useProfileDailyTrend } from "@/lib/profile/useProfileDailyTrend";
import { useProfilePlayoffBracket } from "@/lib/profile/useProfilePlayoffBracket";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";

export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    history.scrollRestoration = "manual";
  }, []);

  const { profile, tab, setTab, range, setRange, summary, targetUid, statsLoading } =
    props;

  const resolvedUid = typeof targetUid === "string" ? targetUid : null;
  const isTargetGuestProfile = !targetUid;

  const { language } = useUserLanguage(resolvedUid);

  const displayProfile = isTargetGuestProfile
    ? {
        ...profile,
        displayName: "Guest User",
        handle: "@guest",
        bio:
          language === "en"
            ? "Log in to create your profile."
            : "ログインするとプロフィールを作成できます",
        counts: { followers: 0, following: 0 },
        currentStreak: 0,
        maxStreak: 0,
        plan: "free",
      }
    : profile;

  const {
    myPlan,
    loadingPlan,
    isMe,
    isMyPro,
    isTargetPro,
    isProView,
  } = useProfilePlan({
    targetUid,
    profilePlan: displayProfile.plan,
  });

  const forceProView = false;
  const currentIsProView = forceProView || isProView;

  const { resolvedBadges } = useProfileBadges(resolvedUid);

  const { chartData: dailyTrendForChart, loading: dailyTrendLoading } =
    useProfileDailyTrend(resolvedUid);

  const {
    loading: playoffBracketLoading,
    playoffDisplayData,
    playoffScore,
    playoffBracketDoc,
    officialResults,
  } = useProfilePlayoffBracket(resolvedUid);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(null);

  const canOpenSettings = isMe || isTargetGuestProfile;

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

  const maxStreak = displayProfile.maxStreak ?? 0;
  const currentStreak = Math.max(
    0,
    (displayProfile as any)?.currentStreak ?? 0
  );
  const showCurrentStreakBadge = currentStreak >= 3;

  const proSummaryTotal = 5;
  const summaryMountKey = `profile-summary-${resolvedUid ?? "guest"}-${range}`;
  /** ログイン時は成績APIと日次トレンドの両方が揃うまでサマリー・グラフとも出さない（グラフだけ先に出るのを防ぐ） */
  const overviewReady =
    !resolvedUid || (!statsLoading && !dailyTrendLoading);

  const summaryEntranceLockedRef = useRef(false);
  useEffect(() => {
    if (tab !== "overview") summaryEntranceLockedRef.current = true;
  }, [tab]);
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

  const heroUidKey = resolvedUid ?? "guest";
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
    <div className="mx-auto min-h-screen max-w-[640px] px-4 py-4 pb-bottom-nav text-white">
      <ProfileHeroCard
        key={heroUidKey}
        layout="mobile"
        playEntrance={playHeroEntrance}
        onEntranceComplete={() => setHeroEntranceLocked(true)}
        language={language}
        displayProfile={{
          displayName: displayProfile.displayName,
          handle: displayProfile.handle,
          bio: displayProfile.bio,
          avatarUrl: displayProfile.avatarUrl,
        }}
        showCurrentStreakBadge={showCurrentStreakBadge}
        currentStreak={currentStreak}
        canOpenSettings={canOpenSettings}
        onOpenSettings={() => setDrawerOpen(true)}
      >
        {resolvedBadges.length > 0 ? (
          <div className="grid grid-cols-5 gap-0.5">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="h-11 w-11 overflow-hidden rounded-lg"
                onClick={() => {
                  setSelectedBadge(b);
                  setBadgeModalOpen(true);
                }}
              >
                <img
                  src={b.icon}
                  alt={b.title}
                  className="h-full w-full object-contain"
                />
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
            {overviewReady ? (
              <>
              <div key={summaryMountKey} className="min-h-[100px]">
              {currentIsProView ? (
                <>
                  <div className="grid grid-cols-5 items-stretch gap-3">
                    <SummaryCardReveal
                      index={0}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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
                      enabled={playSummaryEntrance}
                      enterVariant="fade"
                      className="col-span-2 h-full min-w-0"
                    >
                      <MaxStreakCard
                        compact
                        maxStreak={maxStreak}
                        language={language}
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-2 items-stretch gap-3">
                    <SummaryCardReveal
                      index={2}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
                      enterVariant="fade"
                      className="h-full min-w-0"
                    >
                      <ScorePrecisionCard
                        compact
                        scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                        analyses={posts}
                        language={language}
                      />
                    </SummaryCardReveal>

                    <SummaryCardReveal
                      index={3}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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
                      />
                    </SummaryCardReveal>
                  </div>

                  <div className="mt-3 grid grid-cols-5 items-stretch gap-3">
                    <SummaryCardReveal
                      index={4}
                      total={proSummaryTotal}
                      enabled={playSummaryEntrance}
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

            <div className="mb-3 mt-3 flex justify-center">
              <PeriodToggle value={range} onChange={setRange} language={language} />
            </div>

            <div className="mt-6 space-y-4">
              <SummaryCardReveal
                index={5}
                total={7}
                enabled={playSummaryEntrance}
                className="min-w-0 overflow-hidden"
                onAnimationComplete={onChartRevealComplete}
              >
                <DailyTrendCard
                  data={dailyTrendForChart}
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
                total={7}
                enabled={playSummaryEntrance}
                className="min-w-0 overflow-hidden"
              >
                <StreakTrackerCard uid={resolvedUid} language={language} />
              </SummaryCardReveal>
            </div>
              </>
            ) : null}
          </>
        ) : tab === "bracket" ? (
          isTargetGuestProfile ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">
                {language === "en"
                  ? "Guest profiles can't view the bracket."
                  : "ゲストプロフィールではブラケットを表示できません。"}
              </p>
            </div>
          ) : playoffBracketLoading ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">loading...</p>
            </div>
          ) : !playoffDisplayData ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">
                {language === "en"
                  ? "The bracket hasn't been submitted yet."
                  : "まだブラケットは提出されていません。"}
              </p>
            </div>
          ) : (
            <div className="relative mt-4 overflow-visible">
              <PlayoffFullBracketMobile
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
        ) : isTargetGuestProfile ? (
          <ProPreview />
        ) : currentIsProView ? (
          <ProAnalysis />
        ) : isMe ? (
          myPlan === "pro" ? (
            <ProAnalysis />
          ) : (
            <ProPreview />
          )
        ) : isMyPro && isTargetPro ? (
          <ProAnalysis />
        ) : (
          <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/70">
              {language === "en"
                ? "This user isn't on the Pro plan."
                : "対象ユーザーはProプランに加入していません。"}
            </p>
          </div>
        )}
      </div>

      <SideMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ScoringRulesChangeNoticeModal
        language={language}
        enabled={!!resolvedUid}
      />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setBadgeModalOpen(false)}
        />
      )}
    </div>
  );
}