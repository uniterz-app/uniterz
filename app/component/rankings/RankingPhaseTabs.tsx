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
    ? "rounded-xl text-[12px] font-bold uppercase transition-all"
    : "h-9 rounded-xl text-sm font-bold uppercase transition";
  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={() => onChange("play_in")}
        className={[
          baseBtnClass,
          phase === "play_in"
            ? isMobile
              ? "h-8 bg-cyan-300/20 text-cyan-100 border border-cyan-300/40"
              : "bg-cyan-300/20 text-cyan-100 border border-cyan-300/40"
            : isMobile
              ? "h-[30px] text-white/70 hover:text-white border border-transparent"
              : "text-white/70 hover:text-white",
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
              ? "h-8 bg-cyan-300/20 text-cyan-100 border border-cyan-300/40"
              : "bg-cyan-300/20 text-cyan-100 border border-cyan-300/40"
            : isMobile
              ? "h-[30px] text-white/70 hover:text-white border border-transparent"
              : "text-white/70 hover:text-white",
        ].join(" ")}
        style={teamNameFont}
      >
        Playoffs
      </button>
    </div>
  );
}
