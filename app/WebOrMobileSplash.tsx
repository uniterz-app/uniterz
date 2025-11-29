"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate"; // ← ここ重要！

export default function WebOrMobileSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

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
