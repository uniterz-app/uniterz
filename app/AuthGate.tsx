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

  // ★ Web or Mobile 判定（PC → Web とする）
  const isDesktop =
    typeof window !== "undefined" && window.innerWidth >= 768;

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
      if (isAuthPage) return; // login/signup は表示OK
      router.replace("/mobile/login");
      return;
    }

    // ログイン済み → handle 取得待ち
    if (!handle) return;

    // ★ ここだけ変更（ログイン後の遷移先条件にPC判定追加）
    if (isAuthPage) {
      if (isDesktop) {
        router.replace(`/web/u/${handle}`);  // PC → Webへ
      } else {
        router.replace(`/mobile/u/${handle}`); // Mobile → Mobileへ
      }
      return;
    }
  }, [status, handle, isAuthPage, router, isDesktop]);

  /* -----------------------------
   * ③ 表示制御（白飛びゼロ化）
   * ----------------------------- */

  if (status === "loading") return <SplashWrapper forceSplash />;
  if (status === "guest" && isAuthPage)
    return <SplashWrapper>{children}</SplashWrapper>;
  if (status === "guest" && !isAuthPage)
    return <SplashWrapper forceSplash />;
  if (status === "ready" && !handle)
    return <SplashWrapper forceSplash />;

  return <SplashWrapper>{children}</SplashWrapper>;
}
