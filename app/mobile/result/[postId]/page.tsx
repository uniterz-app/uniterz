"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";
import ResultDetailBody from "@/app/component/result/ResultDetailBody";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  loadResultPostDetailClient,
  buildResultDetailViewFromLoad,
  type LoadResultPostDetailClientResult,
} from "@/lib/result/loadResultPostDetailClient";

type DetailState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "ready";
      loaded: Extract<LoadResultPostDetailClientResult, { ok: true }>;
    };

export default function MobileResultPostPage() {
  const params = useParams();
  const router = useRouter();
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
          loaded: r,
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

  const view =
    state.status === "ready"
      ? buildResultDetailViewFromLoad(state.loaded, { uid })
      : null;

  return (
    <div className="relative px-4 py-4">
      {view ? (
        <ResultDetailBody language={language} view={view} gamesRoutePrefix="/mobile" />
      ) : null}
      <ProfileMenuEdgeHandle
        onOpen={() => router.back()}
        label="BACK"
        tone="back"
        ariaLabel={language === "en" ? "Back" : "戻る"}
        overlay
      />
    </div>
  );
}
