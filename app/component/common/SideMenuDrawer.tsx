// app/component/common/SideMenuDrawer.tsx
"use client";

import React, { type ReactNode, useEffect } from "react";
import cn from "clsx";
import { CyberSideMenuFrame } from "@/app/component/common/CyberSideMenuFrame";
import SettingsMenu from "@/app/component/settings/SettingsMenu";
import {
  CYBER_SIDE_MENU_EDGE_CLIP,
  CYBER_SIDE_MENU_PANEL_CLASS,
} from "@/lib/ui/cyberSideMenu";

/** 右端密着 — 左辺だけ角切り */
const CYBER_SIDE_MENU_EDGE_CLIP_RIGHT =
  "polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)";

type SideMenuDrawerProps = {
  /** 開いているかどうか */
  open: boolean;
  /** 閉じるときに呼ぶ */
  onClose: () => void;
  /** プロフィール編集の戻るなどでメニューを再度開く */
  onOpenMenu?: () => void;
  /** プロフィール編集を親側で開く（推奨） */
  onOpenProfileEdit?: () => void;
  /** mobile / web で中身のサイズを少し変える */
  variant?: "mobile" | "web";
  /** 指定時は SettingsMenu の代わりに表示（ランキング用ドロワーなど） */
  children?: ReactNode;
  /**
   * full: 画面高さ全体（既定）
   * hug: 中身の高さに合わせる
   */
  panelSize?: "full" | "hug";
  /** スライド方向（プロフィールは right） */
  from?: "left" | "right";
};

export default function SideMenuDrawer({
  open,
  onClose,
  onOpenMenu,
  onOpenProfileEdit,
  variant = "mobile",
  children,
  panelSize = "full",
  from = "left",
}: SideMenuDrawerProps) {
  const isMobile = variant === "mobile";
  const hugContent = panelSize === "hug";
  const fromRight = from === "right";

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  return (
    <>
      <style>{`
        @keyframes sideMenuPanelInLeft {
          0% {
            opacity: 0;
            transform: translateX(-18px);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
        @keyframes sideMenuPanelInRight {
          0% {
            opacity: 0;
            transform: translateX(18px);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
      `}</style>
      <div
        className={cn(
          "fixed inset-0 z-40 touch-none bg-black/58 backdrop-blur-[4px] transition-opacity duration-250",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed top-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col",
          "transition-transform duration-300 ease-out",
          fromRight ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : fromRight
              ? "translate-x-full"
              : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            CYBER_SIDE_MENU_PANEL_CLASS,
            "cyber-side-menu-panel--edge",
            fromRight && "cyber-side-menu-panel--edge-right",
            "cyber-card relative flex min-h-0 flex-col overflow-hidden",
            isMobile
              ? "h-full w-[44vw] min-w-[248px] max-w-[288px]"
              : "h-full w-[min(368px,32vw)]"
          )}
          style={{
            clipPath: fromRight
              ? CYBER_SIDE_MENU_EDGE_CLIP_RIGHT
              : CYBER_SIDE_MENU_EDGE_CLIP,
            borderRadius: 0,
            height: hugContent ? "auto" : "100%",
            maxHeight: "100dvh",
            animation: open
              ? `${fromRight ? "sideMenuPanelInRight" : "sideMenuPanelInLeft"} 0.32s cubic-bezier(0.2, 0.9, 0.2, 1) both`
              : undefined,
          }}
        >
          <div
            aria-hidden
            className={cn(
              "cyber-side-menu-grid pointer-events-none absolute inset-0 z-[1] opacity-50",
              fromRight
                ? "[mask-image:linear-gradient(270deg,#000_0%,#000_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(270deg,#000_0%,#000_55%,transparent_100%)]"
                : "[mask-image:linear-gradient(90deg,#000_0%,#000_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,#000_0%,#000_55%,transparent_100%)]"
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-[1] opacity-65",
              fromRight
                ? "[mask-image:linear-gradient(270deg,#000_0%,#000_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(270deg,#000_0%,#000_45%,transparent_100%)]"
                : "[mask-image:linear-gradient(90deg,#000_0%,#000_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,#000_0%,#000_45%,transparent_100%)]"
            )}
          >
            <CyberSideMenuFrame />
          </div>
          <span
            aria-hidden
            className={cn(
              "cyber-side-menu-edge-line pointer-events-none absolute inset-y-0 z-[2]",
              fromRight ? "left-0" : "right-0"
            )}
          />
          <div
            className={cn(
              "relative z-10 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]",
              "pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]",
              hugContent ? "" : "flex-1",
            )}
          >
            {children ?? (
              <SettingsMenu
                onRequestCloseMenu={onClose}
                onRequestOpenMenu={onOpenMenu}
                onOpenProfileEdit={onOpenProfileEdit}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
