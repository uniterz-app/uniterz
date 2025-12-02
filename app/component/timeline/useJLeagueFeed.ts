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
  const postsMapRef = useRef<Map<string, PredictionPost>>(new Map());

  const mergePosts = useCallback((newPosts: PredictionPost[]) => {
    const map = postsMapRef.current;
    newPosts.forEach((p) => map.set(p.id, p));
    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0)
    );
    setPosts(sorted);
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

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

      const newPosts = snap.docs.map((doc) => mapRawToPredictionPost(doc));
      mergePosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("J feed load failed:", err);
    }

    setLoading(false);
  }, [loading, noMore, mergePosts]);

  const refresh = useCallback(async () => {
    if (loading) return;

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
      const newPosts = snap.docs.map((doc) => mapRawToPredictionPost(doc));

      postsMapRef.current.clear();
      mergePosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("J feed refresh failed:", err);
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
