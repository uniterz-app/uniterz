"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import MobileResultDetail from "@/app/component/result/mobile/MobileResultDetail";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  parseGamePointsDistributionV1,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";

export default function MobileResultPostPage() {
  const params = useParams();
  const postId = params?.postId as string;

  const [uid, setUid] = useState<string | null>(null);
  const [post, setPost] = useState<PredictionPostV2 | null>(null);
  const [market, setMarket] = useState<{
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  } | null>(null);
  const [pointsDistribution, setPointsDistribution] =
    useState<GamePointsDistributionV1 | null>(null);
  const [loading, setLoading] = useState(true);

  const { language } = useUserLanguage(uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!postId) return;

    let alive = true;

    (async () => {
      try {
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (!alive) return;
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
        if (!alive) return;
        if (gameSnap.exists()) {
          const gameData: any = gameSnap.data();
          setMarket({
            homeRate: gameData?.market?.homeRate ?? 0,
            awayRate: gameData?.market?.awayRate ?? 0,
            drawRate: gameData?.market?.drawRate ?? 0,
            total: gameData?.market?.total ?? 0,
          });
          setPointsDistribution(
            parseGamePointsDistributionV1(gameData?.pointsDistribution)
          );
        } else {
          setPointsDistribution(null);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
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

  return (
    <div className="px-4 py-4">
      <MobileResultDetail
        post={post}
        market={market ?? undefined}
        pointsDistribution={pointsDistribution}
        language={language}
      />
    </div>
  );
}
