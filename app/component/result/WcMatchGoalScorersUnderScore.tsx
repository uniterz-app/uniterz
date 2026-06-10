"use client";

import type { PostMatchGoalScorer } from "@/lib/wc/matchGoalScorers";

type Props = {
  scorers: PostMatchGoalScorer[];
  side: "home" | "away";
  compact?: boolean;
};

/** チーム名の直下 — そのサイドの得点者を分数順に縦並び */
export default function WcMatchGoalScorersColumn({
  scorers,
  side,
  compact = false,
}: Props) {
  const rows = scorers.filter((s) => s.side === side);
  if (!rows.length) return null;

  const textClass = compact
    ? "text-[10px] leading-tight md:text-[11px]"
    : "text-[11px] leading-tight md:text-xs";

  return (
    <div
      className={[
        "flex w-full min-w-0 flex-col items-center",
        compact ? "mt-0.5 gap-px" : "mt-1 gap-0.5",
      ].join(" ")}
    >
      {rows.map((s, i) => (
        <div
          key={`${s.label}-${s.minute ?? "x"}-${i}`}
          className={[
            "max-w-full truncate text-center font-semibold tabular-nums",
            textClass,
            s.ownGoal ? "text-white/45" : "text-white/72",
          ].join(" ")}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}
