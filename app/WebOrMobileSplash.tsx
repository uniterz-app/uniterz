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