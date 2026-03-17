"use client";

type Props = {
  season: string;
  totalEntries: number;
};

export default function PlayoffBracketMarketHeader({
  season,
  totalEntries,
}: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-[#050814]/80 px-6 py-6 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)]">

      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(80,120,255,0.25),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-1">

        {/* UNITERZ */}
        <div
          className="text-[25px] md:text-[36px] tracking-[0.35em] text-white/60"
          style={{ fontFamily: "Bebas Neue" }}
        >
          UNITERZ
        </div>

        {/* PLAYOFF TITLE */}
        <div
          className="text-[24px] md:text-[34px] font-bold tracking-[0.08em]"
          style={{ fontFamily: "Bebas Neue" }}
        >
          {season} NBA PLAYOFF
        </div>

        {/* cyber line */}
        <div className="relative w-full max-w-md md:max-w-xl">
          <div
            className="
              h-[2px] w-full
              bg-gradient-to-r
              from-transparent
              via-cyan-400
              to-transparent
              opacity-90
            "
          />
          <div
            className="
              absolute inset-0
              blur-sm
              bg-gradient-to-r
              from-transparent
              via-cyan-400
              to-transparent
              opacity-60
            "
          />
        </div>

        {/* bracket count */}
        <div className="mt-2 flex items-baseline gap-2">
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