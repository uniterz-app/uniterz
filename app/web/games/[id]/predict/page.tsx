// app/web/games/[id]/predict/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { toMatchCardProps } from "@/lib/games/transform";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const PredictionForm = dynamic(
  () => import("@/app/component/predict/PredictionFormV2"),
  { ssr: false }
);

export default function Page() {
  // 1) Hooks は最初に宣言
  const { id } = useParams<{ id: string }>();
  const { fUser, status } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isEn = language === "en";

  // Firestore から読むプロフィール（displayName / photoURL）
  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);

  // 🔽 追加: Firestore の games/{id} を取得した結果（toMatchCardProps 済み）を保持
  const [gameState, setGameState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "loaded"; game: ReturnType<typeof toMatchCardProps> }
    | { kind: "error"; message?: string }
  >({ kind: "idle" });

  // users/{uid} を1回だけ読む
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
      } catch {
        setProfile(null);
      }
    })();
  }, [fUser?.uid]);

  // 🔽 追加: games/{id} を1件取得 → toMatchCardProps に通す
  useEffect(() => {
    if (!id) {
      setGameState({ kind: "idle" });
      return;
    }
    let aborted = false;
    setGameState({ kind: "loading" });

    (async () => {
      try {
        const snap = await getDoc(doc(db, "games", id));
        if (aborted) return;

        if (!snap.exists()) {
          // 無かったときは簡易フォールバック（HOME/AWAY のダミー）
          const fallback = toMatchCardProps({
            id,
            league: "bj",
            venue: "",
            roundLabel: "",
            startAtJst: null,
            status: "scheduled",
            home: { name: "HOME" },
            away: { name: "AWAY" },
          } as any);
          setGameState({ kind: "loaded", game: fallback });
          return;
        }

        const raw = { id, ...snap.data() }; // id を混ぜる
        const game = toMatchCardProps(raw as any, { dense: false });
        setGameState({ kind: "loaded", game });
      } catch (e: any) {
        setGameState({ kind: "error", message: e?.message ?? "failed" });
      }
    })();

    return () => {
      aborted = true;
    };
  }, [id]);

  // ② 早期 return（既存の流れを保持）
  if (status !== "ready") return null;
  if (!fUser || !id) return null;

  // ローディング／エラー簡易表示（必要ならお好みでUI調整）
  if (gameState.kind === "loading" || gameState.kind === "idle") {
    return <div style={{ padding: 16 }}>{isEn ? "Loading..." : "読み込み中…"}</div>;
  }
  if (gameState.kind === "error") {
    return (
      <div style={{ padding: 16 }}>
        {isEn ? "Failed to load game data." : "試合データの取得に失敗しました。"}
      </div>
    );
  }

  // Firestore の users/{uid} を1回だけ読んでプロフィールを優先利用
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

  return <PredictionForm game={gameState.game} user={user} />;
}
