"use client";

import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

type Props = {
  phase: RankingPhase;
  onChange: (phase: RankingPhase) => void;
  isMobile?: boolean;
};

export default function RankingPhaseTabs({
  phase,
  onChange,
  isMobile = false,
}: Props) {
  const teamNameFont = bracketMarketTeamTypography(isMobile);
  const containerClass = isMobile
    ? "grid grid-cols-2 items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1"
    : "grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1";
  const baseBtnClass = isMobile
    ? "rounded-xl text-[12px] font-bold uppercase [-webkit-tap-highlight-color:transparent] transition-[color,border-color,box-shadow,text-shadow] duration-500 ease-in-out"
    : "h-9 rounded-xl text-sm font-bold uppercase [-webkit-tap-highlight-color:transparent] transition-[color,border-color,box-shadow,text-shadow] duration-500 ease-in-out";
  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={() => onChange("play_in")}
        className={[
          baseBtnClass,
          phase === "play_in"
            ? isMobile
              ? "h-8 border border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-none hover:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] focus-visible:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] active:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)]"
              : "border border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-none hover:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] focus-visible:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] active:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)]"
            : isMobile
              ? "h-[30px] border border-[#ffffff80] bg-transparent text-[#ffffff80] shadow-none hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)]"
              : "border border-[#ffffff80] bg-transparent text-[#ffffff80] shadow-none hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)]",
        ].join(" ")}
        style={teamNameFont}
      >
        Play-In
      </button>
      <button
        type="button"
        onClick={() => onChange("playoffs")}
        className={[
          baseBtnClass,
          phase === "playoffs"
            ? isMobile
              ? "h-8 border border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-none hover:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] focus-visible:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] active:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)]"
              : "border border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-none hover:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] focus-visible:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)] active:shadow-[0_0_10px_rgba(103,232,249,0.55),0_0_26px_rgba(103,232,249,0.28)]"
            : isMobile
              ? "h-[30px] border border-[#ffffff80] bg-transparent text-[#ffffff80] shadow-none hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)]"
              : "border border-[#ffffff80] bg-transparent text-[#ffffff80] shadow-none hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)]",
        ].join(" ")}
        style={teamNameFont}
      >
        Playoffs
      </button>
    </div>
  );
}
