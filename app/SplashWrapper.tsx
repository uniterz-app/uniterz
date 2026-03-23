"use client";

import { useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function SplashWrapper({
  children,
  forceSplash = false,
}: {
  children?: React.ReactNode;
  forceSplash?: boolean;
}) {
  const { status } = useFirebaseUser();
  const [fadeDone, setFadeDone] = useState(false);

  const shouldShowSplash = forceSplash || status === "loading";

  // ★ 初回ロード時：body 背景をスプラッシュ画像にする
  useEffect(() => {
    if (!fadeDone) {
      document.body.classList.remove("bg-black");
      document.body.classList.add("splash-bg");
    }

    if (!shouldShowSplash && !fadeDone) {
      // ローディングが終わった瞬間に黒背景へ切り替え
      const timer = setTimeout(() => {
        document.body.classList.remove("splash-bg");
        document.body.classList.add("bg-black");
        setFadeDone(true);
      }, 50); // ← これで黒とびしない（即座に黒に）

      return () => clearTimeout(timer);
    }
  }, [shouldShowSplash, fadeDone]);

  // ★ ローディング中はスプラッシュを表示
  if (shouldShowSplash && !fadeDone) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url("/splash/splash-1170x2532.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000",
        }}
      >
        <div className="absolute bottom-12 text-white/80 text-sm animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // ★ ローディング後は children を表示（背景は黒のまま）
  return <>{children}</>;
}
