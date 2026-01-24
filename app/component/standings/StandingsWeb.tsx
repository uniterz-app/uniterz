const TEAM_NAME_MAP: Record<string, string> = {
  "nba-celtics": "Celtics",
  "nba-bucks": "Bucks",
  "nba-nuggets": "Nuggets",
  "nba-thunder": "Thunder",
  // 必要な分だけでOK
};

"use client";

import { useStandings } from "./useStandings";

export default function StandingsWeb() {
  const { east, west } = useStandings();

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <h2 className="text-sm font-semibold opacity-70 mb-2">EAST</h2>
      {east.map((r) => (
        <div key={r.rank} className="grid grid-cols-[40px_1fr_80px_80px] py-2">
          <span>{r.rank}</span>
          <span>{TEAM_NAME_MAP[r.teamId] ?? r.teamId}</span>

          <span className="text-right">
            {r.win}-{r.lose}
          </span>
          <span className="text-right opacity-70">{r.winPct}</span>
        </div>
      ))}

      <h2 className="text-sm font-semibold opacity-70 mt-8 mb-2">WEST</h2>
      {west.map((r) => (
        <div key={r.rank} className="grid grid-cols-[40px_1fr_80px_80px] py-2">
          <span>{r.rank}</span>
          <span>{TEAM_NAME_MAP[r.teamId] ?? r.teamId}</span>

          <span className="text-right">
            {r.win}-{r.lose}
          </span>
          <span className="text-right opacity-70">{r.winPct}</span>
        </div>
      ))}
    </div>
  );
}

