"use client";

import { nameOxanium } from "@/lib/fonts";
import { streakTagLabel, streakTagTone } from "@/lib/result/streakTagTone";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

/** リザルトカード左上 連勝タグ — 03 塗りピル + 文字 skew */
export default function ResultImpactStreakTag({
  winStreak,
  className = "",
}: {
  winStreak: number;
  className?: string;
}) {
  const n = normalizeWinStreak(winStreak);
  if (n < 3) return null;
  const tone = streakTagTone(n);
  const glow = n >= 5 ? `0 0 10px ${tone.glow}` : "none";
  return (
    <span
      className={`inline-flex items-center ${className}`.trim()}
      style={{
        backgroundColor: tone.accent,
        boxShadow: glow,
        padding: "3px 8px",
        borderRadius: 2,
      }}
    >
      <span
        className={`${nameOxanium.className} inline-block text-[12px] font-extrabold leading-none tracking-[0.09em]`}
        style={{ color: tone.ink, transform: "skewX(-12deg)" }}
      >
        {streakTagLabel(n)}
      </span>
    </span>
  );
}
