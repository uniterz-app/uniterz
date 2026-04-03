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

const SCALE = 1.6;

const CARD_W = 120 * SCALE;
const CARD_H = 54 * SCALE;

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
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderColor: hit.border,
        background: "rgba(6, 12, 24, 0.94)",
        boxShadow: `
          inset 0 0 6px ${hit.soft},
          0 0 8px ${hit.glow},
          0 0 14px ${hit.glow}
        `,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={13}
        height={13}
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
            filter: `drop-shadow(0 0 5px ${hit.glow})`,
          }}
        />
      </svg>
    </div>
  );
}

export default function ChampionCardWeb({
  teamId,
  league = "nba",
  hitStatus = "none",
}: Props) {
  const color = getTeamPrimaryColor(league, teamId);
  const name = getShortName(teamId);

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: CARD_W }}
    >
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "100%",
          marginBottom: 6 * SCALE,
          gap: 2 * SCALE,
        }}
      >
        <Crown size={14 * SCALE} strokeWidth={2.4} />
        <div
          style={{
            fontFamily: "Oswald, Bebas Neue, sans-serif",
            fontSize: 13.5 * SCALE,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#ffd84d",
            lineHeight: 1,
            textShadow: `
              0 0 ${3 * SCALE}px rgba(255,216,77,0.72),
              0 0 ${8 * SCALE}px rgba(255,216,77,0.32)
            `,
          }}
        >
          CHAMPION
        </div>
      </div>

      <div
        className="relative flex items-center justify-center border-2"
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
        {hitStatus !== "none" && <HitCheck hitStatus={hitStatus} />}

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