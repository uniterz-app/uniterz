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

import { toUiPost } from "@/lib/toUiPost"; // ← V2正式変換
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const PAGE_SIZE = 15;

export function useAllPostsFeed() {
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  /* -----------------------------
   * 初回ロード
   * ----------------------------- */
  useEffect(() => {
    refresh();
  }, []);

  /* -----------------------------
   * loadMore
   * ----------------------------- */
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

      const newPosts = snap.docs.map((doc) =>
        toUiPost(doc.id, doc.data()) // ← V2統一変換
      );

      // 重複排除して追加
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
        return merged;
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("ALL feed loadMore error:", err);
    }

    setLoading(false);
  }, [loading, noMore]);

  /* -----------------------------
   * refresh（完全リセット）
   * ----------------------------- */
  const refresh = useCallback(async () => {
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

      const newPosts = snap.docs.map((doc) =>
        toUiPost(doc.id, doc.data())
      );

      setPosts(newPosts);
      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("ALL feed refresh error:", err);
    }

    setLoading(false);
  }, []);

  return {
    posts,
    loading,
    noMore,
    loadMore,
    refresh,
  };
}
