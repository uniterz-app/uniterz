// app/component/profile/MobileProfileView.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useProfile } from "../profile/useProfile";
import type { ProfileViewProps } from "./ProfilePageBase";

import SummaryCards from "./ui/SummaryCards";
import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";
import SimpleCenterModal from "@/app/component/common/SimpleCenterModal";

import PredictionPostCard from "@/app/component/post/PredictionPostCard";
import FollowListDialog from "@/app/component/profile/FollowListDialog";
import FollowButton from "@/app/component/common/FollowButton";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";

import { useProfilePostsFeed } from "./useProfilePostsFeed";
import { useUserBadges } from "./useUserBadges";
import BadgeDetailModal from "@/app/mobile/(no-nav)/badges/BadgeDetailModal";

/* 時間前表示 */
function timeAgoFromTimestamp(ts?: { toDate?: () => Date } | null): string {
  if (!ts || !ts.toDate) return "";

  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  // 年が今年なら省略 → "12/01 00:02"
  const nowYear = new Date().getFullYear();
  if (y === nowYear) {
    return `${m}/${day} ${hh}:${mm}`;
  }

  // 去年以前は年もつける
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function timeAgoFromMillis(ms?: number | null): string {
  if (!ms) return "たった今";

  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);

  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;

  return `${Math.floor(h / 24)}日前`;
}


export default function MobileProfileView(
  props: ProfileViewProps & {
    tab: "overview" | "stats";
    setTab: (v: "overview" | "stats") => void;
    range: "7d" | "30d" | "all";
    setRange: (v: "7d" | "30d" | "all") => void;
  }
) {
  const {
    profile,
    tab,
    setTab,
    range,
    setRange,
    summary,
    statsLoading,
  } = props;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  const h = (profile?.handle ?? "").replace(/^@/, "");
  const { targetUid } = useProfile(h);

  const me = auth.currentUser;
  const isMe = !!(me && targetUid && me.uid === targetUid);
  // targetUid がnullの間は useUserBadges を発火させない
const { badges: userBadges, loading: badgesLoading } = useUserBadges(targetUid);

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] =
    useState<"followers" | "following">("followers");

  /* ===== 投稿フィード ===== */
  const {
    posts,
    loading,
    noMore,
    refresh,
    loadMore,
  } = useProfilePostsFeed(targetUid ?? null);
  const refreshedOnce = useRef(false);

  useEffect(() => {
  if (!targetUid) return;

  if (!refreshedOnce.current) {
    refreshedOnce.current = true; // ← 初回だけ実行
    refresh();
  }
}, [targetUid, refresh]);

  /* =====================================================
     🍀 Pull-to-Refresh
  ===================================================== */
  const pullStartY = useRef<number | null>(null);
  const pullDistance = useRef(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
  // スクロールが 0 以外 → Pull-to-Refresh 無効
  if (window.scrollY > 5) {
  pullStartY.current = null;
  return;
}
  // タッチ開始の位置だけ記録（この時点では Pull 扱いしない）
  pullStartY.current = e.touches[0].clientY;
  pullDistance.current = 0;

  setIsPulling(false); // ← 初回スクロール誤作動を防ぐ
};

  const handleTouchMove = (e: React.TouchEvent) => {
  if (pullStartY.current === null) return;

  const diff = e.touches[0].clientY - pullStartY.current;

  // diff > 10px で初めて Pull と認識（誤作動防止）
  if (diff > 10) {
    pullDistance.current = diff;
    setIsPulling(true);
  }
};

  const handleTouchEnd = async () => {
  if (!isPulling) {
    pullStartY.current = null;
    return;
  }

  setIsPulling(false);

  if (pullDistance.current > 70) {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  pullDistance.current = 0;
  pullStartY.current = null;
};

  /* ===== loadMore（無限スクロール）===== */
const bottomSentinel = useRef<HTMLDivElement>(null);
const firstLoad = useRef(true);

useEffect(() => {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        // 初回だけ loadMore を無効化（スクロール戻り防止）
        if (firstLoad.current) {
          firstLoad.current = false;
          return;
        }
        loadMore();
      }
    },
    { rootMargin: "120px" }
  );

  if (bottomSentinel.current) io.observe(bottomSentinel.current);
  return () => io.disconnect();
}, [loadMore]);

// ★ refresh 完了後も初回発火を抑制する（重要）
useEffect(() => {
  if (!loading) {
    firstLoad.current = false;
  }
}, [loading]);

  /* ===== UI ===== */

  return (
    <div
  className="min-h-screen mx-auto max-w-[640px] px-4 py-4 text-white"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
      {/* Pull UI */}
      {isPulling && (
        <div
          className="text-center text-white/70 transition-all"
          style={{
            height: Math.min(pullDistance.current, 60),
            lineHeight: `${Math.min(pullDistance.current, 60)}px`,
          }}
        >
          ↓ 引っ張って更新
        </div>
      )}
      {refreshing && (
        <div className="text-center text-white/70 py-2">更新中...</div>
      )}

      {/* === ヘッダー === */}
      <div className="relative isolate rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl p-4 shadow-md">
        {isMe && (
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
  {profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      className="w-full h-full object-cover"
      alt=""   // ← 文字が絶対出ない
      onError={(e) => {
        // 壊れた画像は非表示にして透過丸だけにする
        const target = e.currentTarget as HTMLImageElement;
        target.style.display = "none";
      }}
    />
  ) : null} 
</div>

          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold truncate">
              {profile.displayName}
            </h1>
            <p className="text-sm text-white/70 truncate">{profile.handle}</p>

            <div className="mt-2 flex gap-2 text-[12px]">
              <button
                onClick={() => {
                  setFollowListInitial("followers");
                  setFollowListOpen(true);
                }}
                className="rounded-full border border-white/10 px-2 py-0.5"
              >
                <b>{profile.counts?.followers ?? 0}</b> フォロワー
              </button>

              <button
                onClick={() => {
                  setFollowListInitial("following");
                  setFollowListOpen(true);
                }}
                className="rounded-full border border-white/10 px-2 py-0.5"
              >
                <b>{profile.counts?.following ?? 0}</b> フォロー中
              </button>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-2 text-[14px]">{profile.bio}</p>
        )}

        {!isMe && targetUid && (
          <div className="mt-3 flex gap-3">
            <FollowButton targetUid={targetUid} size="sm" variant="blue" />
            <BecomeMemberButton size="sm" onClick={() => setMemberModalOpen(true)} />
          </div>
        )}
      </div>
      {/* ★ 取得バッジがあるときだけ表示（最大10個まで） */}
{userBadges.length > 0 && (
  <div className="mt-4 grid grid-cols-5 gap-3 px-1">
    {userBadges.slice(0, 10).map((b) => (
      <button
        key={b.id}
        className="w-12 h-12 rounded-xl overflow-hidden"
        onClick={() => {
          setSelectedBadge(b);
          setBadgeModalOpen(true);
        }}
      >
        <img
          src={b.icon}
          className="w-full h-full object-cover"
          alt={b.id}
        />
      </button>
    ))}
  </div>
)}



      {/* タブ */}
      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} />
        <PeriodToggle value={range} onChange={setRange} />
      </div>

      {/* ====== コンテンツ切り替え ====== */}
      <div className="mt-6">
        {tab === "overview" ? (
          <>
            {/* ★ サマリーカード（小さく調整） */}
          <SummaryCards
  compact
  range={range}
  data={{
    // ★ 投稿数（分析数）は「総投稿数」
    posts: summary?.postsTotal ?? 0,

    // ★ 勝率（0〜1）
    winRate: summary?.winRate ?? 0,

    units: summary?.units ?? 0,
    odds: summary?.avgOdds ?? 0,
  }}

  // ★ 勝率・平均オッズの分母（確定投稿数）
  sampleCount={summary?.posts ?? 0}
/>

            <div className="mt-6 space-y-4">
              {loading && (
                <div className="text-sm text-white/70">読み込み中…</div>
              )}

              {!loading && posts.length === 0 && (
                <div className="text-sm text-white/70">
                  まだ投稿はありません。
                </div>
              )}

              {!loading &&
                posts.map((p: any) => (
                  <PredictionPostCard
                    key={p.id}
                    post={{
                      ...p,
                      createdAtText: timeAgoFromTimestamp(p.createdAt),
                    }}
                  />
                ))}

              <div ref={bottomSentinel} className="h-12" />
            </div>
          </>
        ) : (
          <div className="text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
              <p className="text-base font-semibold">
                Statsタブの詳細分析機能は後日追加予定です。
              </p>
              <p className="mt-2 text-sm text-white/70">
                リリース後は、勝率・ユニット・オッズ傾向などを
                より細かく自己分析できる画面として有料版を開発中です。
              </p>
            </div>
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
  <BadgeDetailModal
    badge={selectedBadge}
    onClose={() => setBadgeModalOpen(false)}
  />
)}
    </div>
  );
}

