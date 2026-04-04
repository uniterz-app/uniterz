"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate";
import NavBar from "@/app/component/NavBar";

export default function WebOrMobileSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  // 公開LPは Firebase 待ちのスプラッシュを出さない（開けないように見えるのを防ぐ）
  if (pathname === "/mobile/lp") {
    return <div id="app-root">{children}</div>;
  }
  if (pathname === "/lp") {
    return (
      <>
        <div id="app-root">{children}</div>
        <NavBar />
      </>
    );
  }

  if (isWeb) {
    return (
      <AuthGate>
        <SplashWrapper>
          <div id="app-root">{children}</div>
          <NavBar />
        </SplashWrapper>
      </AuthGate>
    );
  }

  return (
    <SplashWrapper>
      <div id="app-root">{children}</div>
      <NavBar />
    </SplashWrapper>
  );
}