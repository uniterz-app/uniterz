// app/component/games/MonthHeader.tsx
"use client";

import React, { useCallback, useRef } from "react";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { GAMES_HEADER_CONTROL_H } from "@/lib/ui/gamesHeaderBar";
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
  /** 試合ヘッダー：タイトル行と同じ3列グリッドで日付を中央揃え */
  gamesHeaderAlign?: boolean;
  /** 試合ヘッダー：タイトル直下に日付をインライン表示 */
  gamesHeaderStack?: boolean;
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
  gamesHeaderAlign = false,
  gamesHeaderStack = false,
  timeZone,
  language,
}: Props) {
  if (!month) {
    const emptyRootClass = gamesHeaderStack
      ? `flex items-center justify-center gap-1 ${className ?? ""}`
      : gamesHeaderAlign
        ? `relative w-full ${GAMES_HEADER_CONTROL_H} ${className ?? ""}`
        : `flex items-center justify-between ${className ?? ""}`;
    return (
      <div className={emptyRootClass}>
        <div
          className={
            gamesHeaderStack
              ? "rounded-md px-1 py-1 opacity-40"
              : gamesHeaderAlign
                ? "absolute left-2 top-1/2 -translate-y-1/2 rounded-md px-1 py-2 opacity-40"
                : "rounded-md px-3 py-2 opacity-40"
          }
        >
          ←
        </div>
        <div
          className={
            gamesHeaderStack
              ? "text-lg font-bold text-white/40"
              : gamesHeaderAlign
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-white/40"
                : "text-lg font-bold text-white/40"
          }
        >
          …
        </div>
        <div
          className={
            gamesHeaderStack
              ? "rounded-md px-1 py-1 opacity-40"
              : gamesHeaderAlign
                ? "absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 py-2 opacity-40"
                : "rounded-md px-3 py-2 opacity-40"
          }
        >
          →
        </div>
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

  const rootClass = gamesHeaderStack
    ? `flex items-center justify-center gap-2 ${className ?? ""}`
    : gamesHeaderAlign
      ? `relative w-full ${GAMES_HEADER_CONTROL_H} ${className ?? ""}`
      : `flex items-center justify-between ${className ?? ""}`;

  const prevClass = gamesHeaderStack
    ? "shrink-0 rounded-md px-1 py-0.5 transition"
    : gamesHeaderAlign
      ? "absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-md px-1 py-1 transition"
      : "rounded-md px-3 py-1 transition";

  const nextClass = gamesHeaderStack
    ? "shrink-0 rounded-md px-1 py-0.5 transition"
    : gamesHeaderAlign
      ? "absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-md px-1 py-1 transition"
      : "rounded-md px-3 py-1 transition";

  const centerClass = gamesHeaderStack
    ? "shrink-0 text-center text-lg leading-none transition select-none touch-manipulation"
    : gamesHeaderAlign
      ? "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center text-lg transition select-none touch-manipulation"
      : "text-lg transition select-none touch-manipulation";

  return (
    <div className={rootClass}>
      <button
        type="button"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-disabled={prevDisabled}
        className={[
          prevClass,
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
          centerClass,
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
          nextClass,
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
