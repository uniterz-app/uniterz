// app/component/timeline/usePLFeed.ts
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

import { toUiPost } from "@/lib/toUiPost";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const PAGE_SIZE = 15;

export function usePLFeed() {
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
        where("league", "==", "pl"), // ★ Premier League
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            where("league", "==", "pl"),
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

      const newPosts = snap.docs.map((d) =>
        toUiPost(d.id, d.data())
      );

      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("PL feed loadMore error:", err);
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
        where("league", "==", "pl"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const newPosts = snap.docs.map((d) =>
        toUiPost(d.id, d.data())
      );

      setPosts(newPosts);
      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("PL feed refresh error:", err);
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
