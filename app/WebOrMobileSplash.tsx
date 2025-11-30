"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate";
import { useSplashBackground } from "@/lib/useSplashBackground";   // ★ 追加

export default function WebOrMobileSplash({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  const showSplashBg = useSplashBackground();                      // ★ 追加

  // ★ body 背景を初回のみ splash にする
  if (typeof document !== "undefined") {
    document.body.className = showSplashBg ? "splash-bg" : "bg-black";   // ★ 追加
  }

  // PC (Web) → Splash 無し
  if (isWeb) {
    return (
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    );
  }

  // Mobile → SplashWrapper + AuthGate
  return (
    <SplashWrapper>
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    </SplashWrapper>
  );
}
