// app/component/games/LiveMatchMark.tsx
"use client";

import { memo } from "react";

/** ResultCard 右上 / MatchCard 中央など、配置先に合わせたサイズ */
export type LiveMatchMarkDensity =
  | "resultMobile"
  | "resultDesktop"
  | "matchDense"
  | "matchComfortable";

type Props = {
  density: LiveMatchMarkDensity;
  isEn?: boolean;
  className?: string;
};

const WRAP_BASE = [
  "inline-flex shrink-0 items-center gap-[3px]",
  "rounded-md",
  "border border-red-300/45 bg-linear-to-r from-zinc-950 via-red-950 to-rose-600",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_0_rgba(0,0,0,0.55),0_0_20px_rgba(239,68,68,0.55)]",
  "font-black uppercase text-white",
  "[text-shadow:0_0_14px_rgba(254,202,202,0.55),0_1px_2px_rgba(0,0,0,0.92)]",
  "ring-1 ring-rose-400/30",
].join(" ");

const DENSITY_WRAP: Record<LiveMatchMarkDensity, string> = {
  resultMobile: "px-1.5 py-0.5 text-[8px] tracking-[0.14em]",
  resultDesktop:
    "px-2 py-0.5 text-[9px] tracking-[0.16em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.18em]",
  matchDense: "px-1.5 py-[3px] text-[9px] tracking-[0.14em]",
  matchComfortable: "px-2 py-0.5 text-[10px] tracking-[0.15em] md:text-[11px]",
};

const DOT_BOX: Record<LiveMatchMarkDensity, string> = {
  resultMobile: "h-1.5 w-1.5",
  resultDesktop: "h-2 w-2",
  matchDense: "h-1.5 w-1.5",
  matchComfortable: "h-2 w-2",
};

const DOT_CORE: Record<LiveMatchMarkDensity, string> = {
  resultMobile: "h-[4px] w-[4px]",
  resultDesktop: "h-[5px] w-[5px]",
  matchDense: "h-[4px] w-[4px]",
  matchComfortable: "h-[5px] w-[5px]",
};

function LiveMatchMarkImpl({ density, isEn = true, className = "" }: Props) {
  const wrap = [WRAP_BASE, DENSITY_WRAP[density], className].filter(Boolean).join(" ");
  const dotBox = DOT_BOX[density];
  const dotCore = DOT_CORE[density];
  return (
    <span className={wrap} aria-label={isEn ? "Live" : "ライブ中"}>
      <span
        className={`relative flex shrink-0 items-center justify-center ${dotBox}`}
        aria-hidden
      >
        <span className="motion-reduce:animate-none absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300/55" />
        <span
          className={`relative rounded-full bg-white ${dotCore} shadow-[0_0_8px_rgba(255,255,255,0.95)] ring-1 ring-red-400/90`}
        />
      </span>
      <span>LIVE</span>
    </span>
  );
}

export const LiveMatchMark = memo(LiveMatchMarkImpl);
LiveMatchMark.displayName = "LiveMatchMark";
