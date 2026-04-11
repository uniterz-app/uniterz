// app/m/(with-nav)/games/[id]/predict/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { toMatchCardProps } from "@/lib/games/transform";
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

// 生の games ドキュメント型（transform の入力に合わせる）
type GameDoc = Parameters<typeof toMatchCardProps>[0];

export default function Page() {
  // ---- Hooks（順序固定）----
  const { id } = useParams<{ id: string }>();
  const { fUser, status } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isEn = language === "en";

  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);
  const [rawGame, setRawGame] = useState<GameDoc | null>(null);
  const [loading, setLoading] = useState(true);

  /** 一覧からのスクロール位置が残ると 1 フレームだけズレて見えるため、描画直前に先頭へ */
  useLayoutEffect(() => {
    if (loading || !rawGame) return;
    window.scrollTo(0, 0);
  }, [loading, rawGame, id]);

  // ---- ① games/{id} を1回取得（Firestore）----
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "games", String(id)));
        if (!alive) return;
        setRawGame(snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null);
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
  if (!rawGame) return null; // 404相当（存在しない試合）

  // ---- ④ 表示用に整形（Hookは使わない：ただの変数）----
  const gameProps = toMatchCardProps(rawGame, { dense: true });

  // ---- ⑤ フォームに渡すユーザー表示 ----
  const user = {
    name:
      (profile?.displayName && profile.displayName.trim()) ||
      fUser.displayName ||
      (isEn ? "User" : "ユーザー"),
    avatarUrl:
      (profile?.photoURL && profile.photoURL.trim()) ||
      fUser.photoURL ||
      undefined,
    verified: !!fUser.emailVerified,
  };

  return (
    <Suspense fallback={<PredictRouteShell />}>
      <PredictionForm dense game={gameProps} user={user} />
    </Suspense>
  );
}
