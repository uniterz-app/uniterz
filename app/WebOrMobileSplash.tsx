"use client";

import { usePathname } from "next/navigation";
import SplashWrapper from "@/app/SplashWrapper";
import AuthGate from "@/app/AuthGate";
import MaintenanceOverlay from "@/app/component/common/maintenance";

export default function WebOrMobileSplash({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  // PC(Web)
  if (isWeb) {
    return (
      <AuthGate>
        {/* ★ ここに追加 */}
        <MaintenanceOverlay />
        <div id="app-root">{children}</div>
      </AuthGate>
    );
  }

  // Mobile
  return (
    <SplashWrapper>
      <AuthGate>
        {/* ★ ここにも追加 */}
        <MaintenanceOverlay />
        <div id="app-root">{children}</div>
      </AuthGate>
    </SplashWrapper>
  );
}
