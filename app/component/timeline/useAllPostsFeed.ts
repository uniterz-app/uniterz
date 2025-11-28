"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mapRawToPredictionPost } from "@/lib/map-post";
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";

const PAGE_SIZE = 15;

export function useAllPostsFeed() {
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  /** 👇 ここが核心：重複排除用の Map */
  const postsMapRef = useRef<Map<string, PredictionPost>>(new Map());

  /* ======================================================
     初回ロード
  ====================================================== */
  useEffect(() => {
    loadMore();
  }, []);

  /* ======================================================
     Map に統合して posts を更新（重複なし）
  ====================================================== */
  const mergePosts = useCallback((newPosts: PredictionPost[]) => {
    const map = postsMapRef.current;

    newPosts.forEach((p) => {
      map.set(p.id, p);   // ← “同じ id” は上書きされるので重複しない
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.startAtMillis ?? 0) - (a.startAtMillis ?? 0)
    );

    setPosts(sorted);
  }, []);

  /* ======================================================
     ページング読み込み loadMore
  ====================================================== */
  const loadMore = useCallback(async () => {
    if (loading || noMore) return;

    setLoading(true);
    try {
      const baseQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            startAfter(lastDocRef.current),
            limit(PAGE_SIZE)
          )
        : baseQuery;

      const snap = await getDocs(q);

      if (snap.empty) {
        setNoMore(true);
        setLoading(false);
        return;
      }

      const newPosts = snap.docs.map((doc) => mapRawToPredictionPost(doc));

      mergePosts(newPosts); // ← 配列 push ではなく Map 統合！

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("ALL feed load failed:", err);
    }

    setLoading(false);
  }, [loading, noMore, mergePosts]);

  /* ======================================================
     Pull-to-refresh refresh
  ====================================================== */
  const refresh = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const newPosts = snap.docs.map((doc) => mapRawToPredictionPost(doc));

      // 👇 refresh は完全リセット
      postsMapRef.current.clear();
      mergePosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("ALL feed refresh failed:", err);
    }

    setLoading(false);
  }, [loading, mergePosts]);

  return {
    posts,
    loading,
    noMore,
    loadMore,
    refresh,
  };
}
