"use client";

import React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase";

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { toUiPost } from "@/lib/toUiPost";


/** createdAt のミリ秒 */
function getCreatedAtMillis(doc: QueryDocumentSnapshot<DocumentData>): number {
  const v: any = doc.get("createdAt");
  if (v?.toMillis) return v.toMillis();
  if (typeof v === "number") return v;
  return 0;
}


export default function PredictionListByGame({
  gameId,
  pageSize = 15,
}: {
  gameId: string;
  pageSize?: number;
}) {
  const [posts, setPosts] = React.useState<PredictionPostV2[]>([]);
  const [lastDoc, setLastDoc] =
    React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const loaderRef = React.useRef<HTMLDivElement | null>(null);

  // 初回ロード（getDocs）
  const loadInitial = React.useCallback(async () => {
    if (!gameId) return;
    const me = auth.currentUser;
    if (!me) {
      setPosts([]);
      return;
    }

    setLoading(true);

    const qInit = query(
      collection(db, "posts"),
      where("schemaVersion", "==", 2),
      where("gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const snap = await getDocs(qInit);

    if (snap.empty) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLastDoc(snap.docs[snap.docs.length - 1]);
    setPosts(snap.docs.map((d) => toUiPost(d.id, d.data())));

    if (snap.docs.length < pageSize) {
      setHasMore(false);
    }

    setLoading(false);
  }, [gameId, pageSize]);

  // 初期化 & 初回取得
  React.useEffect(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    loadInitial();
  }, [gameId, loadInitial]);

  // 追加ロード（下スクロールで呼ぶ）
  const loadMore = React.useCallback(async () => {
    if (!lastDoc || !hasMore || loading) return;

    setLoading(true);

    const qMore = query(
      collection(db, "posts"),
      where("schemaVersion", "==", 2),
      where("gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snap = await getDocs(qMore);

    if (snap.empty) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLastDoc(snap.docs[snap.docs.length - 1]);

    setPosts((prev) => [
      ...prev,
      ...snap.docs.map((d) => toUiPost(d.id, d.data())),
    ]);

    if (snap.docs.length < pageSize) {
      setHasMore(false);
    }

    setLoading(false);
  }, [gameId, lastDoc, hasMore, loading, pageSize]);


  // IntersectionObserver でスクロール時に loadMore()
  React.useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);


  // UI
  if (!posts.length && loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        読み込み中…
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        まだこの試合の分析はありません。
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {posts.map((p) => (
        <PredictionPostCardV2 key={p.id} post={p} mode="list" />
      ))}

      {/* 監視ポイント */}
      {hasMore && (
        <div ref={loaderRef} className="h-10 flex items-center justify-center text-white/60">
          {loading ? "読み込み中…" : ""}
        </div>
      )}
    </div>
  );
}
