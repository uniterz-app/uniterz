// app/component/profile/MobileProfileViewV2.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import { auth } from "@/lib/firebase";
import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import SummaryCardsV2 from "./ui/SummaryCardsV2";
import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";

import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";
import SimpleCenterModal from "@/app/component/common/SimpleCenterModal";

// ★ V2 投稿カードに差し替え
import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";

import FollowListDialog from "@/app/component/profile/FollowListDialog";
import FollowButton from "@/app/component/common/FollowButton";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";

// ★ V2 フィードに差し替え
import { useProfilePostsFeedV2 } from "./useProfilePostsFeedV2";

import { useUserBadges } from "./useUserBadges";
import BadgeDetailModal from "@/app/mobile/(no-nav)/badges/BadgeDetailModal";

export default function MobileProfileViewV2(props: ProfileViewPropsV2) {
  if (typeof window !== "undefined") {
    history.scrollRestoration = "manual";
  }

  const { profile, tab, setTab, range, setRange, summary, targetUid } = props;

  const me = auth.currentUser;
  const isMe = !!(me && targetUid && me.uid === targetUid);

  const summaryV2 = summary;

  const { badges: userBadges } = useUserBadges(targetUid);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] = useState<"followers" | "following">(
    "followers"
  );

  // ★ V2 フィード取得
  const { posts, loading, loadMore, refresh } = useProfilePostsFeedV2(targetUid ?? null);

  const refreshedOnce = useRef(false);
  const ready = !loading && posts.length > 0;

  useEffect(() => {
    if (!targetUid) return;

    if (!refreshedOnce.current) {
      refreshedOnce.current = true;
      if (posts.length === 0) refresh();
    }
  }, [targetUid, refresh, posts.length]);

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
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold truncate">{profile.displayName}</h1>
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

        {profile.bio && <p className="mt-2 text-[14px]">{profile.bio}</p>}

        {!isMe && targetUid && (
          <div className="mt-3 flex gap-3">
            <FollowButton targetUid={targetUid} size="sm" variant="blue" />
            <BecomeMemberButton size="sm" onClick={() => setMemberModalOpen(true)} />
          </div>
        )}
      </div>

      {/* === Badges === */}
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
              <img src={b.icon} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* === Tabs === */}
      <div className="mt-4 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} showStats={isMe} />
        <PeriodToggle value={range} onChange={setRange} />
      </div>

      {/* === Main Content === */}
      <div className="mt-6">
        {tab === "overview" ? (
          <>
            <SummaryCardsV2
  compact
  period={range} 
  data={{
    fullPosts: summaryV2?.fullPosts ?? 0, // ← 追加
    posts: summaryV2?.posts ?? 0,         // 確定投稿数
    winRate: summaryV2?.winRate ?? 0,
    avgPrecision: summaryV2?.avgPrecision ?? 0,
    avgBrier: summaryV2?.avgBrier ?? 0,
    avgUpset: summaryV2?.avgUpset ?? 0,
    calibrationError: summaryV2?.calibrationError ?? 0,
  }}
/>

            <div className="mt-6 space-y-4">
              {loading && <div className="text-sm text-white/70">読み込み中…</div>}

              {!loading && posts.length === 0 && (
                <div className="text-sm text-white/70">まだ投稿はありません。</div>
              )}

              {!loading &&
                posts.map((p) => (
                  <PredictionPostCardV2
                    key={p.id}
                    post={p}
                    mode="list"
                  />
                ))}

              <div ref={bottomSentinel} className="h-12" />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white">
  <p className="text-base font-semibold">Stats（準備中）</p>

  <p className="mt-2 text-sm text-white/70">
    この機能は将来的に Proプラン限定機能として提供予定です。
  </p>

  <p className="mt-2 text-sm text-white/70">
    より詳しい分析指標や成績の可視化を準備中です。
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
