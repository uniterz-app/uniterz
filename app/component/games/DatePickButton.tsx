"use client";
import React from "react";

export default function DatePickButton({
  date,
  onPick,
  className,
  size = "md",
}: {
  date: Date;
  onPick: (d: Date) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
 const sizeMap = {
  sm: "w-8 h-8",      // ← 9→8に
  md: "w-11 h-11",
  lg: "w-12 h-12",
} as const;

  const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <div className={["relative inline-block", className ?? ""].join(" ")}>
      {/* 見た目用ボタン（下層） */}
      <div
        className={[
          "rounded-full border border-white/15 bg-white/5",
          "flex items-center justify-center select-none",
          sizeMap[size],
        ].join(" ")}
        aria-hidden="true"
      >
        {/* カレンダーアイコン */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="white" opacity="0.85"/>
          <path d="M3 9h18" stroke="white" opacity="0.85"/>
          <path d="M8 3v4M16 3v4" stroke="white" opacity="0.85"/>
        </svg>
      </div>

      {/* 透明の date input を上に全面重ねる（iOS Safari 対策） */}
      <input
        type="date"
        aria-label="Pick a date"
        value={toYYYYMMDD(date)}
        onChange={(e) => {
          if (!e.target.value) return;
          const [y, m, d] = e.target.value.split("-").map(Number);
          onPick(new Date(y, (m ?? 1) - 1, d ?? 1)); // JST想定でOK
        }}
        className={[
          "absolute inset-0",
          "opacity-0 cursor-pointer",        // 視覚的に隠すがタップは通す
          "appearance-none",                  // iOS描画のブレ防止
        ].join(" ")}
        style={{
          WebkitAppearance: "none",
          // iOSでタップ領域44px以上推奨、サイズは見た目ボタンに合わせているのでOK
        }}
      />
    </div>
  );
}
