"use client";

import React, { useEffect } from "react";

export default function PostSuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  // 背景タップで閉じる
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative bg-[#111]/90 backdrop-blur-lg rounded-2xl p-6 w-[85%] max-w-[380px] text-center border border-white/10 shadow-xl">

        {/* アイコン */}
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#0ea5e9] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 text-black"
            fill="currentColor"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm.75 15h-1.5v-1.5h1.5zm0-3.75h-1.5v-6h1.5z" />
          </svg>
        </div>

        {/* メッセージ */}
        <p className="text-white text-[15px] leading-relaxed mb-5">
          試合結果が確定すると、<br />
          分析カードの成績が自動で更新されます。
        </p>

        {/* ボタン */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-black
                     bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9]
                     hover:opacity-90 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}
