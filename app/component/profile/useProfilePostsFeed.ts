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
import type { PredictionPost } from "@/app/component/post/PredictionPostCard";

const PAGE_SIZE = 10;

export function useProfilePostsFeed(targetUid: string | null) {
  const [posts, setPosts] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ★ 初回 refresh の二重実行を防ぐフラグ
  const hasRefreshedRef = useRef(false);

  /* ===============================
     最新10件を取得（初回のみ確実に1回だけ）
  =============================== */
  const refresh = useCallback(async () => {
    if (!targetUid) return;

    // ★ 既に refresh 済みなら実行しない（初回スクロール戻り対策）
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
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as PredictionPost[];

      setPosts(rows);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
    } finally {
      setLoading(false);
    }
  }, [targetUid]);

  /* ===============================
     loadMore（さらに10件）
  =============================== */
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
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as PredictionPost[];

        setPosts((prev) => [...prev, ...rows]);
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
    } finally {
      setLoading(false);
    }
  }, [targetUid, loading, noMore]);

  return {
    posts,
    loading,
    noMore,
    refresh,
    loadMore,
  };
}
