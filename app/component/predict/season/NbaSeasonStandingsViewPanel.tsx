"use client";

import { useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { NBA_STANDINGS_RANKS } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";
import type {
  NbaConferenceStandingsPicks,
  NbaSeasonStandingsPrediction,
  NbaStandingsRank,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";

type Props = {
  prediction: NbaSeasonStandingsPrediction;
  /** 将来: 公式順位。あると的中表示用に使える */
  official?: NbaSeasonStandingsPrediction | null;
  className?: string;
};

type Band = "straight" | "playin" | "out";

function bandForRank(rank: NbaStandingsRank): Band {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function bandAccent(band: Band): { bar: string; rank: string } {
  if (band === "straight") {
    return { bar: "#00E5FF", rank: "text-white" };
  }
  if (band === "playin") {
    return { bar: "#2DFF6E", rank: "text-[#2DFF6E]" };
  }
  return { bar: "rgba(255,255,255,0.18)", rank: "text-white/35" };
}

function fullName(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return full.toUpperCase();
  return (TEAM_SHORT[teamId] ?? teamId).toUpperCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ResultMark({ hit }: { hit: boolean | null }) {
  if (hit == null) return null;
  return (
    <span
      className={[
        nameOxanium.className,
        "shrink-0 text-[8px] font-extrabold uppercase tracking-[0.1em]",
        hit ? "text-[#2DFF6E]/85" : "text-[#FF8AB4]/70",
      ].join(" ")}
    >
      {hit ? "HIT" : "MISS"}
    </span>
  );
}

function ViewRow({
  rank,
  teamId,
  officialTeamId,
  isLast,
}: {
  rank: NbaStandingsRank;
  teamId: string | null | undefined;
  officialTeamId?: string | null;
  isLast: boolean;
}) {
  const band = bandForRank(rank);
  const accent = bandAccent(band);
  const hit =
    teamId && officialTeamId != null && officialTeamId !== ""
      ? officialTeamId === teamId
      : null;

  const primary = teamId
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", teamId))
    : "#00F5FF";

  return (
    <div
      className={[
        "relative flex items-center gap-2 py-[5px] pl-2.5 pr-2",
        !isLast ? "border-b border-white/[0.06]" : "",
        !teamId ? "opacity-50" : "",
      ].join(" ")}
      style={
        teamId
          ? {
              background: `linear-gradient(90deg, ${hexToRgba(primary, 0.07)} 0%, transparent 70%)`,
            }
          : undefined
      }
    >
      {/* 帯アクセント（1–6 / 7–10 / 11–15） */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: accent.bar }}
      />

      <span
        className={[
          nameOxanium.className,
          "w-5 shrink-0 text-[11px] font-black tabular-nums tracking-wide",
          accent.rank,
        ].join(" ")}
      >
        {rank}
      </span>

      {teamId ? (
        <>
          <HalftoneJerseyMark
            accent={getTeamJerseyPrimaryColor("nba", teamId)}
            accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
            className="h-6 w-6 shrink-0"
            glow="none"
          />
          <p
            className={[
              nameOxanium.className,
              "min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-[0.03em] text-white",
            ].join(" ")}
          >
            {fullName(teamId)}
          </p>
          <ResultMark hit={hit} />
        </>
      ) : (
        <span className="text-[10px] text-white/25">—</span>
      )}
    </div>
  );
}

function ConferenceList({
  picks,
  officialPicks,
}: {
  picks: NbaConferenceStandingsPicks;
  officialPicks?: NbaConferenceStandingsPicks | null;
}) {
  return (
    <div className="overflow-hidden rounded-[2px] border border-cyan-300/20 bg-[rgba(4,9,16,0.97)]">
      {Array.from({ length: NBA_STANDINGS_RANKS }, (_, i) => {
        const rank = (i + 1) as NbaStandingsRank;
        return (
          <ViewRow
            key={rank}
            rank={rank}
            teamId={picks[rank]}
            officialTeamId={officialPicks?.[rank]}
            isLast={rank === NBA_STANDINGS_RANKS}
          />
        );
      })}
    </div>
  );
}

/** 提出済み順位予想 — YOUR STANDING + 帯サイドライン（密着リスト・単一カード） */
export default function NbaSeasonStandingsViewPanel({
  prediction,
  official = null,
  className,
}: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");

  return (
    <div className={["relative w-full", className].filter(Boolean).join(" ")}>
      <header className="mb-3 text-center">
        <h2
          className={[
            nameOxanium.className,
            "text-[14px] font-extrabold uppercase tracking-[0.2em] text-white",
          ].join(" ")}
        >
          Your standing
        </h2>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35",
          ].join(" ")}
        >
          {prediction.season}
        </p>
      </header>

      <div className="mb-2.5">
        <CyberSlantedTabBar fill aria-label="Conference">
          <CyberSlantedTab
            role="tab"
            label="EAST"
            active={conference === "east"}
            onClick={() => setConference("east")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="WEST"
            active={conference === "west"}
            onClick={() => setConference("west")}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      <ConferenceList
        picks={conference === "east" ? prediction.east : prediction.west}
        officialPicks={
          official
            ? conference === "east"
              ? official.east
              : official.west
            : null
        }
      />
    </div>
  );
}
