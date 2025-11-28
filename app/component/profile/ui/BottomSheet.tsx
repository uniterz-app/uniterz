"use client";
import React from "react";
import cn from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // オーバーレイ
  backdropClassName?: string; // 例: "bg-black/30"
  overlayClassName?: string;  // 追加のクラス（任意）

  // パネル見た目
  panelClassName?: string;

  // 高さと最大幅
  height?: number | string;
  panelMaxWidth?: number | string;
};

export default function BottomSheet({
  open,
  onClose,
  children,
  backdropClassName = "bg-black/30",
  overlayClassName,
  panelClassName,
  height,
  panelMaxWidth = 720,
}: Props) {
  if (!open) return null;

  const resolvedHeight =
    typeof height === "number" ? `${height}px` : height;
  const resolvedMaxWidth =
    typeof panelMaxWidth === "number" ? `${panelMaxWidth}px` : panelMaxWidth;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* overlay：全面クリックで閉じる */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-xl bg-black/5",
          backdropClassName,
          overlayClassName
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* container：モバイルは下寄せ、PCは中央寄せ */}
      <div
        className="
          absolute inset-x-0 bottom-0
          sm:inset-y-0 sm:my-auto sm:bottom-auto
          flex justify-center   /* ★ 横方向を中央寄せにする */
        "
      >
        {/* panel */}
        <div
          className={cn(
            // 幅：モバイルは 92vw・最大 420px、PC は sm: 自動、lg: 640px をデフォルト
            "relative w-[92vw] max-w-[420px] sm:w-auto lg:max-w-[640px]",
            // 角丸：モバイルは上だけ丸める、PC は全面
            "rounded-t-2xl sm:rounded-2xl",
            // 背景＆文字
            "bg-[var(--color-card-bg,#12444D)] text-white",
            // 影
            "shadow-2xl shadow-black/30",
            // 余白
            "p-4 sm:p-6 mb-2 sm:mb-0",
            panelClassName
          )}
          style={{
            ...(resolvedHeight ? { height: resolvedHeight } : {}),
            ...(resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : {}),
          }}
        >
          {/* グリッパー */}
          <div className="grid place-items-center pt-1 pb-2 sm:pt-0 sm:pb-3">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>

          {/* 本文 */}
          <div className="max-h-full overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}


