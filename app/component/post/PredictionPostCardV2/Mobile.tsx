"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "clsx";
import { Heart, Bookmark, Pencil, Trash2, X, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import MobileMatchCard from "@/app/component/games/MobileMatchCard";
import { motion } from "framer-motion";

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
import { TEAM_SHORT } from "@/lib/team-short";


export default function Mobile({
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
        // ★ ここ重要（次の項目）
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

  // --- 編集関連はすべて削除 ---


// ------------------------------
// 削除だけ残す（API パスを修正）
// ------------------------------
const doDelete = async (e: any) => {
  e.stopPropagation();
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
   * Highlight frame
   * ------------------------------ */
  let frame = "ring-1 ring-white/10 border-white/10";
  if (post.stats?.isWin) frame = "ring-2 ring-yellow-400/70 border-yellow-400";
  if (post.stats?.upsetScore && post.stats.upsetScore > 5)
    frame = "ring-2 ring-red-400/70 border-red-400";

  // ★ ここに badge ロジックを追加
let badge: "hit" | "upset" | "miss" | null = null;

if (post.stats?.isWin && post.stats?.upsetScore && post.stats.upsetScore > 5) {
  // アップセット勝利
  badge = "upset";
} else if (post.stats?.isWin) {
  // 通常勝利
  badge = "hit";
} else if (post.stats && post.stats.isWin === false) {
  // 外れ
  badge = "miss";
}

  /* ------------------------------
   * MatchCard 用に games/{id} を取得
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
  const homeShort =
  TEAM_SHORT[post.home.teamId ?? ""] ?? post.home.name;

const awayShort =
  TEAM_SHORT[post.away.teamId ?? ""] ?? post.away.name;

const winnerTeam =
  post.prediction.winner === "home" ? homeShort : awayShort;
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

        {/* プロフィールヘッダー */}
        <Link
          href={
            profileHref ??
            `${prefix}/u/${post.authorHandle ?? post.authorUid}`
          }
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-3"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-[#0f2d35] shrink-0 bg-white/10 flex items-center justify-center">

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
              <h3 className="text-[15px] font-extrabold truncate">
  {author?.name ?? post.author?.name ?? "ユーザー"}
</h3>
              <span className="text-xs opacity-70">
                {post.createdAtText}
              </span>
            </div>
          </div>
        </Link>

        {/* ミニ MatchCard */}
        <div
          className="mt-3"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`${prefix}/games/${post.gameId}/predictions`);
          }}
        >
          <div
  className="mt-3"
  onClick={(e) => {
    e.stopPropagation();
    router.push(`${prefix}/games/${post.gameId}/predictions`);
  }}
>
  <MobileMatchCard {...matchProps} />
</div>
        </div>

        <div className="mt-4 grid grid-cols-11 gap-3">

  {/* 勝利チーム */}
  <div className="col-span-4 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-center">
    <div className="text-xs opacity-60 text-center">勝利チーム</div>
    <div className="mt-1 text-sm font-extrabold truncate">
      {winnerTeam}
    </div>
  </div>

  {/* 自信度 */}
  <div className="col-span-3 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-center">
    <div className="text-xs opacity-60 text-center">自信度</div>
    <div className="mt-1 text-sm font-extrabold">
      {post.prediction.confidence}%
    </div>
  </div>

  {/* 予想スコア */}
  <div className="col-span-4 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-center">
    <div className="text-xs opacity-60 text-center">予想スコア</div>
    <div className="mt-1 text-sm font-extrabold">
      {scoreText}
    </div>
  </div>

</div>

        {/* コメント */}
<div className="mt-4">
  <p className="text-[14px] leading-relaxed whitespace-pre-line">
    {post.note || "（コメントなし）"}
  </p>
</div>
       {/* ----------------------------------
    アクション行（編集なし・削除のみ）
---------------------------------- */}
<div className="mt-4 flex items-center justify-between">

  {/* 左：削除（開始前のみ）／削除なしでも空スペースを維持 */}
<div className="flex items-center gap-3 w-14">
  {showDelete && isMine && isValidPostId && !isGameStarted ? (
    <button
      className="w-4 h-4 flex items-center justify-center"
      onClick={doDelete}
    >
      <Trash2 size={22} />
    </button>
  ) : (
    <div className="w-6 h-6" />
  )}
</div>


  {/* 右：いいね / ブックマーク（常に右端固定） */}
  <div className="flex items-center gap-6">

    {/* いいね */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 1.2 }}
        className="w-4 h-4 flex items-center justify-center"
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
        className="w-6 h-6 flex items-center justify-center"
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
            "w-4 h-4 transition-colors",
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
