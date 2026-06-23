"use client";

import React from "react";
import { matchScoreClass } from "@/lib/fonts";

type Props = {
  home: number;
  away: number;
  className?: string;
};

/** 試合スコア（モバイルでも1行に収める flex レイアウト） */
export default function MatchScoreLine({ home, away, className = "" }: Props) {
  return (
    <div
      className={[
        "flex max-w-full flex-nowrap items-baseline justify-center gap-1.5 whitespace-nowrap sm:gap-2",
        matchScoreClass,
        className,
      ].join(" ")}
    >
      <span className="shrink-0 tabular-nums">{home}</span>
      <span className="shrink-0 opacity-70">–</span>
      <span className="shrink-0 tabular-nums">{away}</span>
    </div>
  );
}
