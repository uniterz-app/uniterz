"use client";

import { useLayoutEffect } from "react";

/**
 * モバイル LP 初回表示でヒーローが見切れる／途中から表示されるのを防ぐ。
 * スクロール復元・ハッシュ後のレイアウトなどでずれるケースを吸収する。
 */
export default function MobileLPScrollToTop() {
  useLayoutEffect(() => {
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    // モバイル LP は初期表示を常にトップ固定にする。
    // 以前の #features などが URL に残っていても自動ジャンプを防ぐ。
    if (window.location.hash && window.location.hash !== "#") {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      );
    }

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
