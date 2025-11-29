"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, fUser } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const [handle, setHandle] = useState<string | null>(null);

  const isAuthPage =
    pathname === "/mobile/login" || pathname === "/mobile/signup";

  const isDesktop =
    typeof window !== "undefined" && window.innerWidth >= 768;

  /* ---- handle 読み込み ---- */
  useEffect(() => {
    if (!fUser) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      const h = snap.data()?.handle || snap.data()?.slug || null;
      setHandle(h);
    };

    load();
  }, [fUser]);

  /* ---- 遷移制御（最低限） ---- */
  useEffect(() => {
    if (status === "loading") return;

    // 未ログイン → /login へ
    if (status === "guest") {
      if (!isAuthPage) router.replace("/mobile/login");
      return;
    }

    // ログイン済み → handle 未取得なら待つ
    if (status === "ready" && !handle) return;

    // ログイン中に /login or /signup に来た時 → プロフィールへ
    if (isAuthPage && handle) {
      if (isDesktop) {
        router.replace(`/web/u/${handle}`);
      } else {
        router.replace(`/mobile/u/${handle}`);
      }
    }
  }, [status, handle, isAuthPage, isDesktop, router]);

  return <>{children}</>;
}
