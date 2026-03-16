"use client";

import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";

type Side = "left" | "right";

export type BracketCardHitStatus = "none" | "winner" | "winnerAndGames";

export type BracketCardProps = {
  teamId?: string | null;
  wins?: number | string;
  league?: League;
  side?: Side;
  className?: string;
  hitStatus?: BracketCardHitStatus;
};

const SCALE = 0.375;

const CARD_W = 160 * SCALE;
const CARD_H = 72 * SCALE;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();

  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }

  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  }

  return { r: 255, g: 255, b: 255 };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lighten(hex: string, amount = 0.18) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function getTeamUiColor(league: League, teamId?: string | null) {
  const primary = getTeamPrimaryColor(league, teamId);
  const border = lighten(primary, 0.08);
  const glow = rgba(primary, 0.92);
  const soft = rgba(primary, 0.22);
  const text = "#f8fbff";

  return { primary, border, glow, soft, text };
}

function getShortName(teamId?: string | null) {
  if (!teamId) return "TBD";
  return TEAM_SHORT[teamId] ?? teamId.toUpperCase();
}

function isFourWins(wins?: number | string) {
  if (wins === 4) return true;
  if (typeof wins === "string" && wins.trim() === "4") return true;
  return false;
}

function getHitColors(hitStatus: BracketCardHitStatus) {
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
  hitStatus: Exclude<BracketCardHitStatus, "none">;
}) {
  const hit = getHitColors(hitStatus);
  if (!hit) return null;

  return (
    <div
      className="absolute flex items-center justify-center rounded-full border"
      style={{
        top: 3 * SCALE,
        right: 3 * SCALE,
        width: 18 * SCALE,
        height: 18 * SCALE,
        borderColor: hit.border,
        background: "rgba(6, 12, 24, 0.94)",
        boxShadow: `
          inset 0 0 ${4 * SCALE}px ${hit.soft},
          0 0 ${5 * SCALE}px ${hit.glow},
          0 0 ${9 * SCALE}px ${hit.glow}
        `,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={10 * SCALE}
        height={10 * SCALE}
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
            filter: `drop-shadow(0 0 ${3 * SCALE}px ${hit.glow})`,
          }}
        />
      </svg>
    </div>
  );
}

export default function BracketCard({
  teamId,
  wins,
  league = "nba",
  className = "",
  hitStatus = "none",
}: BracketCardProps) {
  const c = getTeamUiColor(league, teamId);
  const win4 = isFourWins(wins);

  return (
    <div
      className={`relative flex items-center justify-center border-2 bg-[#071122]/90 ${className}`}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 0,
        borderColor: c.border,
        color: c.text,
        boxShadow: win4
          ? `
            inset 0 0 ${18 * SCALE}px ${c.soft},
            0 0 ${8 * SCALE}px ${c.glow},
            0 0 ${18 * SCALE}px ${c.glow},
            0 0 ${34 * SCALE}px ${c.soft}
          `
          : `
            inset 0 0 ${10 * SCALE}px ${c.soft}
          `,
      }}
    >
      {hitStatus !== "none" && <HitCheck hitStatus={hitStatus} />}

      <div
        className="flex items-center justify-center leading-none"
        style={{
          gap: 6 * SCALE,
        }}
      >
        <div
          className="font-bold tracking-[0.08em]"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: 38 * SCALE,
          }}
        >
          {getShortName(teamId)}
        </div>

        <div
          className="font-bold"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: 30 * SCALE,
            opacity: 0.85,
          }}
        >
          :
        </div>

        <div
          className="leading-none"
          style={{
            fontFamily: "Alfa Slab One, serif",
            fontSize: 30 * SCALE,
            color: win4 ? "#ffd84d" : c.text,
            textShadow: win4
              ? `
                0 0 ${3 * SCALE}px rgba(255, 216, 77, 0.9),
                0 0 ${8 * SCALE}px rgba(255, 216, 77, 0.55)
              `
              : `
                0 0 ${3 * SCALE}px ${c.glow},
                0 0 ${8 * SCALE}px ${c.glow}
              `,
          }}
        >
          {wins ?? ""}
        </div>
      </div>
    </div>
  );
}