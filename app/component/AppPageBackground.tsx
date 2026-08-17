"use client";

import { usePathname } from "next/navigation";
import MobileStaticPageBackground from "@/app/component/games/MobileStaticPageBackground";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";

/**
 * アプリ全体で1インスタンスのメッシュ背景。
 * ルート layout に置き、ページ遷移でアンマウントされない。
 * LP は独自背景のためここでは出さない。
 */
export default function AppPageBackground() {
  const pathname = usePathname();

  if (isPublicLpPath(pathname)) {
    return null;
  }

  return <MobileStaticPageBackground />;
}
