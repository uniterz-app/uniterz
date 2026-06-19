"use client";

import Soccer from "@/app/component/games/icons/Soccer";
import type { WcMatchGoalScorerGroupedLine } from "@/lib/wc/matchGoalScorers";
import { RESULT_HAIRLINE } from "@/lib/result/resultGlass";

type Props = {
  lines: WcMatchGoalScorerGroupedLine[];
  compact?: boolean;
};

/** 試合エリア下 — 得点者一覧（フルネーム・同一選手は分数をカンマ連結） */
export default function WcMatchGoalScorersBlock({
  lines,
  compact = false,
}: Props) {
  if (!lines.length) return null;

  const homeLines = lines.filter((l) => l.side === "home");
  const awayLines = lines.filter((l) => l.side === "away");
  const textClass = compact
    ? "text-[11px] leading-snug md:text-xs"
    : "text-xs leading-snug md:text-[13px]";

  return (
    <div className={compact ? "mt-2" : "mt-2.5"}>
      <div className={RESULT_HAIRLINE} aria-hidden />
      <div
        className={[
          "relative grid grid-cols-2 gap-x-3",
          compact ? "mt-2 pb-0.5" : "mt-2.5 pb-1",
        ].join(" ")}
      >
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          {homeLines.map((line) => (
            <p
              key={`home-${line.text}`}
              className={[
                "max-w-full text-left font-medium text-white/78",
                textClass,
              ].join(" ")}
            >
              {line.text}
            </p>
          ))}
        </div>
        <div className="flex min-w-0 flex-col items-end gap-0.5">
          {awayLines.map((line) => (
            <p
              key={`away-${line.text}`}
              className={[
                "max-w-full text-right font-medium text-white/78",
                textClass,
              ].join(" ")}
            >
              {line.text}
            </p>
          ))}
        </div>
        <Soccer
          aria-hidden
          className={[
            "pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 opacity-35",
            compact ? "md:h-4 md:w-4" : "md:h-[18px] md:w-[18px]",
          ].join(" ")}
          fill="currentColor"
          stroke="#fff"
        />
      </div>
    </div>
  );
}
