const TEAM_NAME_MAP: Record<string, string> = {
  "nba-celtics": "Celtics",
  "nba-bucks": "Bucks",
  "nba-nuggets": "Nuggets",
  "nba-thunder": "Thunder",
  // 必要な分だけでOK
};

"use client";

import { useStandings } from "./useStandings";
import type { StandingRow } from "./useStandings";

function rowGradient(rank: number) {
  if (rank <= 6) {
    const opacity = 0.22 - (rank - 1) * 0.02;
    return `bg-emerald-500/${Math.round(opacity * 100)} border-l-4 border-emerald-500`;
  }
  if (rank <= 10) {
    const opacity = 0.18 - (rank - 7) * 0.02;
    return `bg-amber-500/${Math.round(opacity * 100)} border-l-4 border-amber-500`;
  }
  return "border-l-4 border-transparent";
}

export default function StandingsMobile() {
  const { east, west } = useStandings();


  return (
    <div className="p-4 text-white space-y-2">
      {east.map((r: StandingRow) => (
        <div
          key={r.rank}
          className={`flex justify-between pb-1 pl-2 ${rowGradient(r.rank)}`}
        >
          <span className={r.rank === 1 ? "font-bold" : ""}>{r.rank}</span>
          <span>{TEAM_NAME_MAP[r.teamId] ?? r.teamId}</span>

          <span>{r.win}-{r.lose}</span>
        </div>
      ))}
    </div>
  );
}
