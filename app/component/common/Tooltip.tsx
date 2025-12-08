"use client";

import { useEffect } from "react";

export default function Tooltip({
  anchorRect,
  message,
  onClose,
}: {
  anchorRect: DOMRect | null;
  message: string;
  onClose: () => void;
}) {
  if (!anchorRect) return null;

  const width = 260;

  // 画面幅
  const sw = typeof window !== "undefined" ? window.innerWidth : 390;

  // 中央寄せ
  let left = anchorRect.left + anchorRect.width / 2 - width / 2;

  // 画面からはみ出さない
  left = Math.max(12, Math.min(left, sw - width - 12));

  const top = anchorRect.top - 60;

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

  return (
    <div
      className="fixed z-[9999]"
      style={{ top, left, width }}
      onClick={(e) => e.stopPropagation()} // tooltip 外へのバブリングを防ぐ
    >
      {/* 吹き出し本体 */}
      <div
        id="tooltip-box"
        className="relative bg-gray-800 text-white text-[13px] rounded-lg p-3 shadow-xl"
      >
        <div className="leading-relaxed">{message}</div>

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
    </div>
  );
}
