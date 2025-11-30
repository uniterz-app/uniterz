// app/component/profile/WebProfileView.tsx
"use client";

import { ProfileViewProps } from "./ProfilePageBase";
import { Alfa_Slab_One } from "next/font/google";
import Link from "next/link";
import { Menu } from "lucide-react";
import Tabs from "./ui/Tabs";
import PeriodToggle from "./ui/PeriodToggle";
import SummaryCards from "./ui/SummaryCards";
import BottomSheet from "./ui/BottomSheet";
import { useEffect, useState } from "react";
import ProfileEditSheet from "./ProfileEditSheet";
import { toggleFollow } from "@/lib/follow";
import FollowButton from "@/app/component/common/FollowButton";
import BecomeMemberButton from "@/app/component/common/BecomeMemberButton";
import SimpleCenterModal from "@/app/component/common/SimpleCenterModal";
import { auth, db } from "@/lib/firebase";
import { useProfile } from "../profile/useProfile";
import PredictionPostCard, {
  PredictionPost,
} from "@/app/component/post/PredictionPostCard";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";

import FollowListDialog from "@/app/component/profile/FollowListDialog";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import { useUserBadges } from "./useUserBadges";
import BadgeDetailModal from "@/app/web/(no-nav)/badges/BadgeDetailModal";

/* “◯分前 / ◯時間前 / ◯日前” */
function timeAgoFromTimestamp(ts?: { toDate?: () => Date } | null): string {
  if (!ts || !ts.toDate) return "たった今";
  const diff = Date.now() - ts.toDate().getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  return `${d}日前`;
}

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

export default function WebProfileView(props: ProfileViewProps) {
  const h = props.profile?.handle?.replace(/^@/, "") ?? "";
  const { targetUid, isFollowing, setIsFollowing } = useProfile(h);

  const [memberModalOpen, setMemberModalOpen] = useState(false);

  const onToggleFollow = async () => {
    if (!targetUid) return;
    const me = auth.currentUser;
    if (!me) {
      alert("ログインが必要です");
      return;
    }
    if (me.uid === targetUid) return;

    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = await toggleFollow(targetUid);
      setIsFollowing(res.following);
    } catch (e: any) {
      setIsFollowing(prev);
      alert(e?.message ?? "フォロー操作に失敗しました");
    }
  };

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListInitial, setFollowListInitial] =
    useState<"followers" | "following">("followers");

  /* ========= 投稿一覧（getDocs 型） ========= */
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMore, setNoMore] = useState(false);

  const normalizePost = (docId: string, data: any): PredictionPost => {
    const legsArr = Array.isArray(data.legs) ? data.legs : [];
    const legs = legsArr
      .filter((l: any) => Number(l?.pct ?? 0) > 0)
      .map((l: any) => ({
        kind: (l?.kind ?? "main") as "main" | "secondary" | "tertiary",
        label: String(l?.label ?? ""),
        odds: Number(l?.odds ?? 0),
        pct: Number(l?.pct ?? 0),
        outcome: (l?.outcome ?? "pending") as
          | "pending"
          | "hit"
          | "miss"
          | "void",
      }));

    return {
      id: docId,
      author: {
        name: data.authorDisplayName ?? "ユーザー",
        avatarUrl: data.authorPhotoURL ?? undefined,
      },
      createdAtText: timeAgoFromTimestamp(data.createdAt),
      game: {
        league: (data.league ?? "bj") as "bj" | "j",
        home: data.home ?? "",
        away: data.away ?? "",
        status: (data.status ?? "scheduled") as
          | "scheduled"
          | "live"
          | "final",
      },
      legs,
      resultUnits:
        typeof data.resultUnits === "number" ? data.resultUnits : null,
      note: data.note ?? "",
      authorUid: data.authorUid ?? null,
      startAtMillis:
        typeof data.startAtMillis === "number" ? data.startAtMillis : null,
      likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
      saveCount: typeof data.saveCount === "number" ? data.saveCount : 0,
    };
  };

  /* === 初回読み込み === */
  useEffect(() => {
    if (!targetUid) {
      setPosts([]);
      setLoading(false);
      return;
    }

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

      const docs = snap.docs.map((d) =>
        normalizePost(d.id, d.data())
      );
      setPosts(docs);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setLoading(false);
    };

    load();
  }, [targetUid]);

  /* === loadMore（ページング） === */
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

    const docs = snap.docs.map((d) =>
      normalizePost(d.id, d.data())
    );

    setPosts((prev) => [...prev, ...docs]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
  };

  /* ============================================================ */

  const { profile, tab, setTab, range, setRange, summary, statsLoading } = props;

  const me = auth.currentUser;
  const isMe = !!(me && targetUid && me.uid === targetUid);
  // targetUid が null の間は呼ばない
const { badges: userBadges, loading: badgesLoading } = useUserBadges(targetUid);

  return (
    <div className="mx-auto max-w-[960px] px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-card p-10 shadow-lg text-white min-h-[180px]">
        <div className="grid grid-cols-[96px_1fr_auto] gap-6 items-start">
         <div className="h-24 w-24 rounded-full ring-3 ring-[#FFCC00]/40 overflow-hidden bg-white/0">
  {profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.style.display = "none"; // 壊れた画像は非表示
      }}
    />
  ) : null}
</div>

          <div>
            <h1 className="m-0 text-3xl font-extrabold leading-tight">
              {profile.displayName}
            </h1>
            <p className="m-0 opacity-70">@{profile.handle}</p>
            {profile.bio && <p className="mt-2">{profile.bio}</p>}

            <div className="mt-3">
              <div className="flex flex-wrap gap-2 text-sm"></div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFollowListInitial("followers");
                    setFollowListOpen(true);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
                >
                  <b className="mr-1">{profile.counts?.followers ?? 0}</b>
                  フォロワー
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFollowListInitial("following");
                    setFollowListOpen(true);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10"
                >
                  <b className="mr-1">{profile.counts?.following ?? 0}</b>
                  フォロー中
                </button>
              </div>

              {!isMe && targetUid && (
                <div className="mt-3 flex gap-6">
                  <FollowButton targetUid={targetUid} size="md" variant="blue" />
                  <BecomeMemberButton
                    size="md"
                    onClick={() => setMemberModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="pt-0 self-start">
            <button
              type="button"
              aria-label="メニューを開く"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
                {/* ★ バッジは grid の外に置く */}
        {userBadges.length > 0 && (
          <div className="mt-4 grid grid-cols-10 gap-3 max-w-full">
            {userBadges.slice(0, 10).map((b) => (
              <div
  key={b.id}
  className="
    w-14 h-14   /* ← すこし大きくする */
    flex items-center justify-center
    cursor-pointer
    overflow-hidden
  "
  onClick={() => {
    setSelectedBadge(b);
    setBadgeModalOpen(true);
  }}
>
  {b.icon ? (
    <img src={b.icon} className="w-full h-full object-contain" />
  ) : (
    <span className="text-[11px] text-white/70">{b.id}</span>
  )}
</div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} size="lg" />
        <PeriodToggle value={range} onChange={setRange} size="lg" />
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === "overview" ? (
          <div className="text-white">
            {statsLoading && (
              <div className="mb-2 text-sm text-white/70">スタッツ読込中…</div>
            )}

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


            <div className="mt-8 space-y-6">
              {loading && (
                <div className="text-sm text-white/70">読み込み中…</div>
              )}

              {!loading && posts.length === 0 && (
                <div className="text-sm text-white/70">まだ投稿はありません。</div>
              )}

              {!loading &&
                posts.length > 0 &&
                posts.map((p) => <PredictionPostCard key={p.id} post={p} />)}

              {!noMore && (
                <button
                  onClick={loadMore}
                  className="mt-4 w-full rounded-md border border-white/10 py-2 text-sm text-white/70 hover:bg-white/10"
                >
                  もっと見る
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
              <p className="text-base md:text-lg font-semibold">
                Statsタブの詳細分析機能は後日追加予定です。
              </p>
              <p className="mt-2 text-sm md:text-base text-white/70">
                リリース後は、勝率・ユニット・オッズ傾向などを
                より細かく自己分析できる画面として開発中です。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* dialogs */}
      {isEditOpen && (
        <BottomSheet
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          height="auto"
          panelMaxWidth={480}
          panelClassName="bg-transparent shadow-none p-0"
        >
          <ProfileEditSheet
            draftName={profile.displayName}
            setDraftName={() => {}}
            draftBio={profile.bio ?? ""}
            setDraftBio={() => {}}
            initialPhotoURL={profile.avatarUrl ?? null}
            onClose={() => setIsEditOpen(false)}
            onSaved={() => setIsEditOpen(false)}
          />
        </BottomSheet>
      )}

      {targetUid && (
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
        variant="web"
      />

      <SimpleCenterModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="現在開発中"
        icon="⚙️"
        message="今後、ユーザー自身が『有料プラン』を作成し、フォロワーへ有料予想を提供できる機能を追加予定です。（現在開発中）"
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
