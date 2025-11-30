"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate";

export default function WebOrMobileSplash({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  // PC(Web) → スプラッシュなし
  if (isWeb) {
    return (
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    );
  }

  // Mobile → スプラッシュあり
  return (
    <SplashWrapper>
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    </SplashWrapper>
  );
}
