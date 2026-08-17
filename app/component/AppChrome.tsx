"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Header from "@/app/component/Header";
import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isGuestPreviewPath } from "@/lib/guestPreviewPaths";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import {
  getAppBrandShelfHidden,
  subscribeAppBrandShelfHidden,
} from "@/lib/ui/appBrandShelfVisibility";
import {
  getTutorialWelcomeBrandHidden,
  subscribeTutorialWelcomeBrandHidden,
} from "@/lib/tutorial/tutorialWelcomeChrome";

export default function AppChrome() {
  const pathname = usePathname() ?? "";
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );
  const welcomeBrandHidden = useSyncExternalStore(
    subscribeTutorialWelcomeBrandHidden,
    getTutorialWelcomeBrandHidden,
    () => false
  );

  const shouldHideAll =
    pathname === "/" ||
    isPublicLpPath(pathname) ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup" ||
    pathname === "/web/reset" ||
    pathname === "/mobile/reset" ||
    isGuestPreviewPath(pathname) ||
    isGuestLegalPath(pathname);

  const shouldHideHeader =
    pathname === "/web/rankings" ||
    pathname === "/mobile/rankings" ||
    pathname.startsWith("/web/communities/") ||
    pathname.startsWith("/mobile/communities/") ||
    brandShelfHidden ||
    welcomeBrandHidden;

  if (shouldHideAll) return null;

  // 下部ナビは WebOrMobileSplash でのみ描画（二重 portal 防止）
  return <>{!shouldHideHeader && <Header />}</>;
}