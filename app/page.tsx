"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import SplashWrapper from "@/app/SplashWrapper";

export default function Page() {
  const router = useRouter();
  const { status, handle } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash) return;

    const isMobile = window.innerWidth < 768;

    // ログイン済み
    if (status === "ready" && handle) {
      router.replace(
        isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`
      );
      return;
    }

    // 未ログイン
    if (isMobile) {
      router.replace("/mobile/games");
    } else {
      router.replace("/lp");
    }
  }, [showSplash, status, handle, router]);

  return <SplashWrapper />;
}
