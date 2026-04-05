// app/component/games/MonthHeader.tsx
"use client";

import React from "react";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  month: Date | null;
  onPrev: () => void;
  onNext: () => void;
  onCenterClick?: () => void;
  className?: string;
  timeZone: string;
  isEn: boolean;
};

export default function MonthHeader({
  month,
  onPrev,
  onNext,
  onCenterClick,
  className,
  timeZone,
  isEn,
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

  const y = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(month)
  );
  const m = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, month: "2-digit" }).format(month)
  );

  const enMonthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    year: "numeric",
  }).format(month);

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
        className="text-lg text-white transition hover:text-white/85"
      >
        {isEn ? (
          <span className={resultStatsMetricNumClass}>{enMonthLabel}</span>
        ) : (
          <>
            <span className={resultStatsMetricNumClass}>{y}</span>年{" "}
            <span className={resultStatsMetricNumClass}>{m}</span>月
          </>
        )}
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