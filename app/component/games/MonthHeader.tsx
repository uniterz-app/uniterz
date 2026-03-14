// app/component/games/MonthHeader.tsx
"use client";

import React from "react";

type Props = {
  month: Date | null;
  onPrev: () => void;
  onNext: () => void;
  onCenterClick?: () => void;
  className?: string;
};

export default function MonthHeader({
  month,
  onPrev,
  onNext,
  onCenterClick,
  className,
}: Props) {
  if (!month) {
    return (
      <div className={`flex items-center justify-between ${className ?? ""}`}>
        <div className="rounded-md px-3 py-2 opacity-40">←</div>
        <div className="text-lg font-bold text-white/40">…</div>
        <div className="rounded-md px-3 py-2 opacity-40">→</div>
      </div>
    );
  }

  const y = month.getFullYear();
  const m = month.getMonth() + 1;

  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <button
        type="button"
        onClick={onPrev}
        className="rounded-md px-3 py-2 text-white/70 transition hover:text-white"
      >
        ←
      </button>

      <button
        type="button"
        onClick={onCenterClick}
        className="text-lg font-bold text-white transition hover:text-white/85"
      >
        {`${y}年 ${m}月`}
      </button>

      <button
        type="button"
        onClick={onNext}
        className="rounded-md px-3 py-2 text-white/70 transition hover:text-white"
      >
        →
      </button>
    </div>
  );
}