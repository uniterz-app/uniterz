// app/component/profile/MobileProfileViewV2.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Menu, Flame } from "lucide-react";

import { auth, db } from "@/lib/firebase";
import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";

import BadgeDetailModal from "@/app/mobile/(no-nav)/badges/BadgeDetailModal";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import { useUserBadges } from "../badges/useUserBadges";

import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";

import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import { useUserDailyTrendV2 } from "@/lib/stats/useUserDailyTrendV2";

import AnalysisWinCard from "./ui/summary/AnalysisWinCard";
import TotalScoreCard from "./ui/summary/TotalScoreCard";
import ScorePrecisionCard from "./ui/summary/ScorePrecisionCard";
import ProbAccuracyCard from "./ui/summary/ProbAccuracyCard";
import UpsetCard from "./ui/summary/UpsetCard";
import MaxStreakCard from "./ui/summary/MaxStreakCard";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    history.scrollRestoration = "manual";
  }, []);

  const { profile, tab, setTab, range, setRange, summary, targetUid } = props;

  const me = auth.currentUser;
  const resolvedUid = typeof targetUid === "string" ? targetUid : null;

  const { badges: userBadges } = useUserBadges(resolvedUid);
  const { badges: masterBadges } = useMasterBadges();

  const isMe = !!(me && targetUid && me.uid === targetUid);
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

  const [myPlan, setMyPlan] = useState<string | null>(null);

  useEffect(() => {
    const uid = me?.uid;
    if (!uid) return;

    const userDocRef = doc(db, "users", uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) setMyPlan(docSnap.data().plan ?? "free");
      else setMyPlan("free");
    });
  }, [me]);

  useEffect(() => {
    const uid = me?.uid;
    if (!uid) return;
    if (uid !== targetUid) return;

    const userDocRef = doc(db, "users", uid);

    getDoc(userDocRef).then(async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const proUntil = data.proUntil?.toMillis?.();
      const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;
      const plan = data.plan;

      if (
        plan === "pro" &&
        cancelAtPeriodEnd &&
        typeof proUntil === "number" &&
        Date.now() > proUntil
      ) {
        await setDoc(
          userDocRef,
          {
            plan: "free",
            proUntil: null,
            cancelAtPeriodEnd: false,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setMyPlan("free");
      }
    });
  }, [me, targetUid]);

  const profilePlan = (displayProfile as any).plan as string | undefined;
  const isMyPro = myPlan === "pro";
  const isTargetPro = profilePlan === "pro";
  const isMyProfile = isMe;

  const effectivePlan = isMe ? (myPlan ?? "free") : (profilePlan ?? "free");
  const isProView = effectivePlan === "pro";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(null);

  const uidForDailyTrend = resolvedUid ?? undefined;
  const { data: dailyTrend } = useUserDailyTrendV2(uidForDailyTrend);

  const canOpenSettings = isMe || isTargetGuestProfile;

  const resolvedBadges = useMemo(() => {
    return userBadges
      .map((ub) => {
        const master = masterBadges.find((m) => m.id === ub.badgeId);
        if (!master) return null;
        return { ...master, grantedAt: ub.grantedAt };
      })
      .filter((b): b is MasterBadge & { grantedAt: Date | null } => b !== null);
  }, [userBadges, masterBadges]);

  const dailyTrendForChart = useMemo(() => {
    return (dailyTrend ?? []).map((row: any) => ({
      date: row.date ?? row.dateKey ?? "",
      posts: row.posts ?? 0,
      wins: row.wins ?? row.hitCount ?? 0,
      pointsV3: row.pointsV3 ?? row.totalPoints ?? row.pointsSumV3 ?? 0,
      scorePrecision: row.scorePrecision ?? row.scorePrecisionSum ?? 0,
      upsetPoints: row.upsetPoints ?? row.upsetPointsSum ?? 0,
    }));
  }, [dailyTrend]);

  const posts = summary?.posts ?? 0;
  const wins = (summary as any)?.wins ?? 0;
  const totalPoints = summary?.pointsSumV3 ?? 0;

  const upsetPointsSum = summary?.upsetPointsSum ?? 0;
  const upsetChanceCount = (summary as any)?.upsetChanceCount ?? 0;
  const upsetHitCount = (summary as any)?.upsetHitCount ?? 0;

  const periodLabel = range === "7d" ? "7日" : range === "30d" ? "30日" : "All";

  const maxStreak = (displayProfile as any)?.maxStreak ?? 0;
  const currentStreak = Math.max(0, (displayProfile as any)?.currentStreak ?? 0);
const showCurrentStreakBadge = currentStreak >= 3;

  if (isMe && myPlan === null) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 py-4 text-white">
      {/* Header */}
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
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} />
      </div>

      <div className="mt-1">
        {tab === "overview" ? (
          <>
            {isProView ? (
              <>
                <div className="grid grid-cols-5 items-stretch gap-3">
                  <div className="col-span-3 h-full">
                    <AnalysisWinCard posts={posts} wins={wins} />
                  </div>

                  <div className="col-span-2 h-full">
                    <TotalScoreCard
                      compact
                      periodLabel={periodLabel}
                      totalPoints={totalPoints}
                      analyses={posts}
                    />
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

                  <div className="h-full">
                    <ProbAccuracyCard
                      compact
                      avgBrier={summary?.avgBrier ?? 0}
                      analyses={posts}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-5 items-stretch gap-3">
                  <div className="col-span-3 h-full min-w-0">
                    <UpsetCard
                      compact
                      upsetPointsSum={upsetPointsSum}
                      analyses={posts}
                      upsetChanceCount={upsetChanceCount}
                      upsetHitCount={upsetHitCount}
                    />
                  </div>

                  <div className="col-span-2 h-full min-w-0">
                    <MaxStreakCard compact maxStreak={maxStreak} />
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
                  avgBrier: summary?.avgBrier ?? 0,
                  upsetPointsSum: summary?.upsetPointsSum ?? 0,
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
                allowAll={isProView}
              />
            </div>
          </>
        ) : isTargetGuestProfile ? (
          <ProPreview />
        ) : isMyProfile ? (
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

      <SimpleCenterModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="現在開発中"
        icon="⚙️"
        message="今後、有料プラン作成機能を追加予定です。"
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