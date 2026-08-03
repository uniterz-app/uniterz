"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Header from "@/app/component/Header";
import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isGuestPreviewPath } from "@/lib/guestPreviewPaths";
import {
  getAppBrandShelfHidden,
  subscribeAppBrandShelfHidden,
} from "@/lib/ui/appBrandShelfVisibility";

export default function AppChrome() {
  const pathname = usePathname() ?? "";
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );

  const shouldHideAll =
    pathname === "/" ||
    pathname === "/lp" ||
    pathname === "/lp-v2" ||
    pathname === "/mobile/lp" ||
    pathname === "/mobile/lp-v2" ||
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
    brandShelfHidden;

  if (shouldHideAll) return null;

  // 下部ナビは WebOrMobileSplash でのみ描画（二重 portal 防止）
  return <>{!shouldHideHeader && <Header />}</>;
}