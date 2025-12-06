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
import { mapRawToPredictionPostV2 } from "@/lib/map-post-v2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

const PAGE_SIZE = 10;

export function useProfilePostsFeedV2(targetUid: string | null) {
  const [posts, setPosts] = useState<PredictionPostV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // 初回 refresh 二重実行防止
  const hasRefreshedRef = useRef(false);

  // 重複排除（ID ベース）
  const postsMapRef = useRef<Map<string, PredictionPostV2>>(new Map());

  /* -----------------------------------------------------
     Map に統合し posts を更新
  ----------------------------------------------------- */
  const mergePosts = useCallback((newPosts: PredictionPostV2[]) => {
    const map = postsMapRef.current;

    newPosts.forEach((p) => {
      map.set(p.id, p); // 同一 ID は上書き
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.createdAtMillis ?? 0) - (a.createdAtMillis ?? 0)
    );

    setPosts(sorted);
  }, []);

  /* -----------------------------------------------------
     refresh（初回のみ）
  ----------------------------------------------------- */
  const refresh = useCallback(async () => {
    if (!targetUid) return;

    if (hasRefreshedRef.current) return;

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

      const newPosts = snap.docs.map((d) => mapRawToPredictionPostV2(d));

      // 初回は Map をクリア
      postsMapRef.current.clear();

      mergePosts(newPosts);

      lastDocRef.current =
        snap.docs[snap.docs.length - 1] || null;
    } finally {
      hasRefreshedRef.current = true;
      setLoading(false);
    }
  }, [targetUid, mergePosts]);

  /* -----------------------------------------------------
     loadMore
  ----------------------------------------------------- */
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
        const newPosts = snap.docs.map((d) =>
          mapRawToPredictionPostV2(d)
        );

        mergePosts(newPosts);

        lastDocRef.current =
          snap.docs[snap.docs.length - 1];
      }
    } finally {
      setLoading(false);
    }
  }, [targetUid, loading, noMore, mergePosts]);

  return {
    posts,
    loading,
    noMore,
    refresh,
    loadMore,
  };
}
