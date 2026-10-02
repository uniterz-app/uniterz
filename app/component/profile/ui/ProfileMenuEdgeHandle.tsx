"use client";

/**
 * プロフィールのサイドメニュー入口 — 画面右端の縦ハンドル + 右端スワイプ。
 * カード内のバーガーアイコン廃止に伴う代替導線。
 * body へポータルして、親の transform / overflow に固定位置を奪われないようにする。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import { ChevronLeft } from "lucide-react";

const EDGE_START_PX = 28;
const OPEN_DX_PX = 48;
const CANCEL_DY_PX = 40;

export default function ProfileMenuEdgeHandle({
  onOpen,
  unreadCount = 0,
  adminUnreadCount = 0,
  ariaLabel = "メニュー",
  /** サイドメニュー開中は非表示（ドロワーと文字が被らないようにする） */
  hidden = false,
  /** 表示時にフェードイン（試合ページ着地など） */
  fadeIn = false,
  /** 縦書きラベル（既定 MENU） */
  label = "MENU",
  /** BACK は白黒（MENU / STATS のゴールドと対） */
  tone = "gold",
  /** 予想オーバーレイより前面（z-index） */
  overlay = false,
  /** チュートリアル穴測定（Web data-tutorial-target 相当） */
  tutorialTargetId,
  /** 親レール内に置く（portal / 右端スワイプなし） */
  inline = false,
}: {
  onOpen: () => void;
  unreadCount?: number;
  /** 管理の新着（問い合わせ・交換申請）。赤バッジ */
  adminUnreadCount?: number;
  ariaLabel?: string;
  hidden?: boolean;
  fadeIn?: boolean;
  label?: string;
  tone?: "gold" | "back";
  overlay?: boolean;
  tutorialTargetId?: string;
  inline?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hidden || inline) return;
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
  }, [onOpen, hidden, inline]);

  if (!mounted && !inline) return null;

  const show = !hidden;
  const button = (
    <button
      type="button"
      className={cn(
        "profile-menu-edge-handle",
        inline && "profile-menu-edge-handle--inline",
        fadeIn && !inline && "profile-menu-edge-handle--fade",
        !show && "profile-menu-edge-handle--hidden",
        tone === "back" && "profile-menu-edge-handle--back",
        overlay && "profile-menu-edge-handle--overlay"
      )}
      onClick={onOpen}
      aria-label={ariaLabel}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      {...(tutorialTargetId && show
        ? { "data-tutorial-target": tutorialTargetId }
        : {})}
    >
      {tone === "back" ? (
        <ChevronLeft
          className="profile-menu-edge-handle__chev"
          size={11}
          strokeWidth={2.4}
          aria-hidden
        />
      ) : null}
      {label
        .toUpperCase()
        .split("")
        .map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="profile-menu-edge-handle__ch"
            aria-hidden
          >
            {ch}
          </span>
        ))}
      {adminUnreadCount > 0 ? (
        <span
          className="profile-menu-edge-handle__badge profile-menu-edge-handle__badge--admin"
          aria-hidden
        >
          {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
        </span>
      ) : null}
      {unreadCount > 0 ? (
        <span
          className={[
            "profile-menu-edge-handle__badge",
            adminUnreadCount > 0
              ? "profile-menu-edge-handle__badge--lower"
              : "",
          ].join(" ")}
          aria-hidden
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );

  if (inline) return button;
  return createPortal(button, document.body);
}
