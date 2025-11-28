"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function SplashWrapper({
  children,
  forceSplash = false,
}: {
  children?: React.ReactNode;
  forceSplash?: boolean;
}) {
  const { status } = useFirebaseUser();

  const shouldShowSplash =
    forceSplash || status === "loading";

  if (shouldShowSplash) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url("/splash/splash-1170x2532.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000", // ← 保険で黒背景（画像読込前の白防止）
        }}
      >
        <div className="absolute bottom-12 text-white/80 text-sm animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // ⭐️ ready / guest / forceSplash=false の時だけ children
  return <>{children}</>;
}
