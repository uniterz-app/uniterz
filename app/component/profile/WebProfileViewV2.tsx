// app/component/profile/WebProfileViewV2.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Flame } from "lucide-react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import BadgeDetailModal from "@/app/web/(no-nav)/badges/BadgeDetailModal";

import { useUserBadges } from "../badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";

import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import { useUserDailyTrendV2 } from "@/lib/stats/useUserDailyTrendV2";

import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";

import AnalysisWinCard from "./ui/summary/AnalysisWinCard";
import TotalScoreCard from "./ui/summary/TotalScoreCard";
import ScorePrecisionCard from "./ui/summary/ScorePrecisionCard";
import ProbAccuracyCard from "./ui/summary/ProbAccuracyCard";
import UpsetCard from "./ui/summary/UpsetCard";
import MaxStreakCard from "./ui/summary/MaxStreakCard";

import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";
import {
  buildPlayoffDisplayData,
  type PlayoffDisplayData,
} from "@/lib/playoff-bracket-display";
import {
  loadPlayoffBracket,
  type PlayoffBracketDoc,
} from "@/lib/playoff-bracket-firestore";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function WebProfileViewV2(props: ProfileViewPropsV2) {
  const { profile, tab, setTab, range, setRange, summary, targetUid } = props;

  const me = auth.currentUser;
  const resolvedUid = typeof targetUid === "string" ? targetUid : null;
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

  const canOpenSettings = isMe || isTargetGuestProfile;

  const [myPlan, setMyPlan] = useState<string | null>(null);
  const [playoffBracketLoading, setPlayoffBracketLoading] = useState(false);
  const [playoffBracketDoc, setPlayoffBracketDoc] =
    useState<PlayoffBracketDoc | null>(null);

  useEffect(() => {
    const uid = me?.uid;
    if (!uid) return;

    const userDocRef = doc(db, "users", uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) setMyPlan((docSnap.data() as any).plan ?? "free");
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

      const data = snap.data() as any;
      const proUntilMs = data.proUntil?.toMillis?.();
      const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;

      if (
        data.plan === "pro" &&
        cancelAtPeriodEnd &&
        typeof proUntilMs === "number" &&
        Date.now() > proUntilMs
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

const SEASON = getCurrentPlayoffSeason();

useEffect(() => {
  let cancelled = false;

  async function fetchPlayoffBracket() {
    if (!resolvedUid) {
      setPlayoffBracketDoc(null);
      setPlayoffBracketLoading(false);
      return;
    }

    try {
      setPlayoffBracketLoading(true);
      const data = await loadPlayoffBracket(resolvedUid, SEASON);
      if (cancelled) return;
      setPlayoffBracketDoc(data);
    } catch (e) {
      if (cancelled) return;
      console.error("failed to load playoff bracket", e);
      setPlayoffBracketDoc(null);
    } finally {
      if (!cancelled) setPlayoffBracketLoading(false);
    }
  }

  fetchPlayoffBracket();

  return () => {
    cancelled = true;
  };
}, [resolvedUid]);

  const profilePlan = (displayProfile as any).plan as string | undefined;
  const isMyPro = myPlan === "pro";
  const isTargetPro = profilePlan === "pro";

  const effectivePlan = isMe ? (myPlan ?? "free") : (profilePlan ?? "free");
  const isProView = effectivePlan === "pro";

  const uidForDailyTrend =
    typeof targetUid === "string" ? targetUid : undefined;
  const { data: dailyTrend, loading: dailyTrendLoading } =
    useUserDailyTrendV2(uidForDailyTrend);

  const { badges: userBadges } = useUserBadges(
    typeof targetUid === "string" ? targetUid : null
  );
  const { badges: masterBadges } = useMasterBadges();

  const resolvedBadges: ResolvedBadge[] = useMemo(() => {
    return userBadges
      .map((ub) => {
        const master = masterBadges.find((m) => m.id === ub.badgeId);
        if (!master) return null;
        return { ...master, grantedAt: ub.grantedAt };
      })
      .filter((b): b is ResolvedBadge => b !== null);
  }, [userBadges, masterBadges]);

const playoffDisplayData: PlayoffDisplayData | null = useMemo(() => {
  if (!playoffBracketDoc?.bracket || !playoffBracketDoc?.season) return null;
  return buildPlayoffDisplayData(
    playoffBracketDoc.bracket,
    playoffBracketDoc.season
  );
}, [playoffBracketDoc]);

  const playoffScore = playoffBracketDoc?.totalScore ?? 0;

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ResolvedBadge | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const chartData = useMemo(() => {
    return (dailyTrend ?? []).map((row: any) => ({
      date: row.date ?? row.dateKey ?? "",
      posts: row.posts ?? 0,
      wins: row.wins ?? row.hitCount ?? 0,
      pointsV3: row.pointsV3 ?? row.totalPoints ?? row.pointsSumV3 ?? 0,
      scorePrecision: row.scorePrecision ?? row.scorePrecisionSum ?? 0,
      upsetPoints: row.upsetPoints ?? row.upsetPointsSum ?? 0,
    }));
  }, [dailyTrend]);

  if (isMe && myPlan === null) {
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
              <div className="absolute left-1/2 -bottom-2 z-10 -translate-x-1/2">
                <div className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-yellow-300 shadow-[0_8px_18px_rgba(0,0,0,0.45)] backdrop-blur">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="tabular-nums">{currentStreak}</span>
                  <span>連勝中</span>
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>

        {resolvedBadges.length > 0 && (
          <div className="mt-4 grid grid-cols-10 gap-3">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="h-14 w-14 overflow-hidden rounded-xl bg-white/10"
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
            {isProView ? (
              <>
                <div className="grid grid-cols-3 items-stretch gap-3">
                  <div className="h-full">
                    <AnalysisWinCard posts={posts} wins={wins} />
                  </div>

                  <div className="h-full">
                    <TotalScoreCard
                      compact
                      periodLabel={periodLabel}
                      totalPoints={totalPoints}
                      analyses={posts}
                    />
                  </div>

                  <div className="h-full">
                    <MaxStreakCard compact maxStreak={maxStreak} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 items-stretch gap-3">
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

                  <div className="h-full">
                    <UpsetCard
                      compact
                      upsetPointsSum={upsetPointsSum}
                      analyses={posts}
                      upsetChanceCount={upsetChanceCount}
                      upsetHitCount={upsetHitCount}
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
                  avgBrier: summary?.avgBrier ?? 0,
                  upsetPointsSum: summary?.upsetPointsSum ?? 0,
                  pointsSumV3: summary?.pointsSumV3 ?? 0,
                }}
              />
            )}

            {!dailyTrendLoading && (
              <div className="mt-6">
                <DailyTrendCard
                  data={chartData}
                  range={range}
                  allowAll={isProView}
                />
              </div>
            )}
          </>
        ) : tab === "bracket" ? (
          isTargetGuestProfile ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <p className="text-sm text-white/70">
                ゲストプロフィールではブラケットを表示できません。
              </p>
            </div>
          ) : playoffBracketLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <p className="text-sm text-white/70">loading...</p>
            </div>
          ) : !playoffDisplayData ? (
            <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <p className="text-sm text-white/70">
                まだブラケットは提出されていません。
              </p>
            </div>
          ) : (
<PlayoffFullBracketWeb
  league="nba"
  season={playoffDisplayData.season}
  score={playoffScore}
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
          )
        ) : isTargetGuestProfile ? (
          <ProPreview />
        ) : isMe ? (
          myPlan === "pro" ? (
            <ProAnalysis />
          ) : (
            <ProPreview />
          )
        ) : isMyPro && isTargetPro ? (
          <ProAnalysis />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
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
          onClose={() => {
            setBadgeModalOpen(false);
            setSelectedBadge(null);
          }}
        />
      )}
    </div>
  );
}