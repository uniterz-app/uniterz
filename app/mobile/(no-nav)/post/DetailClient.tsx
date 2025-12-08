"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import PredictionPostCard from "@/app/component/post/PredictionPostCardV2";

// ❗ 型はここから import（Card コンポーネントから export されていない）
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

import { toUiPost } from "@/lib/toUiPost";  // ← V2 版に揃えるべき

export default function PostDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PredictionPostV2 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "posts", id);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data();
        if (!d) {
          setPost(null);
          setLoading(false);
          return;
        }

        // ★ Firestore → UI へ正規化
        setPost(toUiPost(snap.id, d));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [id]);

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (!post) return <div className="p-6 text-white/70">存在しない投稿です。</div>;

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6">
      <PredictionPostCard post={post} mode="detail" />
    </div>
  );
}
