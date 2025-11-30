"use client";

import { useCallback, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mapRawToPredictionPost } from "@/lib/map-post";
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";

const PAGE_SIZE = 10;

export function useProfilePostsFeed(targetUid: string | null) {
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ★ 初回 refresh の二重実行を防ぐフラグ
  const hasRefreshedRef = useRef(false);

  // ★ ALL/Following と同じ重複排除用 Map
  const postsMapRef = useRef<Map<string, PredictionPost>>(new Map());

  /* ======================================================
     Map に統合して posts を更新（重複なし）
  ====================================================== */
  const mergePosts = useCallback((newPosts: PredictionPost[]) => {
    const map = postsMapRef.current;

    newPosts.forEach((p) => {
      map.set(p.id, p); // ← 同じ ID の投稿は上書き = 重複排除
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0)
    );

    setPosts(sorted);
  }, []);

  /* ======================================================
     refresh（初回のみ）
  ====================================================== */
  const refresh = useCallback(async () => {
    if (!targetUid) return;

    if (hasRefreshedRef.current) return;
    hasRefreshedRef.current = true;

    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", targetUid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));

      // ★ Profile も ALL と同じ merge
      postsMapRef.current.clear();
      mergePosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
    } finally {
      setLoading(false);
    }
  }, [targetUid, mergePosts]);

  /* ======================================================
     loadMore
  ====================================================== */
  const loadMore = useCallback(async () => {
    if (!targetUid || loading || noMore || !lastDocRef.current) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", targetUid),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setNoMore(true);
      } else {
        const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));

        // ★ ALL と同じマージ方式
        mergePosts(newPosts);

        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
    } finally {
      setLoading(false);
    }
  }, [targetUid, loading, noMore, mergePosts]);

  return {
    posts,
    loading,
    noMore,
    refresh,
    loadMore,
  };
}
