"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

/* 時間表示 */
function timeAgo(date: Date | null): string {
  if (!date) return "たった今";
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function WebBookmarksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }

    const qref = query(
      collectionGroup(db, "saves"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(
      qref,
      async (snap) => {
        const tasks = snap.docs.map(async (saveDoc) => {
          const postRef = saveDoc.ref.parent?.parent;
          if (!postRef) return null;

          const postSnap = await getDoc(postRef);
          if (!postSnap.exists()) return null;

          const d: any = postSnap.data();
          const g = d.game ?? {};

          // final score
          const fs = g.finalScore ?? d.finalScore ?? null;
          const finalScore =
            fs != null
              ? { home: Number(fs.home), away: Number(fs.away) }
              : undefined;

          const createdAt =
            d?.createdAt?.toDate?.() ?? null;

          const post: PredictionPostV2 = {
  id: postSnap.id,

  // ---- Author ----
  authorUid: d.authorUid ?? null,
  authorHandle: d.authorHandle ?? null,
  author: {
    name: d.author?.name ?? d.authorDisplayName ?? "ユーザー",
    avatarUrl: d.author?.avatarUrl ?? d.authorPhotoURL ?? undefined,
  },

  createdAtText: timeAgo(createdAt),
  createdAtMillis: createdAt?.getTime(),

  // ---- Game Required Fields (V2仕様) ----
  league: d.league ?? g.league ?? "bj",
  status: d.status ?? g.status ?? "scheduled",
  gameId: d.gameId ?? g.gameId ?? null,

  // ---- Team Info (V2) ----
  home: {
    name: d.home?.name ?? g.home?.name ?? g.home ?? "",
    teamId: d.home?.teamId ?? "",
    number: d.home?.number,
    record: d.home?.record ?? null,
  },
  away: {
    name: d.away?.name ?? g.away?.name ?? g.away ?? "",
    teamId: d.away?.teamId ?? "",
    number: d.away?.number,
    record: d.away?.record ?? null,
  },

  /* optional old block for compatibility */
  game: {
    league: d.league ?? g.league ?? "bj",
    home:
      typeof g.home === "string"
        ? g.home
        : g.home?.name ?? d.home?.name ?? "",
    away:
      typeof g.away === "string"
        ? g.away
        : g.away?.name ?? d.away?.name ?? "",
    status: g.status ?? d.status ?? "scheduled",
    finalScore,
  },

  // ---- Prediction ----
  prediction: {
    winner:
      d.prediction?.winner === "home" || d.prediction?.winner === "away"
        ? d.prediction.winner
        : "home",
    confidence: Number(d.prediction?.confidence ?? 50),
    score: {
      home: Number(d.prediction?.score?.home ?? 0),
      away: Number(d.prediction?.score?.away ?? 0),
    },
  },

  note: d.note ?? "",

  likeCount: Number(d.likeCount ?? 0),
  saveCount: Number(d.saveCount ?? 0),

  stats: d.stats ?? null,
};

          return post;
        });

        const resolved = await Promise.all(tasks);
        setPosts(resolved.filter((p): p is PredictionPostV2 => p !== null));
        setLoading(false);
      },
      (err) => {
        console.error("web bookmarks error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-[#050509] text-white px-4 py-6 flex justify-center">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">ブックマーク</h1>
            <p className="text-xs text-white/60">
              保存した投稿が新しい順に表示されます
            </p>
          </div>
        </header>

        {/* BODY */}
        {needLogin ? (
          <p className="text-sm text-white/70">ログインが必要です。</p>
        ) : loading ? (
          <p className="text-sm text-white/70">読み込み中…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-white/70">まだ何も保存されていません。</p>
        ) : (
          <div className="space-y-4 pb-10">
            {posts.map((p) => {
              const handle =
                (p.authorHandle ?? "").replace(/^@/, "") ||
                p.authorUid ||
                "";
              const profileHref = `/web/u/${handle}`;

              return (
                <PredictionPostCardV2
                  key={p.id}
                  post={p}
                  mode="list"
                  profileHref={profileHref}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
