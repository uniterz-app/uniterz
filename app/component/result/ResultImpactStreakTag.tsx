"use client";

import { matchScoreClass } from "@/lib/fonts";
import { streakTagLabel, streakTagTone } from "@/lib/result/streakTagTone";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

/** リザルトカード左上 IMPACT 連勝タグ（W{n} + 斜めアンダー） */
export default function ResultImpactStreakTag({
  winStreak,
  className = "",
}: {
  winStreak: number;
  className?: string;
}) {
  const n = normalizeWinStreak(winStreak);
  if (n < 3) return null;
  const color = streakTagTone(n).accent;
  return (
    <span className={`inline-flex flex-col items-stretch ${className}`.trim()}>
      <span
        className={`${matchScoreClass} text-[15px] leading-none tracking-[0.04em]`}
        style={{ color }}
      >
        {streakTagLabel(n)}
      </span>
      <span
        className="mt-px h-[2px] w-full origin-center -rotate-[8deg]"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    </span>
  );
}
