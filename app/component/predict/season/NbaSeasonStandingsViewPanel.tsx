"use client";

import { Fragment } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { NBA_STANDINGS_RANKS } from "@/lib/nba/nbaConferenceTeams";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";
import type {
  NbaSeasonStandingsPrediction,
  NbaStandingsRank,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";

type Props = {
  prediction: NbaSeasonStandingsPrediction;
  official?: NbaSeasonStandingsPrediction | null;
  className?: string;
};

type Band = "straight" | "playin" | "out";

const COL_DIVIDER = "border-r border-white/[0.1]";

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

function ResultMark({ hit }: { hit: boolean | null }) {
  if (hit == null) return null;
  return (
    <span
      className={[
        nameOxanium.className,
        "shrink-0 text-[7px] font-extrabold uppercase tracking-[0.06em]",
        hit ? "text-[#2DFF6E]/85" : "text-[#FF8AB4]/70",
      ].join(" ")}
    >
      {hit ? "HIT" : "MISS"}
    </span>
  );
}

function TeamCell({
  teamId,
  officialTeamId,
}: {
  teamId: string | null | undefined;
  officialTeamId?: string | null;
}) {
  const hit =
    teamId && officialTeamId != null && officialTeamId !== ""
      ? officialTeamId === teamId
      : null;

  if (!teamId) {
    return <span className="text-[12px] text-white/25">—</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <HalftoneJerseyMark
        accent={getTeamJerseyPrimaryColor("nba", teamId)}
        accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
        className="h-6 w-6 shrink-0"
        glow="none"
      />
      <p
        className={[
          nameOxanium.className,
          "min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase tracking-[0.02em] text-white",
        ].join(" ")}
      >
        {getNbaTeamNicknameById(teamId)}
      </p>
      <ResultMark hit={hit} />
    </div>
  );
}

/** 提出済み順位予想 — 順位 | West | East（列区切りあり） */
export default function NbaSeasonStandingsViewPanel({
  prediction,
  official = null,
  className,
}: Props) {
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

      <div className="overflow-hidden rounded-[2px] border border-cyan-300/20 bg-black">
        <div
          className={[
            "grid border-b border-white/[0.1]",
            "grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)]",
          ].join(" ")}
        >
          <div className={["py-2", COL_DIVIDER].join(" ")} aria-hidden />
          <div
            className={[
              nameOxanium.className,
              "py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-300/80",
              COL_DIVIDER,
            ].join(" ")}
          >
            West
          </div>
          <div
            className={[
              nameOxanium.className,
              "py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-300/80",
            ].join(" ")}
          >
            East
          </div>

          {Array.from({ length: NBA_STANDINGS_RANKS }, (_, i) => {
            const rank = (i + 1) as NbaStandingsRank;
            const band = bandForRank(rank);
            const accent = bandAccent(band);
            const isLast = rank === NBA_STANDINGS_RANKS;
            const rowBorder = !isLast ? "border-b border-white/[0.06]" : "";

            return (
              <Fragment key={rank}>
                <div
                  className={[
                    "relative flex items-center justify-center py-2",
                    COL_DIVIDER,
                    rowBorder,
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 top-0 w-[3px]"
                    style={{ background: accent.bar }}
                  />
                  <span
                    className={[
                      nameOxanium.className,
                      "text-[12px] font-black tabular-nums tracking-wide",
                      accent.rank,
                    ].join(" ")}
                  >
                    {rank}
                  </span>
                </div>

                <div className={["px-2 py-2", COL_DIVIDER, rowBorder].join(" ")}>
                  <TeamCell
                    teamId={prediction.west[rank]}
                    officialTeamId={official?.west[rank]}
                  />
                </div>

                <div className={["px-2 py-2", rowBorder].join(" ")}>
                  <TeamCell
                    teamId={prediction.east[rank]}
                    officialTeamId={official?.east[rank]}
                  />
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
