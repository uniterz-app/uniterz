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

export function useBLeagueFeed() {
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ======================
  // 初回ロード（followingと同じ）
  // ======================
  useEffect(() => {
    refresh();
  }, []);

  // ======================
  // loadMore（followingと同じ構造）
  // ======================
  const loadMore = useCallback(async () => {
    if (loading || noMore) return;

    setLoading(true);

    try {
      const baseQuery = query(
        collection(db, "posts"),
        where("league", "==", "bj"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            where("league", "==", "bj"),
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

      // ⭐ Following と同じ重複排除処理
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("B feed loadMore error:", err);
    }

    setLoading(false);
  }, [loading, noMore]);

  // ======================
  // refresh（followingと同じ構造）
  // ======================
  const refresh = useCallback(async () => {
    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const q = query(
        collection(db, "posts"),
        where("league", "==", "bj"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));

      setPosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("B feed refresh error:", err);
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
