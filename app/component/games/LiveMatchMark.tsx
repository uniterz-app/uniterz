// app/component/games/LiveMatchMark.tsx
"use client";

import { memo } from "react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

/** ResultCard 右上 / MatchCard 中央など、配置先に合わせたサイズ */
export type LiveMatchMarkDensity =
  | "resultMobile"
  | "resultDesktop"
  | "matchDense"
  | "matchComfortable";

type Props = {
  density: LiveMatchMarkDensity;
  language?: Language;
  className?: string;
};

const WRAP_BASE = [
  "live-match-mark--pulse inline-flex shrink-0 items-center justify-center rounded-md",
  "border border-red-500/50 bg-red-600 font-bold uppercase tracking-wide text-white shadow-sm",
].join(" ");

const DENSITY_WRAP: Record<LiveMatchMarkDensity, string> = {
  resultMobile: "px-1.5 py-0.5 text-[8px]",
  resultDesktop: "px-2 py-0.5 text-[9px] sm:px-2.5 sm:text-[10px]",
  matchDense: "px-1.5 py-[3px] text-[9px]",
  matchComfortable: "px-2 py-0.5 text-[10px] md:text-[11px]",
};

function LiveMatchMarkImpl({ density, language = "en", className = "" }: Props) {
  const m = t(language);
  const wrap = [WRAP_BASE, DENSITY_WRAP[density], className].filter(Boolean).join(" ");
  return (
    <span className={wrap} aria-label={m.games.liveAriaLabel}>
      LIVE
    </span>
  );
}

export const LiveMatchMark = memo(LiveMatchMarkImpl);
LiveMatchMark.displayName = "LiveMatchMark";
