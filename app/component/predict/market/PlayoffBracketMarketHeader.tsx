"use client";

import { nameBebas } from "@/lib/fonts";

type Props = {
  season: string;
  totalEntries: number;
};

export default function PlayoffBracketMarketHeader({
  season,
  totalEntries,
}: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-[#050814]/80 px-6 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)]">

      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(80,120,255,0.25),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-1">

        {/* PLAYOFF TITLE */}
        <h1
          className={[
            "text-[36px] leading-none tracking-[0.04em]",
            nameBebas.className,
          ].join(" ")}
          style={{
            color: "#ffffff",
            textShadow:
              "0 0 8px rgba(255,255,255,0.35), 0 0 18px rgba(255,255,255,0.2), 0 0 34px rgba(255,255,255,0.1)",
          }}
        >
          {season} NBA PLAYOFF
        </h1>

        {/* bracket count */}
        <div className="mt-0 flex items-baseline gap-2">
          <span className="text-[12px] md:text-[14px] tracking-[0.25em] text-white/50">
            BRACKETS
          </span>

          <span className="text-3xl md:text-5xl font-black tabular-nums text-cyan-300">
            {totalEntries}
          </span>
        </div>
      </div>
    </header>
  );
}