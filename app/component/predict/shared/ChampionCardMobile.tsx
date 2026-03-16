"use client";

import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { Crown } from "lucide-react";

export type ChampionCardHitStatus = "none" | "winner" | "winnerAndGames";

type Props = {
  teamId?: string | null;
  league?: League;
  hitStatus?: ChampionCardHitStatus;
};

function getShortName(teamId?: string | null) {
  if (!teamId) return "TBD";
  return TEAM_SHORT[teamId] ?? teamId.toUpperCase();
}

function getHitColors(hitStatus: ChampionCardHitStatus) {
  if (hitStatus === "winnerAndGames") {
    return {
      color: "#36e6ff",
      border: "rgba(54, 230, 255, 0.95)",
      glow: "rgba(54, 230, 255, 0.58)",
      soft: "rgba(54, 230, 255, 0.18)",
    };
  }

  if (hitStatus === "winner") {
    return {
      color: "#ff9f2f",
      border: "rgba(255, 159, 47, 0.95)",
      glow: "rgba(255, 159, 47, 0.52)",
      soft: "rgba(255, 159, 47, 0.16)",
    };
  }

  return null;
}

function HitCheck({
  hitStatus,
}: {
  hitStatus: Exclude<ChampionCardHitStatus, "none">;
}) {
  const hit = getHitColors(hitStatus);
  if (!hit) return null;

  return (
    <div
      className="absolute flex items-center justify-center rounded-full border"
      style={{
        top: 3,
        right: 3,
        width: 18,
        height: 18,
        borderColor: hit.border,
        background: "rgba(6, 12, 24, 0.94)",
        boxShadow: `
          inset 0 0 4px ${hit.soft},
          0 0 5px ${hit.glow},
          0 0 9px ${hit.glow}
        `,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={10}
        height={10}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12.5L9.2 16.5L19 7.5"
          stroke={hit.color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 3px ${hit.glow})`,
          }}
        />
      </svg>
    </div>
  );
}

export default function ChampionCard({
  teamId,
  league = "nba",
  hitStatus = "none",
}: Props) {
  const color = getTeamPrimaryColor(league, teamId);
  const name = getShortName(teamId);

  return (
    <div className="relative flex flex-col items-center">
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
          `,
        }}
      >
        <Crown size={14} strokeWidth={2.4} />
        CHAMPION
      </div>

      <div
        className="relative flex items-center justify-center border-2"
        style={{
          width: 120,
          height: 54,
          background: "#071122",
          borderColor: color,
          boxShadow: `
            0 0 10px ${color},
            0 0 24px ${color}
          `,
        }}
      >
        {hitStatus !== "none" && <HitCheck hitStatus={hitStatus} />}

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