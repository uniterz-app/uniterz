"use client";

import { usePathname } from "next/navigation";
import AuthGate from "@/app/AuthGate";
import NavBar from "@/app/component/NavBar";
import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isProfileSetupRoute } from "@/lib/profileSetupRoute";

/** 下部ナビを出さないルート（ゲスト向け文言ページ・初回プロフィールセットアップ） */
function shouldShowBottomNavBar(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  if (isGuestLegalPath(pathname)) return false;
  if (isProfileSetupRoute(pathname)) return false;
  return true;
}

export default function WebOrMobileSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWeb = pathname?.startsWith("/web");

  // "/" は app/page.tsx 自身がスプラッシュと遷移制御を持つため、ここで重ねない
  if (pathname === "/") {
    return (
      <div id="app-root" className="relative isolate min-h-0">
        {children}
      </div>
    );
  }

  // 公開LPは Firebase 待ちのスプラッシュを出さない（開けないように見えるのを防ぐ）
  if (pathname === "/mobile/lp" || pathname === "/mobile/lp-v2") {
    return (
      <div id="app-root" className="relative isolate min-h-0">
        {children}
      </div>
    );
  }
  if (pathname === "/lp" || pathname === "/lp-v2") {
    return (
      <div id="app-root" className="relative isolate min-h-0">
        {children}
      </div>
    );
  }

  if (isWeb) {
    return (
      <AuthGate platform="web">
        <div id="app-root" className="relative isolate min-h-0">
          {children}
        </div>
        {shouldShowBottomNavBar(pathname) ? <NavBar /> : null}
      </AuthGate>
    );
  }

  return (
    <AuthGate platform="mobile">
      <div id="app-root" className="relative isolate min-h-0">
        {children}
      </div>
      {shouldShowBottomNavBar(pathname) ? <NavBar /> : null}
    </AuthGate>
  );
}