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
    // スプラッシュを必ず一度見せる（例：1.2秒）
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash) return;

    const isMobile = window.innerWidth < 768;

    // ログイン済み → 自分のプロフィール
    if (status === "ready" && handle) {
      router.replace(
        isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`
      );
      return;
    }

    // 未ログイン → 試合一覧
    router.replace(
      isMobile ? "/mobile/games" : "/web/games"
    );
  }, [showSplash, status, handle, router]);

  // スプラッシュ表示中
  if (showSplash) {
    return <SplashWrapper />;
  }

  // 遷移直前の空描画
  return null;
}
