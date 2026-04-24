"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({
  anchorRect,
  message,
  onClose,
}: {
  anchorRect: DOMRect | null;
  message: string;
  onClose: () => void;
}) {
  if (!anchorRect || typeof document === "undefined") return null;

  const width = 260;

  // 画面幅（ビューポート基準。アンカーは getBoundingClientRect 済み）
  const sw = window.innerWidth;

  /** アンカー中心に合わせた left（px）。はみ出し時は端に寄せる */
  const centerX = anchorRect.left + anchorRect.width / 2;
  let leftPx = centerX - width / 2;
  leftPx = Math.max(12, Math.min(leftPx, sw - width - 12));

  /** アイコン直上：transform 祖先の外に portal するので fixed＝ビューポートと一致 */
  const topPx = anchorRect.top;

  // 外側クリックで閉じる（capture=true が重要）
  useEffect(() => {
    function handler(e: MouseEvent) {
      const box = document.getElementById("tooltip-box");
      if (box && box.contains(e.target as Node)) return; // 内側クリックは無視
      onClose();
    }

    window.addEventListener("click", handler, true); // ← ★ 重要
    return () => window.removeEventListener("click", handler, true);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed z-[9999]"
      style={{
        left: leftPx,
        top: topPx,
        width,
        /** 吹き出し下端をアンカー上端の少し上に（従来の top-60 固定よりアンカーに密着） */
        transform: "translateY(calc(-100% - 10px))",
      }}
      onClick={(e) => e.stopPropagation()} // tooltip 外へのバブリングを防ぐ
    >
      {/* 吹き出し本体 */}
      <div
        id="tooltip-box"
        className="relative bg-gray-800 text-white text-[13px] rounded-lg p-3 shadow-xl"
      >
        <div className="whitespace-pre-line leading-relaxed">{message}</div>

        {/* ▼ 三角形 */}
        <div
          className="absolute left-[50%] -bottom-2 w-0 h-0 -translate-x-1/2"
          style={{
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid #1f2937",
          }}
        />
      </div>
    </div>,
    document.body
  );
}
