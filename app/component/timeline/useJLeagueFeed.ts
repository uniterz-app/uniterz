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
import { mapRawToPredictionPost } from "@/lib/map-post";
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";

const PAGE_SIZE = 15;

export function useJLeagueFeed() {
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ======================
  // loadMore
  // ======================
  const loadMore = useCallback(async () => {
    if (loading || noMore) return;

    setLoading(true);

    try {
      const baseQuery = query(
        collection(db, "posts"),
        where("league", "==", "j"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            where("league", "==", "j"),
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

      const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));

      // ⭐ フォロー中と同じ重複回避形式
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

  // ======================
  // refresh（Pull to refresh）
  // ======================
  const refresh = useCallback(async () => {
    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const q = query(
        collection(db, "posts"),
        where("league", "==", "j"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));

      // ⭐ フォロー中と同じ
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
