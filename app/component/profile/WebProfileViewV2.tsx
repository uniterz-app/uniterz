// app/component/profile/WebProfileViewV2.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";

import type { ProfileViewPropsV2 } from "./ProfilePageBaseV2";

import FollowButton from "@/app/component/common/FollowButton";
import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";

import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCardsV2 from "./ui/SummaryCardsV2";

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { mapRawToPredictionPostV2 } from "@/lib/map-post-v2";

import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAfter,
  limit,
} from "firebase/firestore";

import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import FollowListDialog from "@/app/component/profile/FollowListDialog";

import { useUserBadges } from "./useUserBadges";
import BadgeDetailModal from "@/app/web/(no-nav)/badges/BadgeDetailModal";

function timeAgoFromTimestamp(ts?: { toDate?: () => Date } | null) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${dd} ${hh}:${mm}`;
}

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

  /* ========= 投稿一覧 ========= */
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMore, setNoMore] = useState(false);

  /* ========= ★ V2 投稿形式に統一 = mapRawToPredictionPostV2 ========= */
  const normalizePost = (id: string, data: any): PredictionPostV2 => {
    return mapRawToPredictionPostV2({ id, ...data });
  };

  useEffect(() => {
    if (!targetUid) return;

    const load = async () => {
      setLoading(true);

      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", targetUid),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        setPosts([]);
        setNoMore(true);
        setLoading(false);
        return;
      }

      setPosts(snap.docs.map((d) => normalizePost(d.id, d.data())));
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setLoading(false);
    };

    load();
  }, [targetUid]);

  const loadMore = async () => {
    if (!targetUid || noMore || !lastDoc) return;

    const q = query(
      collection(db, "posts"),
      where("authorUid", "==", targetUid),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(20)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      setNoMore(true);
      return;
    }

    setPosts((prev) => [
      ...prev,
      ...snap.docs.map((d) => normalizePost(d.id, d.data())),
    ]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
  };

  /* ======= Badges ======= */
  const { badges: userBadges } = useUserBadges(targetUid);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  /* ======= Follow list modal ======= */
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] =
    useState<"followers" | "following">("followers");

  /* ======= Drawer ======= */
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-6 text-white">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-card p-10 shadow-lg min-h-[180px]">
        <div className="grid grid-cols-[96px_1fr_auto] gap-6 items-start">
          <div className="h-24 w-24 rounded-full ring-3 ring-[#FFCC00]/40 overflow-hidden">
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} className="w-full h-full object-cover" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold">{profile.displayName}</h1>
            <p className="opacity-70">{profile.handle}</p>

            {profile.bio && <p className="mt-2">{profile.bio}</p>}

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-full border border-white/10 px-3 py-1"
                onClick={() => {
                  setFollowListInitial("followers");
                  setFollowListOpen(true);
                }}
              >
                <b>{profile.counts.followers}</b> フォロワー
              </button>

              <button
                className="rounded-full border border-white/10 px-3 py-1"
                onClick={() => {
                  setFollowListInitial("following");
                  setFollowListOpen(true);
                }}
              >
                <b>{profile.counts.following}</b> フォロー中
              </button>
            </div>

            {!isMe && targetUid && (
              <div className="mt-3 flex gap-6">
                <FollowButton targetUid={targetUid} size="md" variant="blue" />
                <BecomeMemberButton size="md" onClick={() => {}} />
              </div>
            )}
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {userBadges.length > 0 && (
          <div className="mt-4 grid grid-cols-10 gap-3">
            {userBadges.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className="w-14 h-14 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  setSelectedBadge(b);
                  setBadgeModalOpen(true);
                }}
              >
                {b.icon ? (
                  <img src={b.icon} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs opacity-70">{b.id}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onChange={setTab} size="lg" showStats={isMe} />
        <PeriodToggle value={range} onChange={setRange} size="lg" />
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === "overview" ? (
          <div>
            <SummaryCardsV2
            period={range} 
  data={{
    fullPosts: summary?.fullPosts ?? 0,  // ← これが全投稿数！
    posts: summary?.posts ?? 0,          // ← 確定投稿数
    winRate: summary?.winRate ?? 0,
    avgPrecision: summary?.avgPrecision ?? 0,
    avgBrier: summary?.avgBrier ?? 0,
    avgUpset: summary?.avgUpset ?? 0,
    calibrationError: summary?.calibrationError ?? 0,
  }}
/>

            <div className="mt-8 space-y-6">
              {loading && <div className="opacity-70">読み込み中…</div>}

              {!loading && posts.length === 0 && (
                <div className="opacity-70">まだ投稿はありません。</div>
              )}

              {posts.map((p) => (
                <PredictionPostCardV2 key={p.id} post={p} mode="list" />
              ))}

              {!noMore && (
                <button
                  onClick={loadMore}
                  className="mt-4 w-full rounded-md border border-white/10 py-2 text-sm opacity-70 hover:bg-white/10"
                >
                  もっと見る
                </button>
              )}
            </div>
          </div>
        ) : <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center space-y-3">
  <p className="text-lg font-semibold">Stats（準備中）</p>

  <p className="text-sm text-white/80">
    この機能は将来的に
    <span className="font-semibold text-amber-300">
      Proプラン限定機能
    </span>
    として提供予定です。
  </p>

  <p className="text-sm text-white/60">
    より詳しい分析指標や成績の可視化を準備中です。
  </p>
</div>
}
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
