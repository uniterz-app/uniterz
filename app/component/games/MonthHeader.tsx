// app/component/games/MonthHeader.tsx
"use client";

import React from "react";

type Props = {
  month: Date | null;       // ← null 許容（ロード前の安全対策）
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export default function MonthHeader({ month, onPrev, onNext, className }: Props) {
  // ★ 第1段階：データ未読み込み or null の場合は高さだけ確保して return
  if (!month) {
    return (
      <div className={`flex items-center justify-between ${className ?? ""}`}>
        <div className="px-3 py-2 opacity-40">←</div>
        <div className="text-lg font-bold text-white/40">…</div>
        <div className="px-3 py-2 opacity-40">→</div>
      </div>
    );
  }

  // ★ データがある場合：年と月を計算
  const y = month.getFullYear();
  const m = month.getMonth() + 1;

  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      {/* 前月の試合日へ */}
      <button
        onClick={onPrev}
        className="px-3 py-2 rounded-md text-white/70 hover:text-white transition"
      >
        ←
      </button>

      {/* 現在の年月を表示 */}
      <div className="text-lg font-bold text-white">
        {`${y}年 ${m}月`}
      </div>

      {/* 次の月の試合日へ */}
      <button
        onClick={onNext}
        className="px-3 py-2 rounded-md text-white/70 hover:text-white transition"
      >
        →
      </button>
    </div>
  );
}
