"use client";

import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { Crown } from "lucide-react";

type Props = {
  teamId?: string | null;
  league?: League;
};

const SCALE = 1.6;

const CARD_W = 120 * SCALE;
const CARD_H = 54 * SCALE;

export default function ChampionCardWeb({
  teamId,
  league = "nba",
}: Props) {
  const color = getTeamPrimaryColor(league, teamId);
  const name = teamId ? TEAM_SHORT[teamId] : "TBD";

  return (
    <div className="relative flex flex-col items-center">
      {/* Champion label */}
      <div
        className="absolute flex items-center gap-2"
        style={{
          top: -16 * SCALE,
          fontFamily: "Oswald, Bebas Neue, sans-serif",
          fontSize: 12 * SCALE,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "#ffd84d",
          textShadow: `
            0 0 ${3 * SCALE}px rgba(255,216,77,0.72),
            0 0 ${8 * SCALE}px rgba(255,216,77,0.32)
          `,
        }}
      >
        <Crown size={12 * SCALE} strokeWidth={2.2} />
        CHAMPION
      </div>

      {/* card */}
      <div
        className="flex items-center justify-center border-2"
        style={{
          width: CARD_W,
          height: CARD_H,
          background: "#071122",
          borderColor: color,
          boxShadow: `
            0 0 ${8 * SCALE}px rgba(255,255,255,0.03),
            0 0 ${16 * SCALE}px ${color}
          `,
        }}
      >
        <div
          style={{
            fontFamily: "Oswald, Bebas Neue, sans-serif",
            fontSize: 24 * SCALE,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "#ffd84d",
            textShadow: `
              0 0 ${4 * SCALE}px rgba(255,216,77,0.65),
              0 0 ${10 * SCALE}px rgba(255,216,77,0.22)
            `,
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}