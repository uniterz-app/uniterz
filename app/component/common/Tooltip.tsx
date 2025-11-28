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

  // 外側タップで閉じる
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      className="fixed z-[9999]"
      style={{ top, left, width }}
      onClick={(e) => e.stopPropagation()} // ← 外側クリックを吸わない
    >
      {/* ⭐ 吹き出し本体に onClick={onClose} を追加 */}
      <div
        className="relative bg-gray-800 text-white text-[13px] rounded-lg p-3 shadow-xl"
        onClick={onClose} // ←🔥 これで吹き出しタップでも閉じる
      >
        <div className="leading-relaxed">{message}</div>

        {/* ▼ 三角形 */}
        <div
          className="absolute left-[80%] -bottom-2 w-0 h-0 -translate-x-1/2"
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
