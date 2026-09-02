"use client";

import { nameOxanium } from "@/lib/fonts";
import type { LeagueStatsEmptyStateCopy } from "@/lib/nba/leagueStatsEmptyState";

type Props = {
  copy: LeagueStatsEmptyStateCopy;
  className?: string;
};

/** Team / Player リーグ表 — 行ゼロ時のプレースホルダ */
export default function NbaLeagueStatsTableEmpty({
  copy,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-[2px] border border-[rgba(0,245,255,0.14)] bg-[rgba(4,16,24,0.45)] px-6 py-10 text-center",
        className,
      ].join(" ")}
    >
      <p
        className={[
          nameOxanium.className,
          "text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#00F5FF]/75",
        ].join(" ")}
      >
        {copy.title}
      </p>
      <p className="mt-3 max-w-[18rem] text-[12px] leading-relaxed text-white/55">
        {copy.body}
      </p>
    </div>
  );
}
