"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { nameOxanium } from "@/lib/fonts";
import { nbaLeagueStatsSeasonNavState } from "@/lib/nba/nbaLeagueStatsSeasonNav";

type Props = {
  seasonKey: string;
  onSeasonChange: (seasonKey: string) => void;
  className?: string;
};

/** Web リーグ表の年切替（◀ 25-26 ▶） */
export default function NbaLeagueStatsSeasonNav({
  seasonKey,
  onSeasonChange,
  className,
}: Props) {
  const nav = nbaLeagueStatsSeasonNavState(seasonKey);

  return (
    <div
      className={[
        "flex items-center justify-center gap-2",
        className ?? "",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label="Older season"
        disabled={!nav.canGoOlder}
        onClick={() => {
          if (nav.olderKey) onSeasonChange(nav.olderKey);
        }}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[2px] border transition-opacity",
          nav.canGoOlder
            ? "border-[#00F5FF]/45 text-[#00F5FF]"
            : "border-white/15 text-white/25 opacity-40",
        ].join(" ")}
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>
      <span
        className={[
          nameOxanium.className,
          "min-w-[4.5rem] text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#00F5FF]",
        ].join(" ")}
      >
        {nav.label}
      </span>
      <button
        type="button"
        aria-label="Newer season"
        disabled={!nav.canGoNewer}
        onClick={() => {
          if (nav.newerKey) onSeasonChange(nav.newerKey);
        }}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[2px] border transition-opacity",
          nav.canGoNewer
            ? "border-[#00F5FF]/45 text-[#00F5FF]"
            : "border-white/15 text-white/25 opacity-40",
        ].join(" ")}
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
