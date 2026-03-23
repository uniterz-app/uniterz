// app/mobile/result/[postId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ResultDetail from "@/app/component/result/ResultDetail";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

export default function MobileResultDetailPage() {
  const params = useParams();
  const postId = params?.postId as string;

  const [post, setPost] = useState<PredictionPostV2 | null>(null);
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    (async () => {
      try {
        // ① post取得
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (!postSnap.exists()) {
          setLoading(false);
          return;
        }

        const postData = {
          id: postSnap.id,
          ...postSnap.data(),
        } as PredictionPostV2;

        setPost(postData);

        // ② game取得（market用）
        const gameSnap = await getDoc(doc(db, "games", postData.gameId));
        if (gameSnap.exists()) {
          const gameData: any = gameSnap.data();
          setMarket({
            homeRate: gameData?.market?.homeRate ?? 0,
            awayRate: gameData?.market?.awayRate ?? 0,
            drawRate: gameData?.market?.drawRate ?? 0,
            total: gameData?.market?.total ?? 0,
          });
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Post not found
      </div>
    );
  }

  // ★ モバイル用に余白だけ変えるならここでラップ
  return (
    <div className="px-4 py-4">
      <ResultDetail post={post} market={market} />
    </div>
  );
}