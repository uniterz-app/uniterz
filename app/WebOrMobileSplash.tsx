"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate";

export default function WebOrMobileSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  if (isWeb) {
    // web → splash 無効
    return (
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    );
  }

  // mobile → splash あり
  return (
    <SplashWrapper>
      <AuthGate>
        <div id="app-root">{children}</div>
      </AuthGate>
    </SplashWrapper>
  );
}
