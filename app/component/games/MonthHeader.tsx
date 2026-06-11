// app/component/games/MonthHeader.tsx
"use client";

import React, { useCallback, useRef } from "react";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

type Props = {
  month: Date | null;
  onPrev: () => void;
  onNext: () => void;
  onCenterClick?: () => void;
  /** 中央ラベルをダブルタップ（モバイルは短い間隔の2回タップ）で当日へ */
  onCenterDoubleClick?: () => void;
  /** 前月に試合がない場合は無効 */
  canPrev?: boolean;
  /** 翌月に試合がない場合は無効 */
  canNext?: boolean;
  /** 隣接月の確認中 */
  navBusy?: boolean;
  /** 中央クリック不可（試合日が無い等） */
  centerDisabled?: boolean;
  className?: string;
  timeZone: string;
  language: Language;
};

export default function MonthHeader({
  month,
  onPrev,
  onNext,
  onCenterClick,
  onCenterDoubleClick,
  canPrev = true,
  canNext = true,
  navBusy = false,
  centerDisabled = false,
  className,
  timeZone,
  language,
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

  const prevDisabled = navBusy || !canPrev;
  const nextDisabled = navBusy || !canNext;

  const lastTapMs = useRef(0);
  const handleCenterDoubleMouse = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (centerDisabled || !onCenterDoubleClick) return;
      e.preventDefault();
      onCenterDoubleClick();
    },
    [centerDisabled, onCenterDoubleClick]
  );

  const handleCenterTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (centerDisabled || !onCenterDoubleClick) return;
      const now = Date.now();
      if (now - lastTapMs.current < 320) {
        onCenterDoubleClick();
        lastTapMs.current = 0;
      } else {
        lastTapMs.current = now;
      }
    },
    [centerDisabled, onCenterDoubleClick]
  );

  const centerDisabledCombined =
    centerDisabled || (!onCenterClick && !onCenterDoubleClick);

  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <button
        type="button"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-disabled={prevDisabled}
        className={[
          "rounded-md px-3 py-1 transition",
          prevDisabled
            ? "cursor-not-allowed text-white/25"
            : "text-white/70 hover:text-white",
        ].join(" ")}
      >
        ←
      </button>

      <button
        type="button"
        onClick={onCenterClick}
        onDoubleClick={handleCenterDoubleMouse}
        onTouchEnd={handleCenterTouchEnd}
        disabled={centerDisabledCombined}
        aria-disabled={centerDisabledCombined}
        title={
          onCenterDoubleClick
            ? language === "ja"
              ? "ダブルタップで当日の試合日へ"
              : "Double-tap to jump to the game day for today"
            : undefined
        }
        className={[
          "text-lg transition select-none touch-manipulation",
          centerDisabledCombined
            ? "cursor-default text-white/35"
            : "text-white hover:text-white/85",
        ].join(" ")}
      >
        {language === "ja" ? (
          <>
            <span className={resultStatsMetricNumClass}>{y}</span>年{" "}
            <span className={resultStatsMetricNumClass}>{m}</span>月
          </>
        ) : (
          <span className={resultStatsMetricNumClass}>{enMonthLabel}</span>
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        aria-disabled={nextDisabled}
        className={[
          "rounded-md px-3 py-1 transition",
          nextDisabled
            ? "cursor-not-allowed text-white/25"
            : "text-white/70 hover:text-white",
        ].join(" ")}
      >
        →
      </button>
    </div>
  );
}
