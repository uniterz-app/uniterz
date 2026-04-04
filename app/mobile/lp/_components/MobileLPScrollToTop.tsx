"use client";

import { useLayoutEffect } from "react";

/**
 * モバイル LP 初回表示でヒーローが見切れる／途中から表示されるのを防ぐ。
 * スクロール復元・ハッシュ後のレイアウトなどでずれるケースを吸収する。
 */
export default function MobileLPScrollToTop() {
  useLayoutEffect(() => {
    // #signup などアンカー付き URL はブラウザのジャンプを優先する
    if (
      typeof window !== "undefined" &&
      window.location.hash &&
      window.location.hash !== "#"
    ) {
      return;
    }

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    scrollTop();
    const raf = requestAnimationFrame(scrollTop);
    const t0 = window.setTimeout(scrollTop, 0);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.history.scrollRestoration = prev;
    };
  }, []);

  return null;
}
