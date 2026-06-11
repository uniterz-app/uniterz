"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Web 向け Auth スプラッシュ用 GLB のみ先読みする。
 * モバイルでは CSS スプラッシュのため three.js / GLB をロードしない。
 */
export default function SplashGlbPreload() {
  const pathname = usePathname();
  const isMobileRoute =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  useEffect(() => {
    if (isMobileRoute) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = "/logo/uniterz-logo.glb";
    link.as = "fetch";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [isMobileRoute]);

  return null;
}
