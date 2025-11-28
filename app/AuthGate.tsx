"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SplashWrapper from "./SplashWrapper";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, fUser } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const [handle, setHandle] = useState<string | null>(null);

  const isAuthPage =
    pathname === "/mobile/login" || pathname === "/mobile/signup";

  /* -----------------------------
   * ① Firestore: handle取得
   * ----------------------------- */
  useEffect(() => {
    if (!fUser) return;

    const loadHandle = async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      const h = snap.data()?.handle || snap.data()?.slug;
      setHandle(h || null);
    };

    loadHandle();
  }, [fUser]);

  /* -----------------------------
   * ② リダイレクト処理
   * ----------------------------- */
  useEffect(() => {
    if (status === "loading") return;

    // 未ログイン
    if (status === "guest") {
      if (isAuthPage) return; // login/signup は表示させてOK
      router.replace("/mobile/login");
      return;
    }

    // ログイン済み
    if (!handle) return; // Firestore取得待ち → Splash固定

    // login/signup に居る → プロフィールへ
    if (isAuthPage) {
      router.replace(`/mobile/u/${handle}`);
    }
  }, [status, handle, isAuthPage, router]);

  /* -----------------------------
   * ③ 表示制御（白飛びゼロ化）
   * ----------------------------- */

  // Firebase 読み込み中 → 常に Splash（force）
  if (status === "loading") return <SplashWrapper forceSplash />;

  // 未ログイン & login/signup → children は出す（login/signupページ用）
  if (status === "guest" && isAuthPage)
    return <SplashWrapper>{children}</SplashWrapper>;

  // 未ログイン & 他ページ → Splash固定
  if (status === "guest" && !isAuthPage)
    return <SplashWrapper forceSplash />;

  // ログイン済み & handle 未取得 → Splash固定（白飛び防止）
  if (status === "ready" && !handle)
    return <SplashWrapper forceSplash />;

  // ここで初めて children（プロフィールやホーム）描画
  return <SplashWrapper>{children}</SplashWrapper>;
}
