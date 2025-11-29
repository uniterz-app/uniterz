"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PredictionPostCard, { type PredictionPost } from "@/app/component/post/PredictionPostCard";
import { toUiPost } from "@/lib/toUiPost";   // ★ 追加

export default function PostDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PredictionPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // ★★★ 唯一の修正ポイント ★★★
        const mapped = toUiPost(snap.id, d);

        setPost(mapped);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [id]);

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (!post)   return <div className="p-6 text-white/70">存在しない投稿です。</div>;

  return (
    <div className="mx-auto max-w-2xl p-3 sm:p-4 md:p-6">
      <PredictionPostCard post={post} mode="detail" />
    </div>
  );
}

