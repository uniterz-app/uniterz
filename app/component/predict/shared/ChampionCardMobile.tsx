"use client";

import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { Crown } from "lucide-react";

type Props = {
  teamId?: string | null;
  league?: League;
};

export default function ChampionCard({
  teamId,
  league = "nba",
}: Props) {

  const color = getTeamPrimaryColor(league, teamId);
  const name = teamId ? TEAM_SHORT[teamId] : "TBD";

  return (
    <div className="relative flex flex-col items-center">

      {/* Champion label */}
      <div
        className="absolute -top-5 flex items-center gap-1"
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 14,
          letterSpacing: "0.08em",
          color: "#ffd84d",
          textShadow: `
            0 0 4px rgba(255,216,77,0.9),
            0 0 12px rgba(255,216,77,0.6)
          `
        }}
      >
        <Crown size={14} strokeWidth={2.4} />
        CHAMPION
      </div>

      {/* card */}
      <div
        className="flex items-center justify-center border-2"
        style={{
          width: 120,
          height: 54,
          background: "#071122",
          borderColor: color,
          boxShadow: `
            0 0 10px ${color},
            0 0 24px ${color}
          `
        }}
      >
        <div
style={{
  fontFamily: "Bebas Neue",
  fontSize: 30,
  letterSpacing: "0.08em",
  color: "#ffd84d",
}}
        >
          {name}
        </div>
      </div>

    </div>
  );
}