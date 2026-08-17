"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isPerfDebugBgDisabled } from "@/lib/perf/mobilePerfDebug";

/** iPhone Safari / モバイル Chrome 等 — 常時フルオーロラ背景は熱・バッテリー負荷が高い */
const MOBILE_STATIC_BG_MQ = "(max-width: 820px) and (pointer: coarse)";

function isMobileWebRoute(pathname: string): boolean {
  return (
    pathname === "/mobile" ||
    pathname.startsWith("/mobile/") ||
    pathname.startsWith("/m/")
  );
}

function isDesktopWebRoute(pathname: string): boolean {
  return pathname === "/web" || pathname.startsWith("/web/");
}

function isDevPreviewRoute(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

/**
 * 軽量固定背景を使うか。
 * - /mobile/* ルート
 * - /web/* ルート（デスクトップ Web はアニメ背景オフ）
 * - /dev/* プレビュー（UI 確認用・アニメオフ）
 * - 狭い画面 + タッチ（/web を iPhone で開いた場合も含む）
 * - perf デバッグで背景 OFF
 */
export function usePreferStaticPageBackground(): boolean {
  const pathname = usePathname() ?? "";
  const mobileRoute = isMobileWebRoute(pathname);
  const desktopWebRoute = isDesktopWebRoute(pathname);
  const devPreviewRoute = isDevPreviewRoute(pathname);
  const [coarseViewport, setCoarseViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia(MOBILE_STATIC_BG_MQ).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_STATIC_BG_MQ);
    const sync = () => setCoarseViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (typeof window !== "undefined" && isPerfDebugBgDisabled()) return true;

  return mobileRoute || desktopWebRoute || devPreviewRoute || coarseViewport;
}
