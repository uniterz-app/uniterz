// app/m/(with-nav)/games/[id]/predict/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { toMatchCardProps } from "@/lib/games/transform";
import { fetchPlayoffSeriesPeerGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

/** データ待ち・JS チャンク待ちでもレイアウトが飛ばないよう、一覧と同系の背景で埋める */
function PredictRouteShell() {
  return (
    <div
      className="min-h-svh w-full bg-app"
      aria-busy="true"
      aria-label="読み込み中"
    />
  );
}

const PredictionForm = dynamic(
  () => import("@/app/component/predict/PredictionFormV2"),
  { ssr: false, loading: PredictRouteShell }
);

type GameProps = ReturnType<typeof toMatchCardProps>;

export default function Page() {
  // ---- Hooks（順序固定）----
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const predictEditTriggerNonce =
    searchParams.get("edit") === "1" ? 1 : 0;
  const { fUser, status } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const m = t(language);

  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);
  const [gameProps, setGameProps] = useState<GameProps | null>(null);
  const [loading, setLoading] = useState(true);

  /** 一覧からのスクロール位置が残ると 1 フレームだけズレて見えるため、描画直前に先頭へ */
  useLayoutEffect(() => {
    if (loading || !gameProps) return;
    window.scrollTo(0, 0);
  }, [loading, gameProps, id]);

  // ---- ① games/{id} と同一シリーズの兄弟試合を取得してから MatchCard 用 props を確定 ----
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setGameProps(null);
      try {
        const snap = await getDoc(doc(db, "games", String(id)));
        if (!alive) return;
        if (!snap.exists()) {
          setGameProps(null);
          return;
        }
        const raw = { id: snap.id, ...snap.data() } as any;
        const peers = await fetchPlayoffSeriesPeerGames(
          raw as Record<string, unknown>
        );
        if (!alive) return;
        setGameProps(
          toMatchCardProps(raw, {
            dense: true,
            peerGamesForSeriesInference: peers,
          })
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ---- ② users/{uid} を1回取得（プロフィール表示用）----
  useEffect(() => {
    if (!fUser?.uid) return;
    (async () => {
      try {
        const d = (await getUserDocDataCached(fUser.uid)) as any;
        if (d) {
          setProfile({
            displayName: d.displayName ?? undefined,
            photoURL: d.photoURL ?? undefined,
          });
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.warn("[m/predict] profile fetch failed:", e);
        setProfile(null);
      }
    })();
  }, [fUser?.uid]);

  // ---- ③ ガード（早期 return は Hook の後）----
  if (status !== "ready") return <PredictRouteShell />; // 認証準備待ち
  if (!fUser || !id) return null; // 未ログイン/IDなし
  if (loading) return <PredictRouteShell />; // Firestore 取得中
  if (!gameProps) return null; // 404相当（存在しない試合）

  // ---- ④ フォームに渡すユーザー表示 ----
  const user = {
    name:
      (profile?.displayName && profile.displayName.trim()) ||
      fUser.displayName ||
      m.results.user,
    avatarUrl:
      (profile?.photoURL && profile.photoURL.trim()) ||
      fUser.photoURL ||
      undefined,
    verified: !!fUser.emailVerified,
  };

  return (
    <Suspense fallback={<PredictRouteShell />}>
      <PredictionForm
        dense
        game={gameProps}
        user={user}
        predictEditTriggerNonce={predictEditTriggerNonce}
      />
    </Suspense>
  );
}
