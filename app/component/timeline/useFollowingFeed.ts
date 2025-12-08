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

import { toUiPost } from "@/lib/toUiPost"; // ★ V2 正式変換
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const PAGE_SIZE = 15;

export function useFollowingFeed() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  /* -----------------------------
   * 認証監視
   * ----------------------------- */
  useEffect(() => {
    if (uid) return;
    
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });

    return () => unsub();
  }, [uid]);

  /* -----------------------------
   * 初回ロード
   * ----------------------------- */
  useEffect(() => {
    if (!uid) return;
    refresh();
  }, [uid]);

  /* -----------------------------
   * loadMore
   * ----------------------------- */
  const loadMore = useCallback(async () => {
    if (!uid || loading || noMore) return;

    setLoading(true);

    try {
      // --- フォローしているユーザー ---
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

      const newPosts = snap.docs.map((d) =>
        toUiPost(d.id, d.data()) // ★ V2 変換関数を使用
      );

      // 重複排除
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p.id))];
      });

      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("following feed loadMore error:", err);
    }

    setLoading(false);
  }, [uid, loading, noMore]);

  /* -----------------------------
   * refresh
   * ----------------------------- */
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

      const newPosts = snap.docs.map((d) =>
        toUiPost(d.id, d.data())
      );

      setPosts(newPosts);
      lastDocRef.current = snap.docs[snap.docs.length - 1];
    } catch (err) {
      console.warn("following feed refresh error:", err);
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
