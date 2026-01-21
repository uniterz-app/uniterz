// app/component/profile/MobileProfileViewV2.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { Flame, Trophy } from "lucide-react";

import { auth } from "@/lib/firebase";
import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import SummaryCardsV2 from "./ui/SummaryCardsV2";
import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";

import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";
import SimpleCenterModal from "@/app/component/common/SimpleCenterModal";

// ★ V2 投稿カードに差し替え
import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import { db } from "@/lib/firebase"; // 普通はこれで Firestore 取得可能
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import FollowListDialog from "@/app/component/profile/FollowListDialog";
import FollowButton from "@/app/component/common/FollowButton";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";

// ★ V2 フィードに差し替え
import { useProfilePostsFeedV2 } from "./useProfilePostsFeedV2";

import { useRouter } from "next/navigation";

import BadgeDetailModal from "@/app/mobile/(no-nav)/badges/BadgeDetailModal";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import { useUserBadges } from "../badges/useUserBadges";
import { motion } from "framer-motion";

// ① import を追加
import LoginRequiredModal from "@/app/component/modals/LoginRequiredModal";

import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";

import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import { useUserDailyTrendV2 } from "@/lib/stats/useUserDailyTrendV2";



type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  if (typeof window !== "undefined") {
    history.scrollRestoration = "manual";
  }

  const { profile, tab, setTab, range, setRange, summary, targetUid } = props;

const resolvedUid =
  typeof targetUid === "string" ? targetUid : null;

const {
  badges: userBadges,
  loading: badgesLoading,
} = useUserBadges(resolvedUid);


  const me = auth.currentUser;

  const isMe = !!(me && targetUid && me.uid === targetUid);
  // 表示対象が「ゲストプロフィール」かどうか
const isTargetGuestProfile = !targetUid;

// ② state を追加（上の方）
const [showLoginRequired, setShowLoginRequired] = useState(false);

// 表示用プロフィール（※見る人がゲストかどうかは関係ない）
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
  
  const router = useRouter();

const [myPlan, setMyPlan] = useState<string | null>(null);

useEffect(() => {
  const uid = me?.uid;
  if (!uid) return;

  const userDocRef = doc(db, "users", uid);
  getDoc(userDocRef).then((docSnap) => {
    if (docSnap.exists()) {
      setMyPlan(docSnap.data().plan ?? "free");
    } else {
      setMyPlan("free");
    }
  });
}, [me]);

// ==============================
// ★ アクセス時 Pro 期限チェック
// ==============================
useEffect(() => {
  const uid = me?.uid;
  if (!uid) return;

  // 自分のプロフィールを見ているときだけ
  if (uid !== targetUid) return;

  const userDocRef = doc(db, "users", uid);

  getDoc(userDocRef).then(async (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();
    const proUntil = data.proUntil?.toMillis?.();
    const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;
    const plan = data.plan;

    // 条件をすべて満たしたら Free 化
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
  const summaryV2 = summary;

  

  const { badges: masterBadges } = useMasterBadges();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] =  useState<ResolvedBadge | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] = useState<"followers" | "following">(
    "followers"
  );

  // ★ V2 フィード取得
const { posts, loading, noMore, loadMore, refresh } = useProfilePostsFeedV2(resolvedUid);

const uidForDailyTrend = resolvedUid ?? undefined;

const {
  data: dailyTrend,
  loading: dailyTrendLoading,
} = useUserDailyTrendV2(uidForDailyTrend);



const canOpenSettings = isMe || isTargetGuestProfile;

const resolvedBadges = userBadges
  .map((ub) => {
    const master = masterBadges.find(
      (m) => m.id === ub.badgeId
    );
    if (!master) return null;

    return {
      ...master,
      grantedAt: ub.grantedAt,
    };
  })
  .filter(
    (b): b is MasterBadge & { grantedAt: Date | null } => b !== null
  );

  const lastUidRef = useRef<string | null>(null);
  const ready = !loading && posts.length > 0;
  const isInitialLoading = loading && posts.length === 0;

 useEffect(() => {
  if (!targetUid) return;

  if (lastUidRef.current !== targetUid) {
    lastUidRef.current = targetUid;
    refresh();
  }
}, [targetUid, refresh]);

  // --- infinite scroll ---
  const bottomSentinel = useRef<HTMLDivElement>(null);
  const ioReady = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (!ioReady.current) return;
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    if (bottomSentinel.current) io.observe(bottomSentinel.current);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ioReady.current = true;
      });
    });

    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div
      className="min-h-screen mx-auto max-w-[640px] px-4 py-4 text-white"
      style={{ minHeight: ready ? "auto" : "200vh" }}
    >
      {/* === Header === */}
      <div className="relative isolate rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl p-4 shadow-md">

        {canOpenSettings && (
  <button
    type="button"
    className="absolute right-2 top-2 z-20 h-10 w-10 flex items-center justify-center rounded-full border border-white/15 bg-white/10"
    onClick={() => setDrawerOpen(true)}
  >
    <Menu className="h-5 w-5" />
  </button>
)}

        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-full ring-4 ring-[#0f2d35] bg-[#0f2d35] overflow-hidden">
            {displayProfile.avatarUrl && (
              <img src={displayProfile.avatarUrl} className="w-full h-full object-cover" alt="" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold truncate">{displayProfile.displayName}</h1>
            <p className="text-sm text-white/70 truncate">{displayProfile.handle}</p>

            <div className="mt-2 flex gap-2 text-[12px]">
              <button
                onClick={() => {
                  setFollowListInitial("followers");
                  setFollowListOpen(true);
                }}
                className="rounded-full border border-white/10 px-2 py-0.5"
              >
                <b>{displayProfile.counts?.followers ?? 0}</b> フォロワー
              </button>

              <button
                onClick={() => {
                  setFollowListInitial("following");
                  setFollowListOpen(true);
                }}
                className="rounded-full border border-white/10 px-2 py-0.5"
              >
                <b>{displayProfile.counts?.following ?? 0}</b> フォロー中
              </button>
            </div>
          </div>
        </div>

        {displayProfile.bio && <p className="mt-2 text-[14px]">{displayProfile.bio}</p>}

        {!isMe && targetUid && (
          <div className="mt-3 flex gap-3">
            <FollowButton targetUid={targetUid} size="sm" variant="blue" />
            <BecomeMemberButton size="sm" onClick={() => setMemberModalOpen(true)} />
          </div>
        )}
{/* ▼ 連勝関連の表示（3以上のみ表示） */}
<div className="mt-3 flex gap-2 flex-wrap">

  {/* ▼現在の連勝（3以上で表示） */}
  {displayProfile.currentStreak >= 3 && (
    <div
      className={`
        inline-flex items-center px-3 py-1 rounded-full border text-sm
        ${displayProfile.currentStreak >= 3
          ? "border-red-500 text-red-400"
          : "border-white/20 text-white/90"}
      `}
    >
      <Flame className="w-4 h-4 mr-1 text-yellow-400" />
      <span className="font-bold">{displayProfile.currentStreak}</span> 連勝中
    </div>
  )}

  {/* ▼最高連勝（3以上で表示） */}
  {displayProfile.maxStreak >= 3 && (
    <div
      className="inline-flex items-center px-3 py-1 rounded-full border border-white/20 text-sm text-white/90"
    >
      <Trophy className="w-4 h-4 mr-1 text-amber-400" />
      <span className="font-bold">最高連勝: {displayProfile.maxStreak}</span>
    </div>
  )}

</div>

      </div>

      {/* === Badges === */}
     {resolvedBadges.length > 0 && (
  <div className="mt-4 grid grid-cols-5 gap-3 px-1">
    {resolvedBadges.slice(0, 10).map((b) => (
      <motion.button
  key={b.id}
  whileTap={{ scale: 1.12 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
  className="w-14 h-14 rounded-2xl overflow-hidden"
  onClick={() => {
    setSelectedBadge(b);
    setBadgeModalOpen(true);
  }}
>
  <img
    src={b.icon}
    alt={b.title}
    className="w-full h-full object-cover"
  />
</motion.button>
    ))}
  </div>
)}

      {/* === Tabs === */}
<div className="mt-4 flex items-center justify-between">
  <Tabs
    value={tab}
    onChange={setTab}
  />

  {tab === "overview" && (
    <PeriodToggle
      value={range}
      onChange={setRange}
    />
  )}
</div>

      {/* === Main Content === */}
<div className="mt-6">
  {tab === "overview" ? (
    <>
      <SummaryCardsV2
  compact
  period={range}
  data={{
    fullPosts: summary?.fullPosts ?? 0,
    posts: summary?.posts ?? 0,
    winRate: summary?.winRate ?? 0,
    avgPrecision: summary?.avgPrecision ?? 0,
    avgBrier: summary?.avgBrier ?? 0,
    upsetHitRate: summary?.upsetHitRate ?? 0, // ★ 正
    avgCalibration: summary?.avgCalibration ?? null,
  }}
/>

{!dailyTrendLoading && dailyTrend.length > 0 && (
  <div className="mt-6">
    <DailyTrendCard data={dailyTrend} />
  </div>
)}

      <div className="mt-8 space-y-6">
        {loading && <div className="opacity-70">読み込み中…</div>}
        {!loading && posts.length === 0 && <div className="opacity-70">まだ投稿はありません。</div>}
        {posts.map((p) => <PredictionPostCardV2 key={p.id} post={p} mode="list" showDelete />)}
        {!noMore && <button onClick={loadMore} className="mt-4 w-full rounded-md border border-white/10 py-2 text-sm opacity-70 hover:bg-white/10">もっと見る</button>}
      </div>
    </>
  ) : isTargetGuestProfile ? (
  <ProPreview />
) : isMyProfile ? (
  <ProAnalysis />
) : isMyPro && isTargetPro ? (
  <ProAnalysis />
) : (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-center space-y-3">
    <p className="text-sm text-white/70">
      対象ユーザーはProプランに加入していません。
    </p>
  </div>
)}
</div>

      {/* dialogs */}
      {targetUid && (
        <FollowListDialog
          targetUid={targetUid}
          initialTab={followListInitial}
          open={followListOpen}
          onClose={() => setFollowListOpen(false)}
        />
      )}

      <SideMenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <SimpleCenterModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="現在開発中"
        icon="⚙️"
        message="今後、有料プラン作成機能を追加予定です。"
      />

      {badgeModalOpen && selectedBadge && (
        <BadgeDetailModal badge={selectedBadge} onClose={() => setBadgeModalOpen(false)} />
      )}
    </div>
  );
}
