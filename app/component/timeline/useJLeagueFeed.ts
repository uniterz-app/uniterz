"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { toUiPost } from "@/lib/toUiPost";  // ★ V2 正式変換
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const PAGE_SIZE = 15;

export function useJLeagueFeed() {
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  /* ---------------------------
   * loadMore
   * --------------------------- */
  const loadMore = useCallback(async () => {
    if (loading || noMore) return;

    setLoading(true);

    try {
      const baseQuery = query(
        collection(db, "posts"),
        where("league", "==", "j1"),   // ★ V2 の正しいリーグキー
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            where("league", "==", "j1"),
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

      // ★ V2 正規化
      const newPosts = snap.docs.map((d) => toUiPost(d.id, d.data()));

      // ★ 重複除去
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("JLeague feed loadMore error:", err);
    }

    setLoading(false);
  }, [loading, noMore]);

  /* ---------------------------
   * refresh
   * --------------------------- */
  const refresh = useCallback(async () => {
    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const q = query(
        collection(db, "posts"),
        where("league", "==", "j1"),  // ★ 修正済み
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      // ★ V2 正規化
      const newPosts = snap.docs.map((d) => toUiPost(d.id, d.data()));

      setPosts(newPosts);
      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("JLeague feed refresh error:", err);
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
