"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "clsx";
import { Heart, Bookmark, Pencil, Trash2, X, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
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

/* ← これを追加 */
import Jersey from "@/app/component/games/icons/jersey.svg";
import { teamColorsB1 } from "@/lib/teams-b1";

function getPrimaryColor(teamName: string) {
  return teamColorsB1[teamName]?.primary ?? "#ffffff";
}


export default function PredictionPostCardV2({
  post,
  mode = "list",
}: {
  post: PredictionPostV2;
  mode?: "list" | "detail";
}) {
  const router = useRouter();

  /* ----------------------
   * Auth
   * ---------------------- */
  const [uid, setUid] = React.useState<string | null>(
    auth.currentUser?.uid ?? null
  );
  React.useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  const isMine = uid && post.authorUid === uid;

  /* ----------------------
   * Like / Save
   * ---------------------- */
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

  /* ----------------------
   * 編集 / 削除
   * ---------------------- */
  const [editing, setEditing] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState(post.note ?? "");
  const [busy, setBusy] = React.useState(false);

  const submitEdit = async (e: any) => {
    e.stopPropagation();
    if (!isMine) return;

    const token = await auth.currentUser?.getIdToken();
    if (!token) return toast.error("ログインが必要です");

    try {
      setBusy(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: draftNote }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("更新しました");
      setEditing(false);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (e: any) => {
    e.stopPropagation();
    if (!isMine) return;

    if (!confirm("削除しますか？")) return;

    const token = await auth.currentUser?.getIdToken();
    if (!token) return;

    try {
      await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  /* ----------------------
   * highlight color
   * ---------------------- */
  let frame = "ring-1 ring-white/10 border-white/10";

  if (post.stats?.isWin) {
    frame = "ring-2 ring-yellow-400/70 border-yellow-400";
  }
  if (post.stats?.upsetScore && post.stats.upsetScore > 5) {
    frame = "ring-2 ring-red-400/70 border-red-400";
  }

  const profileUrl = `/mobile/u/${post.authorHandle ?? post.authorUid}`;

  /* ----------------------
   * winner info
   * ---------------------- */
  const winnerTeamRaw =
    post.prediction.winner === "home"
      ? post.game?.home
      : post.game?.away;

  const iconColor = getPrimaryColor(winnerTeamRaw ?? "");

  const scoreText = `${post.prediction.score.home} - ${post.prediction.score.away}`;

  /* =======================================================================
   *  本体 UI
   * ======================================================================= */
  return (
    <div
      className={cn("rounded-3xl p-1 cursor-pointer", frame)}
      onClick={() => {
        if (mode === "list") router.push(`/post/${post.id}`);
      }}
    >
      <div className="rounded-2xl bg-black/10 border border-white/10 p-4 text-white">
        {/* --------------------
            プロフィールヘッダー
        -------------------- */}
        <Link
          href={profileUrl}
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-[#0f2d35]">
            <img
              src={post.author?.avatarUrl ?? "/avatar-placeholder.png"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] md:text-xl font-extrabold truncate">
                {post.author?.name ?? "ユーザー"}
              </h3>
              <span className="text-xs opacity-70">{post.createdAtText}</span>
            </div>

            {/* 試合名 */}
            <div
              className="mt-0.5 text-sm md:text-lg font-extrabold tracking-wide cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/mobile/games/${post.gameId}/predictions`);
              }}
            >
              {post.game?.home}{" "}
              <span className="opacity-70">vs</span>{" "}
              {post.game?.away}
            </div>
          </div>
        </Link>

        {/* --------------------
            勝利チーム + 自信度
        -------------------- */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* 勝利チーム */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs opacity-70">勝利チーム</div>

            <div className="mt-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/20 ring-2 ring-white/10 grid place-items-center overflow-hidden">
                <Jersey
                  className="w-8 h-8"
                  fill={iconColor}
                  stroke="#fff"
                />
              </div>

              <div className="text-lg font-extrabold truncate">
                {winnerTeamRaw}
              </div>
            </div>
          </div>

          {/* 自信度 */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs opacity-70">自信度</div>
            <div className="mt-1 text-lg font-extrabold">
              {post.prediction.confidence}%
            </div>
          </div>
        </div>

        {/* --------------------
            予想スコア
        -------------------- */}
        <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-xs opacity-70">予想スコア</div>
          <div className="mt-1 text-lg font-extrabold">{scoreText}</div>
        </div>

        {/* --------------------
            コメント
        -------------------- */}
        <div className="mt-4">
          {!editing ? (
            <p className="text-[14px] md:text-[16px] leading-relaxed">
              {post.note || "（コメントなし）"}
            </p>
          ) : (
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={3}
              className="w-full bg-white/10 rounded-xl p-3 outline-none"
            />
          )}
        </div>

        {/* --------------------
            アクション行
        -------------------- */}
        <div className="mt-4 flex items-center justify-between">
          {/* 編集／削除 */}
          <div className="flex items-center gap-2">
            {isMine &&
              (!editing ? (
                <>
                  <button
                    className="h-8 w-8 rounded-lg bg-white/10 border border-white/15"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="h-8 w-8 rounded-lg bg-white/10 border border-white/15"
                    onClick={doDelete}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="h-8 w-8 rounded-lg bg-emerald-300/20 border border-emerald-300/40"
                    onClick={submitEdit}
                  >
                    <Check size={16} />
                  </button>

                  <button
                    className="h-8 w-8 rounded-lg bg-white/10 border border-white/15"
                    onClick={() => setEditing(false)}
                  >
                    <X size={16} />
                  </button>
                </>
              ))}
          </div>

          {/* いいね + ブックマーク */}
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={async (e) => {
                e.stopPropagation();
                if (!uid) return toast.error("ログインが必要です");

                const ref = doc(db, "posts", post.id, "likes", uid);
                const snap = await getDoc(ref);

                snap.exists()
                  ? deleteDoc(ref)
                  : setDoc(ref, { createdAt: new Date() });
              }}
              className="flex items-center gap-1"
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  liked ? "text-pink-400 fill-current" : "text-white"
                )}
              />
              <span className="text-sm">{likeCount}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={async (e) => {
                e.stopPropagation();
                if (!uid) return;

                const ref = doc(db, "posts", post.id, "saves", uid);
                const snap = await getDoc(ref);

                snap.exists()
                  ? deleteDoc(ref)
                  : setDoc(ref, { createdAt: new Date() });
              }}
              className="flex items-center gap-1"
            >
              <Bookmark
                className={cn(
                  "w-5 h-5 transition-colors",
                  saved ? "text-emerald-400 fill-current" : "text-white"
                )}
              />
              <span className="text-sm">{saveCount}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
