"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import { useAuth } from "@/app/AuthProvider";

export default function WebOrMobileSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");
  const { status } = useAuth(); // ← 追加（必要なら）

  // PC(Web) → Splash を出さない
  if (isWeb) {
    return <div id="app-root">{children}</div>;
  }

  // Mobile → 初回だけ SplashWrapper
  return <SplashWrapper>{children}</SplashWrapper>;
}
