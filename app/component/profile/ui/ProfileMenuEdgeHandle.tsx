"use client";

/**
 * プロフィールのサイドメニュー入口 — 画面右端の縦ハンドル + 右端スワイプ。
 * カード内のバーガーアイコン廃止に伴う代替導線。
 * body へポータルして、親の transform / overflow に固定位置を奪われないようにする。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const EDGE_START_PX = 28;
const OPEN_DX_PX = 48;
const CANCEL_DY_PX = 40;

export default function ProfileMenuEdgeHandle({
  onOpen,
  unreadCount = 0,
  ariaLabel = "メニュー",
  /** サイドメニュー開中は非表示（ドロワーと文字が被らないようにする） */
  hidden = false,
}: {
  onOpen: () => void;
  unreadCount?: number;
  ariaLabel?: string;
  hidden?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hidden) return;
    let tracking = false;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX >= window.innerWidth - EDGE_START_PX) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > CANCEL_DY_PX) {
        tracking = false;
        return;
      }
      if (dx < -OPEN_DX_PX) {
        tracking = false;
        onOpen();
      }
    };
    const onTouchEnd = () => {
      tracking = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onOpen, hidden]);

  if (!mounted || hidden) return null;

  return createPortal(
    <button
      type="button"
      className="profile-menu-edge-handle"
      onClick={onOpen}
      aria-label={ariaLabel}
    >
      {"MENU".split("").map((ch) => (
        <span key={ch} className="profile-menu-edge-handle__ch" aria-hidden>
          {ch}
        </span>
      ))}
      {unreadCount > 0 ? (
        <span className="profile-menu-edge-handle__badge" aria-hidden>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>,
    document.body
  );
}
