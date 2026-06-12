"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ResultDetail from "@/app/component/result/ResultDetail";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  loadResultPostDetailClient,
  type ResultPostDetailMarket,
} from "@/lib/result/loadResultPostDetailClient";
import type { GamePointsDistributionV1 } from "@/lib/results/gamePointsDistribution";

type DetailState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "ready";
      post: PredictionPostV2;
      market: ResultPostDetailMarket | null;
      pointsDistribution: GamePointsDistributionV1 | null;
    };

export default function WebResultPostPage() {
  const params = useParams();
  const postId = params?.postId as string;

  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const { language } = useUserLanguage(uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!postId) return;

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const r = await loadResultPostDetailClient(postId);
        if (!alive) return;
        if (!r.ok) {
          setState({ status: "missing" });
          return;
        }
        setState({
          status: "ready",
          post: r.post,
          market: r.market,
          pointsDistribution: r.pointsDistribution,
        });
      } catch (e) {
        console.error(e);
        if (alive) setState({ status: "missing" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [postId]);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center text-white">
        <CandleChartLoader />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Post not found
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <ResultDetail
        post={state.post}
        market={state.market ?? undefined}
        pointsDistribution={state.pointsDistribution}
        language={language}
        viewerUid={uid}
        gamesRoutePrefix="/web"
      />
    </div>
  );
}
