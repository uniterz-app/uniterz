// app/mobile/(no-nav)/bookmarks/page.tsx
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

import PredictionPostCard, {
  type PredictionPost,
} from "@/app/component/post/PredictionPostCard";

/* “◯分前 / ◯時間前 / ◯日前” */
function timeAgoFromDate(date: Date | null | undefined): string {
  if (!date) return "たった今";
  const diff = Date.now() - date.getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  return `${d}日前`;
}

/** スワイプで戻る */
function useSwipeBack(onBack: () => void) {
  const startX = React.useRef<number | null>(null);
  const startY = React.useRef<number | null>(null);
  const startTime = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const vw = window.innerWidth ?? 0;

    // 左 60% のみ判定
    if (t.clientX > vw * 0.6) return;

    startX.current = t.clientX;
    startY.current = t.clientY;
    startTime.current = Date.now();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null || startY.current == null) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    const dt = Date.now() - (startTime.current ?? Date.now());

    // リセット
    startX.current = null;
    startY.current = null;
    startTime.current = null;

    // 条件
    if (dx > 50 && Math.abs(dy) < 60 && dt < 600) {
      onBack();
    }
  };

  return { onTouchStart, onTouchEnd };
}

export default function MobileBookmarksPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [needLogin, setNeedLogin] = useState(false);

  const swipeHandlers = useSwipeBack(() => router.back());

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

    setLoading(true);

    const unsub = onSnapshot(
      qref,
      async (snap) => {
        // saves → 親 post をまとめて取得
        const tasks = snap.docs.map(async (saveDoc) => {
          const postRef = saveDoc.ref.parent?.parent;
          if (!postRef) return null;

          const postSnap = await getDoc(postRef);
          if (!postSnap.exists()) return null;

          const data = postSnap.data();

          // legs
          const legs = (Array.isArray(data?.legs) ? data.legs : [])
            .filter((l: any) => Number(l?.pct ?? 0) > 0)
            .map((l: any) => ({
              kind: (l?.kind ?? "main") as
                | "main"
                | "secondary"
                | "tertiary",
              label: String(l?.label ?? ""),
              odds: Number(l?.odds ?? 0),
              pct: Number(l?.pct ?? 0),
              outcome: (l?.outcome ?? "pending") as
                | "pending"
                | "hit"
                | "miss"
                | "void",
            }));

          // createdAt
          const createdAt =
            (data?.createdAt && data.createdAt.toDate?.()) || null;

          const post: PredictionPost = {
            id: postSnap.id,
            author: {
              name: data?.authorDisplayName ?? "ユーザー",
              avatarUrl: data?.authorPhotoURL ?? undefined,
            },
            createdAtText: timeAgoFromDate(createdAt),
            game: {
              league: (data?.league ?? "bj") as "bj" | "j",
              home: data?.home ?? "",
              away: data?.away ?? "",
              status: (data?.status ?? "scheduled") as
                | "scheduled"
                | "live"
                | "final",
              finalScore: data?.finalScore ?? undefined,
            },
            legs,
            resultUnits:
              typeof data?.resultUnits === "number"
                ? data.resultUnits
                : null,
            note: data?.note ?? "",
            authorUid: data?.authorUid ?? null,
            startAtMillis:
              typeof data?.startAtMillis === "number"
                ? data.startAtMillis
                : null,
            likeCount:
              typeof data?.likeCount === "number"
                ? data.likeCount
                : 0,
            saveCount:
              typeof data?.saveCount === "number"
                ? data.saveCount
                : 0,
          };

          return post;
        });

        const resolved = await Promise.all(tasks);
        setPosts(resolved.filter((p): p is PredictionPost => p !== null));
        setLoading(false);
      },
      (err) => {
        console.error("bookmarks onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <main
      {...swipeHandlers}
      className="min-h-screen bg-black text-white px-4 py-4"
    >
      {/* ヘッダー */}
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold">ブックマーク</h1>
          <p className="text-xs text-white/60">
            保存した投稿が新しい順に表示されます
          </p>
        </div>
      </header>

      {/* 本文 */}
      {needLogin ? (
        <p className="text-sm text-white/70">
          ブックマークを見るにはログインが必要です。
        </p>
      ) : loading ? (
        <p className="text-sm text-white/70">読み込み中…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-white/70">
          まだブックマークした投稿がありません。
        </p>
      ) : (
        <div className="space-y-4 pb-8">
          {posts.map((p) => (
            <PredictionPostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
