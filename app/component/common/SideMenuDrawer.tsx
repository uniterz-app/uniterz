// app/component/common/SideMenuDrawer.tsx
"use client";

import React, { type ReactNode } from "react";
import cn from "clsx";
import { CyberSideMenuFrame } from "@/app/component/common/CyberSideMenuFrame";
import SettingsMenu from "@/app/component/settings/SettingsMenu";
import {
  CYBER_SIDE_MENU_CLIP,
  CYBER_SIDE_MENU_PANEL_CLASS,
} from "@/lib/ui/cyberSideMenu";

type SideMenuDrawerProps = {
  /** 開いているかどうか */
  open: boolean;
  /** 閉じるときに呼ぶ */
  onClose: () => void;
  /** プロフィール編集の戻るなどでメニューを再度開く */
  onOpenMenu?: () => void;
  /** mobile / web で中身のサイズを少し変える */
  variant?: "mobile" | "web";
  /** 指定時は SettingsMenu の代わりに表示（ランキング用ドロワーなど） */
  children?: ReactNode;
};

export default function SideMenuDrawer({
  open,
  onClose,
  onOpenMenu,
  variant = "mobile",
  children,
}: SideMenuDrawerProps) {
  const isMobile = variant === "mobile";
  return (
    <>
      <style>{`
        @keyframes sideMenuPanelIn {
          0% {
            opacity: 0;
            transform: translateX(-14px);
            filter: blur(4px);
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
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-[3px] transition-opacity duration-250",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex max-h-[100dvh] flex-col py-4 pl-0 pr-3 sm:py-5 sm:pr-5",
          "transition-transform duration-300 ease-out",
          open ? (isMobile ? "-translate-x-4" : "-translate-x-2") : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            CYBER_SIDE_MENU_PANEL_CLASS,
            "cyber-card relative max-h-[min(92dvh,calc(100dvh-3rem))] min-h-0 overflow-y-auto overflow-x-hidden",
            isMobile
              ? "w-[46vw] min-w-[260px] max-w-[300px] -ml-2"
              : "w-[min(368px,32vw)]"
          )}
          style={{
            clipPath: CYBER_SIDE_MENU_CLIP,
            borderRadius: 0,
            animation: open
              ? "sideMenuPanelIn 0.32s cubic-bezier(0.2, 0.9, 0.2, 1) both"
              : undefined,
          }}
        >
          <CyberSideMenuFrame />
          <div className="relative z-10">
            {children ?? (
              <SettingsMenu
                onRequestCloseMenu={onClose}
                onRequestOpenMenu={onOpenMenu}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
