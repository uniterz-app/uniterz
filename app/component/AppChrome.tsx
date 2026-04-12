"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/component/Header";
import { isGuestLegalPath } from "@/lib/guestLegalPaths";

export default function AppChrome() {
  const pathname = usePathname() ?? "";

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
    isGuestLegalPath(pathname);

  const shouldHideHeader =
    pathname === "/web/rankings" ||
    pathname === "/mobile/rankings" ||
    pathname.startsWith("/web/communities/") ||
    pathname.startsWith("/mobile/communities/");

  if (shouldHideAll) return null;

  // 下部ナビは WebOrMobileSplash でのみ描画（二重 portal 防止）
  return <>{!shouldHideHeader && <Header />}</>;
}