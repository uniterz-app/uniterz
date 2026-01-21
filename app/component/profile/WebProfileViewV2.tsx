// app/component/profile/WebProfileViewV2.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import FollowButton from "@/app/component/common/FollowButton";
import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";

import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase"; // これを追加
import { doc, getDoc } from "firebase/firestore"; // Firestore ドキュメント取得用

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import FollowListDialog from "@/app/component/profile/FollowListDialog";

import BadgeDetailModal from "@/app/web/(no-nav)/badges/BadgeDetailModal";
import { useRouter } from "next/navigation";


// hooks
import { useUserBadges } from "../badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";

import DailyTrendCard from "@/app/component/pro/analysis/DailyTrendCard";
import { useUserDailyTrendV2 } from "@/lib/stats/useUserDailyTrendV2";


// ★ 追加：Mobile と共通の feed hook
import { useProfilePostsFeedV2 } from "./useProfilePostsFeedV2";
import ProAnalysis from "@/app/component/pro/analysis/ProAnalysis";
import ProPreview from "@/app/component/pro/analysis/ProPreview";


type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function WebProfileViewV2(props: ProfileViewPropsV2) {
  const {
    profile,
    tab,
    setTab,
    range,
    setRange,
    summary,
    targetUid,
  } = props;

  const me = auth.currentUser;
const isMe = !!(me && targetUid && me.uid === targetUid);
const isTargetGuestProfile = !targetUid;


// ★ 表示専用プロフィール
const displayProfile = isTargetGuestProfile
  ? {
      ...profile,
      displayName: "Guest User",
      handle: "@guest",
      bio: "ログインするとプロフィールを作成できます",
      counts: { followers: 0, following: 0 },
      plan: "free",
    }
  : profile;

  const router = useRouter(); // 追加
const [myPlan, setMyPlan] = useState<string | null>(null); // 追加

const canOpenSettings = isMe || isTargetGuestProfile;

useEffect(() => {
  const uid = me?.uid;
  if (!uid) return;

  import("firebase/firestore").then(({ doc, getDoc }) => {
    const userDocRef = doc(db, "users", uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) setMyPlan((docSnap.data() as any).plan ?? "free");
      else setMyPlan("free");
    });
  });
}, [me]);

// ==============================
// ★ アクセス時 Pro 期限チェック（Web）
// ==============================
useEffect(() => {
  const uid = me?.uid;
  if (!uid) return;

  // 自分のプロフィールを見ているときだけ
  if (uid !== targetUid) return;

  import("firebase/firestore").then(
    async ({ doc, getDoc, setDoc, serverTimestamp }) => {
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);
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
    }
  );
}, [me, targetUid]);

const profilePlan = (displayProfile as any).plan as string | undefined;


  /* ============================
   * 投稿フィード（共通 hook）
   * ============================ */
  const {
    posts,
    loading,
    noMore,
    refresh,
    loadMore,
  } = useProfilePostsFeedV2(
    typeof targetUid === "string" ? targetUid : null
  );

  const uidForDailyTrend =
  typeof targetUid === "string" ? targetUid : undefined;

const {
  data: dailyTrend,
  loading: dailyTrendLoading,
} = useUserDailyTrendV2(uidForDailyTrend);


  // uid が変わったときだけ refresh
  const lastUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!targetUid) return;
    if (lastUidRef.current !== targetUid) {
      lastUidRef.current = targetUid;
      refresh();
    }
  }, [targetUid, refresh]);

  /* ============================
   * Badges
   * ============================ */
  const { badges: userBadges } = useUserBadges(
    typeof targetUid === "string" ? targetUid : null
  );
  const { badges: masterBadges } = useMasterBadges();

  const resolvedBadges: ResolvedBadge[] = userBadges
    .map((ub) => {
      const master = masterBadges.find((m) => m.id === ub.badgeId);
      if (!master) return null;
      return { ...master, grantedAt: ub.grantedAt };
    })
    .filter((b): b is ResolvedBadge => b !== null);

  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] =
    useState<ResolvedBadge | null>(null);

  /* ============================
   * Follow list / Drawer
   * ============================ */
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] =
    useState<"followers" | "following">("followers");

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-6 text-white">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-card p-10 shadow-lg min-h-[180px]">
        <div className="grid grid-cols-[96px_1fr_auto] gap-6 items-start">
          <div className="h-24 w-24 rounded-full ring-3 ring-[#FFCC00]/40 overflow-hidden">
            {displayProfile.avatarUrl && (
              <img src={displayProfile.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold">
              {displayProfile.displayName}
            </h1>
            <p className="opacity-70">{displayProfile.handle}</p>

            {displayProfile.bio && <p className="mt-2">{displayProfile.bio}</p>}

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-full border border-white/10 px-3 py-1"
                onClick={() => {
                  setFollowListInitial("followers");
                  setFollowListOpen(true);
                }}
              >
                <b>{displayProfile.counts?.followers ?? 0}</b> フォロワー
              </button>

              <button
                className="rounded-full border border-white/10 px-3 py-1"
                onClick={() => {
                  setFollowListInitial("following");
                  setFollowListOpen(true);
                }}
              >
                <b>{displayProfile.counts?.following ?? 0}</b> フォロー中
              </button>
            </div>

            {!isMe && targetUid && (
              <div className="mt-3 flex gap-6">
                <FollowButton
                  targetUid={targetUid}
                  size="md"
                  variant="blue"
                />
                <BecomeMemberButton size="md" onClick={() => {}} />
              </div>
            )}
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

        {/* Badges */}
        {resolvedBadges.length > 0 && (
          <div className="mt-4 grid grid-cols-10 gap-3">
            {resolvedBadges.slice(0, 10).map((b) => (
              <button
                key={b.id}
                className="w-14 h-14 rounded-xl overflow-hidden bg-white/10"
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
{/* Tabs */}
<div className="mt-6 flex items-center justify-between">
  <Tabs
    value={tab}
    onChange={setTab}
    size="lg" 
  />

  {tab === "overview" && (
    <PeriodToggle
      value={range}
      onChange={setRange}
      size="lg"
    />
  )}
</div>

      {/* Content */}
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
) : isMe ? (
  <ProAnalysis />
) : myPlan === "pro" && profilePlan === "pro" ? (
  <ProAnalysis />
) : (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-center space-y-3">
    <p className="text-sm text-white/70">
      対象ユーザーはProプランに加入していません。
    </p>
  </div>
)}
</div>

      {/* Dialogs */}
      {followListOpen && targetUid && (
        <FollowListDialog
          targetUid={targetUid}
          initialTab={followListInitial}
          open={followListOpen}
          onClose={() => setFollowListOpen(false)}
        />
      )}

      <SideMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
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
  );
}
