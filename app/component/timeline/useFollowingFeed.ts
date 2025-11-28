"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  DocumentSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { mapRawToPredictionPost } from "@/lib/map-post";
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";

const PAGE_SIZE = 15;

export function useFollowingFeed() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [posts, setPosts] = useState<PredictionPost[]>([]);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ======================
  // 認証監視
  // ======================
  useEffect(() => {
    if (uid) return;
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, [uid]);

  // ======================
  // 初回ロード
  // ======================
  useEffect(() => {
    if (!uid) return;
    refresh();
  }, [uid]);

  // ======================
  // loadMore
  // ======================
  const loadMore = useCallback(async () => {
    if (!uid || loading || noMore) return;

    setLoading(true);

    try {
      const followingSnap = await getDocs(
        query(collection(db, "users", uid, "following"), limit(50))
      );

      // ⚠ フィルタリングが重要
      const followingUids = followingSnap.docs
        .map((d) => d.id)
        .filter((id) => typeof id === "string" && id.length > 0);

      if (followingUids.length === 0) {
        setPosts([]);
        setNoMore(true);
        setLoading(false);
        return;
      }

      const baseQuery = query(
        collection(db, "posts"),
        where("authorUid", "in", followingUids),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = lastDocRef.current
        ? query(
            collection(db, "posts"),
            where("authorUid", "in", followingUids),
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

      // 重複回避
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (e) {
      console.warn("following feed loadMore failed:", e);
    }

    setLoading(false);
  }, [uid, loading, noMore]);

  // ======================
  // refresh（pull-to-refresh）
  // ======================
  const refresh = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setNoMore(false);
    lastDocRef.current = null;

    try {
      const followingSnap = await getDocs(
        query(collection(db, "users", uid, "following"), limit(50))
      );

      const followingUids = followingSnap.docs
        .map((d) => d.id)
        .filter((id) => typeof id === "string" && id.length > 0);

      if (followingUids.length === 0) {
        setPosts([]);
        setNoMore(true);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "posts"),
        where("authorUid", "in", followingUids),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const newPosts = snap.docs.map((d) => mapRawToPredictionPost(d));
      setPosts(newPosts);

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (e) {
      console.warn("refresh failed:", e);
    }

    setLoading(false);
  }, [uid]);

  return {
    posts,
    loading,
    noMore,
    loadMore,
    refresh,
  };
}
