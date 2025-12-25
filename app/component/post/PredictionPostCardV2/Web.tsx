"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "clsx";
import { Heart, Bookmark, Trash2, } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { motion } from "framer-motion";
import { getTeamPrimaryColor } from "@/lib/team-colors";

import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
} from "firebase/firestore";

import { usePrefix } from "@/app/PrefixContext";
import { toMatchCardProps } from "@/lib/games/transform";
import MatchCard from "@/app/component/games/MatchCard";

export default function PredictionPostCardV2({
  post,
  mode = "list",
  profileHref,
  showDelete = false,
}: {
  post: PredictionPostV2;
  mode?: "list" | "detail";
  profileHref?: string;
  showDelete?: boolean;
}) {
  const router = useRouter();
  const prefix = usePrefix();

  /* ------------------------------
   * Auth
   * ------------------------------ */
  const [uid, setUid] = React.useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  React.useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  const isMine = uid && post.authorUid === uid;

  /* ------------------------------
 * Author (users/{uid} を正とする)
 * ------------------------------ */
const [author, setAuthor] = React.useState<{
  name?: string;
  avatarUrl?: string | null;
} | null>(null);

React.useEffect(() => {
  if (!post.authorUid) return;

  const ref = doc(db, "users", post.authorUid);
  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      setAuthor({
        name: snap.data().displayName ?? snap.data().name,
        avatarUrl: snap.data().avatarUrl ?? snap.data().photoURL,
      });
    }
  });

  return () => unsub();
}, [post.authorUid]);

  // 不正な ID（"(invalid)" など）を弾く
const isValidPostId =
  typeof post.id === "string" &&
  post.id.trim() !== "" &&
  !post.id.startsWith("(");

  /* ------------------------------
   * Like / Save
   * ------------------------------ */
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount ?? 0);
  const [saveCount, setSaveCount] = React.useState(post.saveCount ?? 0);

  React.useEffect(() => {
    if (!uid) return;

    const likesQ = query(collection(db, "posts", post.id, "likes"));
    const unsubLikes = onSnapshot(likesQ, (snap) => {
      setLikeCount(snap.size);
      setLiked(snap.docs.some((d) => d.id === uid));
    });

    const savesQ = query(collection(db, "posts", post.id, "saves"));
    const unsubSaves = onSnapshot(savesQ, (snap) => {
      setSaveCount(snap.size);
      setSaved(snap.docs.some((d) => d.id === uid));
    });

    return () => {
      unsubLikes();
      unsubSaves();
    };
  }, [uid, post.id]);

  /* ------------------------------
 * 削除だけ残す
 * ------------------------------ */

const doDelete = async (e: any) => {
  e.stopPropagation();
  console.log("DELETE TRY id =", post.id); 
  if (!isMine) return;

  if (!confirm("削除しますか？")) return;

  const token = await auth.currentUser?.getIdToken();
  if (!token) return;

  try {
    const res = await fetch(`/api/posts_v2/${post.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      toast.error("削除に失敗しました");
      return;
    }

    toast.success("削除しました");
  } catch {
    toast.error("削除に失敗しました");
  }
};

  /* ------------------------------
   * Highlight Frame
   * ------------------------------ */
  let frame = "ring-1 ring-white/10 border-white/10";
  if (post.stats?.isWin) frame = "ring-2 ring-yellow-400/70 border-yellow-400";
  if (post.stats?.upsetScore && post.stats.upsetScore > 5)
    frame = "ring-2 ring-red-400/70 border-red-400";

  // ★ badge ロジック
let badge: "hit" | "upset" | "miss" | null = null;

if (post.stats?.isWin && post.stats?.upsetScore && post.stats.upsetScore > 5) {
  badge = "upset";
} else if (post.stats?.isWin) {
  badge = "hit";
} else if (post.stats && post.stats.isWin === false) {
  badge = "miss";
}

  /* ------------------------------
   *  MatchCard 用に games/{id} を取得
   * ------------------------------ */
  const [gameDoc, setGameDoc] = React.useState<any | null>(null);

  React.useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "games", post.gameId));
      if (snap.exists()) {
        setGameDoc({ id: snap.id, ...snap.data() });
      }
    })();
  }, [post.gameId]);

    if (!gameDoc) return null;

  // ------------------------------
  // 試合開始しているかどうか
  // ------------------------------
  const isGameStarted = (() => {
    const d = gameDoc.startAtJst; // Firestore Timestamp が入っている想定
    if (!d) return false;
    try {
      const dt = d.toDate ? d.toDate() : new Date(d);
      return Date.now() >= dt.getTime();
    } catch {
      return false;
    }
  })();

  const matchProps = toMatchCardProps(gameDoc, { dense: true });

  /* ------------------------------
   * 予想表示用
   * ------------------------------ */
  const homeName = post.home.name;
const awayName = post.away.name;

// ★ サッカー判定
const isSoccer = post.league === "j1" || post.league === "pl";

// ★ 勝敗ラベル
const winnerLabel = (() => {
  if (post.prediction.winner === "draw") return "引き分け";
  if (post.prediction.winner === "home") return homeName;
  if (post.prediction.winner === "away") return awayName;
  return "-";
})();

// ★ 勝利チーム背景色（薄く）
const winnerBgColor = (() => {
  if (post.prediction.winner === "home") {
    return getTeamPrimaryColor(post.league, post.home.teamId);
  }
  if (post.prediction.winner === "away") {
    return getTeamPrimaryColor(post.league, post.away.teamId);
  }
  if (post.prediction.winner === "draw") {
    return "rgba(156,163,175,0.18)";
  }
  return null;
})();


  const scoreText = `${post.prediction.score.home} - ${post.prediction.score.away}`;

  return (
    <div
className={cn("rounded-3xl p-1 cursor-pointer relative", frame)}
      onClick={() => router.push(`${prefix}/post/${post.id}`)}
    >
        {/* ★ BADGE エリア */}
{badge === "hit" && (
  <span className="absolute right-3 top-3 bg-yellow-400 text-black text-[11px] px-2 py-0.5 rounded-md font-bold shadow-md">
    HIT
  </span>
)}
{badge === "upset" && (
  <span className="absolute right-3 top-3 bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-md font-bold shadow-md">
    UPSET
  </span>
)}
{badge === "miss" && (
  <span className="absolute right-3 top-3 bg-gray-500 text-white text-[11px] px-2 py-0.5 rounded-md font-bold shadow-md">
    MISS
  </span>
)}
      <div className="rounded-2xl bg-black/10 border border-white/10 p-4 text-white">

        {/* ----------------------------------
            プロフィールヘッダー
        ---------------------------------- */}
        <Link
          href={
            profileHref ??
            `${prefix}/u/${post.authorHandle ?? post.authorUid}`
          }
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-3"
        >
          <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-[#0f2d35] shrink-0 bg-white/10 flex items-center justify-center">
  {(author?.avatarUrl ?? post.author?.avatarUrl) ? (
  <img
    src={author?.avatarUrl ?? post.author?.avatarUrl}
    className="w-full h-full object-cover"
    alt="avatar"
  />
) : null}
</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] md:text-xl font-extrabold truncate">
  {author?.name ?? post.author?.name ?? "ユーザー"}
</h3>
              <span className="text-sm md:text-base opacity-70">
                {post.createdAtText}
              </span>
            </div>
          </div>
        </Link>

        {/* ----------------------------------
            ミニ MatchCard
        ---------------------------------- */}
        <div
          className="mt-3"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`${prefix}/games/${post.gameId}/predictions`);
          }}
        >
          <MatchCard
  {...matchProps}
  hideActions
  hideLine
  dense
  className="
    /* RoundLabel → もっと上へ */
    md:[&_.mc-round]:mt3

    /* キックオフ時間 → 上へ */
    md:[&_.mc-center]:mt-4

    /* HOME / AWAY ブロック全体を上に */
    md:[&_.mc-home]:-mt-7
    md:[&_.mc-away]:-mt-7

    /* チーム名の調整 */
    md:[&_.mc-name]:mt-0.5

    /* 戦績の調整 */
    md:[&_.mc-record]:mt-0
  "
/>
        </div>

        {/* ----------------------------------
            勝利チーム / 自信度 / 予想スコア
            横並び 4:2:4
        ---------------------------------- */}
       <div className="mt-4 grid grid-cols-10 gap-3">

  {/* 勝利チーム (col-span-4) */}
  <div
  className="col-span-4 border border-white/10 rounded-xl p-3 text-center transition-colors"
  style={{
    backgroundColor: winnerBgColor
      ? winnerBgColor.startsWith("rgba")
        ? winnerBgColor
        : `${winnerBgColor}33`
      : "rgba(255,255,255,0.05)",
  }}
>
  <div className="text-xs opacity-60 text-center">
    勝利チーム
  </div>
  <div className="mt-1 text-xl font-extrabold truncate">
    {winnerLabel}
  </div>
</div>

  {/* 自信度 (col-span-2) */}
  <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <div className="text-xs opacity-60 text-center">自信度</div>
    <div className="mt-1 text-2xl font-extrabold">
      {post.prediction.confidence}%
    </div>
  </div>

  {/* 予想スコア (col-span-4) */}
  <div className="col-span-4 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <div className="text-xs opacity-60 text-center">予想スコア</div>
    <div className="mt-1 text-2xl font-extrabold">
      {scoreText}
    </div>
  </div>

</div>
       {/* コメント */}
<div className="mt-4 mr-6"> 
  <p className="text-[14px] md:text-[16px] leading-relaxed whitespace-pre-line">
    {post.note || "（コメントなし）"}
  </p>
</div>
        {/* ----------------------------------
    アクション行
---------------------------------- */}
<div className="mt-4 flex items-center justify-between">

  {/* 左ブロック：削除（またはダミーでスペース確保） */}
<div className="flex items-center gap-3 w-24">
  {showDelete && isMine && isValidPostId && !isGameStarted ? (
  <button
    className="w-10 h-10 flex items-center justify-center"
    onClick={doDelete}
  >
    <Trash2 size={22} />
  </button>
) : (
  <div className="w-10 h-10" />
)}
</div>

  {/* 右ブロック：いいね + 保存（右端固定・数字付き） */}
  <div className="flex items-center gap-6 ml-auto">

    {/* いいね */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 1.2 }}
        className="w-10 h-10 flex items-center justify-center"
        onClick={async (e) => {
          e.stopPropagation();
          if (!uid) return toast.error("ログインが必要です");
          const ref = doc(db, "posts", post.id, "likes", uid);
          const snap = await getDoc(ref);
          snap.exists()
            ? deleteDoc(ref)
            : setDoc(ref, { createdAt: new Date() });
        }}
      >
        <Heart
          className={cn(
            "w-6 h-6 transition-colors",
            liked ? "text-pink-400 fill-current" : "text-white"
          )}
        />
      </motion.button>

      <span className="text-sm">{likeCount}</span>
    </div>

    {/* ブックマーク */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 1.2 }}
        className="w-10 h-10 flex items-center justify-center"
        onClick={async (e) => {
          e.stopPropagation();
          if (!uid) return;
          const ref = doc(db, "posts", post.id, "saves", uid);
          const snap = await getDoc(ref);
          snap.exists()
            ? deleteDoc(ref)
            : setDoc(ref, { createdAt: new Date() });
        }}
      >
        <Bookmark
          className={cn(
            "w-6 h-6 transition-colors",
            saved ? "text-emerald-400 fill-current" : "text-white"
          )}
        />
      </motion.button>

      <span className="text-sm">{saveCount}</span>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}
