// app/component/common/SideMenuDrawer.tsx
"use client";

import React from "react";
import cn from "clsx";
import SettingsMenu from "@/app/component/settings/SettingsMenu";

type SideMenuDrawerProps = {
  /** 開いているかどうか */
  open: boolean;
  /** 閉じるときに呼ぶ */
  onClose: () => void;
  /** mobile / web で中身のサイズを少し変える */
  variant?: "mobile" | "web";
};

export default function SideMenuDrawer({
  open,
  onClose,
  variant = "mobile",
}: SideMenuDrawerProps) {
  return (
    <>
      {/* 半透明の背景（open のときだけ表示） */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* 左からスライドインするメニュー本体 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* 外側の余白 */}
        <div className="h-full px-3 py-6">
          {/* ★ 中身だけスクロール可能にする */}
          <div className="h-full overflow-y-auto pr-1">
            <SettingsMenu variant={variant} />
          </div>
        </div>
      </div>
    </>
  );
}
