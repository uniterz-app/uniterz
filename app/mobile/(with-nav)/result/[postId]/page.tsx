// app/mobile/result/[postId]/page.tsx など（例）
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MobileResultDetail from "@/app/component/result/mobile/MobileResultDetail";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

export default function MobileResultDetailPage() {
  const params = useParams();
  const postId = params?.postId as string;

  const [post, setPost] = useState<PredictionPostV2 | null>(null);
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    async function fetchData() {
      try {
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

        const gameSnap = await getDoc(doc(db, "games", postData.gameId));
        if (gameSnap.exists()) {
          const gameData = gameSnap.data() as any;
          setMarket({
            homeRate: gameData?.market?.homeRate ?? 0,
            awayRate: gameData?.market?.awayRate ?? 0,
            drawRate: gameData?.market?.drawRate ?? 0,
            total: gameData?.market?.total ?? 0,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    fetchData();
  }, [postId]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-white">Loading...</div>;
  }

  if (!post) {
    return <div className="min-h-screen grid place-items-center text-white">Post not found</div>;
  }

  return <MobileResultDetail post={post} market={market} />;
}