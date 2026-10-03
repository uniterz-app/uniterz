"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";
import ResultDetailBody from "@/app/component/result/ResultDetailBody";
import ShareLandingView from "@/app/component/share/ShareLandingView";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  loadResultPostDetailClient,
  buildResultDetailViewFromLoad,
  type LoadResultPostDetailClientResult,
} from "@/lib/result/loadResultPostDetailClient";
import type { ResultShareMeta } from "@/lib/share/shareMetaTypes";
import { useShareLandingMode } from "@/lib/share/useShareLandingMode";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

type DetailState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "ready";
      loaded: Extract<LoadResultPostDetailClientResult, { ok: true }>;
    };

export default function ResultPostPageClient({
  postId,
  shareMeta,
}: {
  postId: string;
  shareMeta: ResultShareMeta | null;
}) {
  const router = useRouter();
  const landing = useShareLandingMode();
  const { status: authStatus } = useFirebaseUser();

  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const { language } = useUserLanguage(uid);
  const sharePath = `/mobile/result/${encodeURIComponent(postId)}`;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!postId || landing) return;

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
        // 試合開始前の他人の投稿はルールで読めない → 閲覧不可画面へ
        console.error(e);
        if (alive) setState({ status: "missing" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [postId, landing]);

  if (landing) {
    return (
      <ShareLandingView
        target={{ kind: "result", meta: shareMeta }}
        path={sharePath}
        signedIn={authStatus === "ready"}
        language={authStatus === "ready" ? language : null}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center text-white">
        <CandleChartLoader />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <ShareLandingView
        target={{ kind: "result", meta: shareMeta }}
        path={sharePath}
        signedIn
        language={language}
      />
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
