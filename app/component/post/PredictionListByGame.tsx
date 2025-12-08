"use client";

import React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase";

import PredictionPostCardV2 from "@/app/component/post/PredictionPostCardV2";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { toUiPost } from "@/lib/toUiPost"; // ← ★ V2 変換ロジック


/** createdAt のミリ秒 */
function getCreatedAtMillis(doc: QueryDocumentSnapshot<DocumentData>): number {
  const v: any = doc.get("createdAt");
  if (v?.toMillis) return v.toMillis();
  if (typeof v === "number") return v;
  return 0;
}


export default function PredictionListByGame({
  gameId,
  pageSize = 20,
}: {
  gameId: string;
  pageSize?: number;
}) {
  const [posts, setPosts] = React.useState<PredictionPostV2[] | null>(null);

  React.useEffect(() => {
    if (!gameId) return;

    const me = auth.currentUser;
    if (!me) {
      setPosts([]);
      return;
    }

    // V2 投稿
    const qNew = query(
      collection(db, "posts"),
      where("game.gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // V1 投稿（旧）— もう不要なら後で削除可能
    const qOld = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    let docsNew: QueryDocumentSnapshot<DocumentData>[] = [];
    let docsOld: QueryDocumentSnapshot<DocumentData>[] = [];

    const emit = () => {
      const map = new Map<string, QueryDocumentSnapshot<DocumentData>>();

      for (const d of docsNew) map.set(d.id, d);
      for (const d of docsOld) map.set(d.id, d);

      const merged = Array.from(map.values()).sort(
        (a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a)
      );

      setPosts(
        merged.map((d) => toUiPost(d.id, d.data()))
      );
    };

    const offNew = onSnapshot(
      qNew,
      (snap) => {
        docsNew = snap.docs;
        emit();
      },
      (err) => {
        console.warn("[PredictionListByGame] new path error:", err);
        docsNew = [];
        emit();
      }
    );

    const offOld = onSnapshot(
      qOld,
      (snap) => {
        docsOld = snap.docs;
        emit();
      },
      (err) => {
        console.warn("[PredictionListByGame] old path error:", err);
        docsOld = [];
        emit();
      }
    );

    return () => {
      offNew();
      offOld();
    };
  }, [gameId, pageSize]);



  /** ------------- UI ------------- */
  if (posts == null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        読み込み中…
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        まだこの試合の分析はありません。
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {posts.map((p) => (
        <PredictionPostCardV2
          key={p.id}
          post={p}
          mode="list"
        />
      ))}
    </div>
  );
}
