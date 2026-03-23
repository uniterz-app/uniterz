"use client";

import { useEffect, useState } from "react";
import { Menu, Flame } from "lucide-react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/web/badges/BadgeDetailModal";

import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";

import AnalysisWinCard from "./ui/summary/AnalysisWinCard";
import TotalScoreCard from "./ui/summary/TotalScoreCard";
import ScorePrecisionCard from "./ui/summary/ScorePrecisionCard";
import UpsetCard from "./ui/summary/UpsetCard";
import MaxStreakCard from "./ui/summary/MaxStreakCard";

import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";

import { useProfilePlan } from "@/lib/profile/useProfilePlan";
import {
  useProfileBadges,
  type ResolvedBadge,
} from "@/lib/profile/useProfileBadges";
import { useProfileDailyTrend } from "@/lib/profile/useProfileDailyTrend";
import { useProfilePlayoffBracket } from "@/lib/profile/useProfilePlayoffBracket";

export default function WebProfileViewV2(props: ProfileViewPropsV2) {
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

  const { chartData, loading: dailyTrendLoading } =
    useProfileDailyTrend(resolvedUid);

  const {
    loading: playoffBracketLoading,
    playoffDisplayData,
    playoffScore,
  } = useProfilePlayoffBracket(resolvedUid);

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 text-white">
      <div className="min-h-[180px] rounded-2xl border border-white/10 bg-[#050814]/80 p-10 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <div className="grid grid-cols-[96px_1fr_auto] items-start gap-6">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-[#0f2d35] ring-4 ring-[#0f2d35]">
              {displayProfile.avatarUrl && (
                <img
                  src={displayProfile.avatarUrl}
                  className="h-full w-full object-cover"
                  alt=""
                />
              )}
            </div>

            {showCurrentStreakBadge && (
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2">
                <div className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-yellow-300 backdrop-blur">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  {currentStreak}連勝
                </div>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold">
              {displayProfile.displayName}
            </h1>
            <p className="opacity-70">{displayProfile.handle}</p>
            {displayProfile.bio && <p className="mt-2">{displayProfile.bio}</p>}
          </div>

          {canOpenSettings && (
            <button
              className="h-11 w-11 rounded-lg border border-white/10 bg-white/5"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>

        {resolvedBadges.length > 0 && (
          <div className="mt-4 grid grid-cols-10">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="h-14 w-14 rounded-xl"
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
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} size="lg" />
        {tab === "overview" && (
          <PeriodToggle value={range} onChange={setRange} />
        )}
      </div>

      <div className="mt-6">
        {tab === "overview" ? (
          <>
            {currentIsProView ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <AnalysisWinCard posts={posts} wins={wins} />
                  <MaxStreakCard compact maxStreak={maxStreak} />
                  <ScorePrecisionCard
                    compact
                    scorePrecisionSum={summary?.scorePrecisionSum ?? 0}
                    analyses={posts}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <UpsetCard
                    compact
                    upsetPointsSum={upsetPointsSum}
                    analyses={posts}
                    upsetChanceCount={upsetChanceCount}
                    upsetHitCount={upsetHitCount}
                  />
                  <TotalScoreCard
                    compact
                    periodLabel={periodLabel}
                    totalPoints={totalPoints}
                    analyses={posts}
                  />
                </div>
              </>
            ) : (
              <SummaryCardsV2
                compact
                period={range}
                data={{
                  fullPosts: summary?.fullPosts ?? 0,
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

            {!dailyTrendLoading && (
              <div className="mt-6">
                <DailyTrendCard
                  data={chartData}
                  range={range}
                  allowAll={currentIsProView}
                />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          isTargetGuestProfile ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
              ゲストは不可
            </div>
          ) : playoffBracketLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
              loading...
            </div>
          ) : !playoffDisplayData ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
              未提出
            </div>
          ) : (
            <PlayoffFullBracketWeb
              league="nba"
              score={playoffScore}
              {...playoffDisplayData}
            />
          )
        ) : isTargetGuestProfile ? (
          <ProPreview />
        ) : currentIsProView ? (
          <ProAnalysis />
        ) : isMe ? (
          myPlan === "pro" ? <ProAnalysis /> : <ProPreview />
        ) : isMyPro && isTargetPro ? (
          <ProAnalysis />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center">
            対象ユーザーはPro未加入
          </div>
        )}
      </div>

      <SideMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

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
  );
}