// app/m/(with-nav)/games/[id]/predict/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { toMatchCardProps } from "@/lib/games/transform";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const PredictionForm = dynamic(
  () => import("@/app/component/predict/PredictionFormV2"),
  { ssr: false }
);

// 生の games ドキュメント型（transform の入力に合わせる）
type GameDoc = Parameters<typeof toMatchCardProps>[0];

export default function Page() {
  // ---- Hooks（順序固定）----
  const { id } = useParams<{ id: string }>();
  const { fUser, status } = useFirebaseUser();

  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);
  const [rawGame, setRawGame] = useState<GameDoc | null>(null);
  const [loading, setLoading] = useState(true);

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
        const snap = await getDoc(doc(db, "users", fUser.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
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
  if (status !== "ready") return null; // 認証準備待ち
  if (!fUser || !id) return null;      // 未ログイン/IDなし
  if (loading) return null;            // ローディング中
  if (!rawGame) return null;           // 404相当

  // ---- ④ 表示用に整形（Hookは使わない：ただの変数）----
  const gameProps = toMatchCardProps(rawGame, { dense: true });

  // ---- ⑤ フォームに渡すユーザー表示 ----
  const user = {
    name:
      (profile?.displayName && profile.displayName.trim()) ||
      fUser.displayName ||
      "ユーザー",
    avatarUrl:
      (profile?.photoURL && profile.photoURL.trim()) ||
      fUser.photoURL ||
      undefined,
    verified: !!fUser.emailVerified,
  };

  // ---- ⑥ 描画 ----
  return <PredictionForm dense game={gameProps} user={user} />;
}
