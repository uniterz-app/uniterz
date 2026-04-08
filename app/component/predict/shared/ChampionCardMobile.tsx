"use client";

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { Crown } from "lucide-react";

export type ChampionCardHitStatus = "none" | "winner" | "winnerAndGames";

type Props = {
  teamId?: string | null;
  league?: League;
  hitStatus?: ChampionCardHitStatus;
  rouletteTeamIds?: string[];
};

function getShortName(teamId?: string | null) {
  if (!teamId) return "TBD";
  const raw = String(teamId).trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, "-");
  return TEAM_SHORT[raw] ?? TEAM_SHORT[normalized] ?? raw.toUpperCase();
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
  rouletteTeamIds = [],
}: Props) {
  const color = getTeamPrimaryColor(league, teamId);
  const [displayTeamId, setDisplayTeamId] = useState<string | null | undefined>(
    teamId
  );

  const roulettePool = useMemo(() => {
    const unique = Array.from(
      new Set(
        rouletteTeamIds
          .map((id) => String(id ?? "").trim().toUpperCase())
          .filter((id) => id.length > 0)
      )
    );
    return unique;
  }, [rouletteTeamIds]);

  useEffect(() => {
    const target = String(teamId ?? "").trim().toUpperCase();
    if (!target || roulettePool.length === 0) {
      setDisplayTeamId(teamId);
      return;
    }

    const order = [...roulettePool].sort(() => Math.random() - 0.5);
    let idx = 0;
    setDisplayTeamId(order[0] ?? target);

    const id = window.setInterval(() => {
      idx += 1;
      if (idx < order.length) {
        setDisplayTeamId(order[idx]);
        return;
      }
      window.clearInterval(id);
      setDisplayTeamId(target);
    }, 72);

    return () => window.clearInterval(id);
  }, [teamId, roulettePool]);

  const name = getShortName(displayTeamId ?? teamId);

  return (
    <div className="relative flex w-[120px] flex-col items-center">
      <div
        className="absolute flex flex-col items-center gap-0.5"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "100%",
          marginBottom: 5,
        }}
      >
        <Crown size={17} strokeWidth={2.4} />
        <div
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: 16,
            letterSpacing: "0.08em",
            color: "#ffd84d",
            lineHeight: 1,
            textShadow: `
              0 0 4px rgba(255,216,77,0.9),
              0 0 12px rgba(255,216,77,0.6)
            `,
          }}
        >
          CHAMPION
        </div>
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