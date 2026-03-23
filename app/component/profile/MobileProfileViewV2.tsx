"use client";

import React, { useEffect, useState } from "react";
import { Menu, Flame } from "lucide-react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/mobile/badges/BadgeDetailModal";

import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";
import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";

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

export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    history.scrollRestoration = "manual";
  }, []);

  const { profile, tab, setTab, range, setRange, summary, targetUid } = props;

  const resolvedUid = typeof targetUid === "string" ? targetUid : null;
  const isTargetGuestProfile = !targetUid;

  const displayProfile = isTargetGuestProfile
    ? {
        ...profile,
        displayName: "Guest User",
        handle: "@guest",
        bio: "ログインするとプロフィールを作成できます",
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
    profilePlan: (displayProfile as any).plan,
  });

  const forceProView = false;
  const currentIsProView = forceProView || isProView;

  const { resolvedBadges } = useProfileBadges(resolvedUid);

  const { chartData: dailyTrendForChart } = useProfileDailyTrend(resolvedUid);

  const {
    loading: playoffBracketLoading,
    playoffDisplayData,
    playoffScore,
  } = useProfilePlayoffBracket(resolvedUid);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(null);

  const canOpenSettings = isMe || isTargetGuestProfile;

  const posts = summary?.posts ?? 0;
  const wins = (summary as any)?.wins ?? 0;
  const totalPoints = summary?.pointsSumV3 ?? 0;

  const upsetPointsSum = summary?.upsetPointsSum ?? 0;
  const upsetChanceCount = (summary as any)?.upsetChanceCount ?? 0;
  const upsetHitCount = (summary as any)?.upsetHitCount ?? 0;

  const periodLabel =
    range === "7d" ? "7日" : range === "30d" ? "30日" : "All";

  const maxStreak = (displayProfile as any)?.maxStreak ?? 0;
  const currentStreak = Math.max(
    0,
    (displayProfile as any)?.currentStreak ?? 0
  );
  const showCurrentStreakBadge = currentStreak >= 3;

  if (isMe && loadingPlan) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 py-4 text-white">
      <div className="relative isolate rounded-2xl border border-white/10 bg-[#050814]/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        {canOpenSettings && (
          <button
            type="button"
            className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-[#0f2d35] ring-4 ring-[#0f2d35]">
              {displayProfile.avatarUrl && (
                <img
                  src={displayProfile.avatarUrl}
                  className="h-full w-full object-cover"
                  alt=""
                />
              )}
            </div>

            {showCurrentStreakBadge && (
              <div className="absolute left-1/2 -bottom-2 z-10 -translate-x-1/2">
                <div className="inline-flex whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-yellow-300 shadow-[0_8px_18px_rgba(0,0,0,0.45)] backdrop-blur">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="ml-1 tabular-nums">{currentStreak}</span>
                  <span className="ml-1">連勝中</span>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-extrabold">
              {displayProfile.displayName}
            </h1>
            <p className="truncate text-sm text-white/70">
              {displayProfile.handle}
            </p>

            {displayProfile.bio && (
              <p className="mt-1 text-[14px] leading-snug text-white/90">
                {displayProfile.bio}
              </p>
            )}
          </div>
        </div>

        {resolvedBadges.length > 0 && (
          <div className="mt-2 grid grid-cols-5">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="h-12 w-12 overflow-hidden rounded-lg"
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
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} />
      </div>

      <div className="mt-1">
        {tab === "overview" ? (
          <>
            {currentIsProView ? (
              <>
                <div className="grid grid-cols-5 items-stretch gap-3">
                  <div className="col-span-3 h-full">
                    <AnalysisWinCard posts={posts} wins={wins} />
                  </div>

                  <div className="col-span-2 h-full min-w-0">
                    <MaxStreakCard compact maxStreak={maxStreak} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 items-stretch gap-3">
                  <div className="h-full">
                    <ScorePrecisionCard
                      compact
                      scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                      analyses={posts}
                    />
                  </div>

                  <div className="h-full min-w-0">
                    <UpsetCard
                      compact
                      upsetPointsSum={upsetPointsSum}
                      analyses={posts}
                      upsetChanceCount={upsetChanceCount}
                      upsetHitCount={upsetHitCount}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-5 items-stretch gap-3">
                  <div className="col-span-5 h-full">
                    <TotalScoreCard
                      compact
                      periodLabel={periodLabel}
                      totalPoints={totalPoints}
                      analyses={posts}
                    />
                  </div>
                </div>
              </>
            ) : (
              <SummaryCardsV2
                compact
                period={range}
                data={{
                  fullPosts: summary?.fullPosts ?? 0,
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

            <div className="mb-3 mt-3 flex justify-center">
              <PeriodToggle value={range} onChange={setRange} />
            </div>

            <div className="mt-6">
              <DailyTrendCard
                data={dailyTrendForChart}
                range={range}
                allowAll={currentIsProView}
              />
            </div>
          </>
        ) : tab === "bracket" ? (
          isTargetGuestProfile ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">
                ゲストプロフィールではブラケットを表示できません。
              </p>
            </div>
          ) : playoffBracketLoading ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">loading...</p>
            </div>
          ) : !playoffDisplayData ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-center">
              <p className="text-sm text-white/70">
                まだブラケットは提出されていません。
              </p>
            </div>
          ) : (
            <div className="relative mt-4">
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[calc(100vw-10px)] -translate-x-1/2 rounded-[18px] bg-[#020611]" />

              <div className="relative overflow-visible">
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
                />
              </div>
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
              対象ユーザーはProプランに加入していません。
            </p>
          </div>
        )}
      </div>

      <SideMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setBadgeModalOpen(false)}
        />
      )}
    </div>
  );
}