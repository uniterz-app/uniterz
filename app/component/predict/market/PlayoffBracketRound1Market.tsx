"use client";

import { useEffect, useMemo, useState } from "react";
import Jersey from "@/app/component/games/icons/Jersey";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getPlayoffBracketConfig,
  buildRound1Series,
} from "@/lib/playoff-bracket-config";
import type { SeriesId } from "@/lib/playoff-bracket";
import PlayoffBracketSeriesGamesTab from "./PlayoffBracketSeriesGamesTab";

type MarketCountMap = Record<string, number>;

type Round1SeriesMarketMap = Record<
  string,
  {
    winnerPickCounts: MarketCountMap;
    gamesPickCounts: MarketCountMap;
  }
>;

type Team = {
  code: string;
  seed: number;
};

type Props = {
  season: string;
  markets: Round1SeriesMarketMap;
};

type SeriesItem = {
  id: SeriesId;
  teams: [Team, Team];
};

const NBA_TEAM_ID_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_SHORT)
    .filter(([teamId]) => teamId.startsWith("nba-"))
    .map(([teamId, short]) => [short, teamId])
);

function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r} ${g} ${bl})`;
}

function buildBarGradient(baseHex: string) {
  const light = mixHex("#ffffff", baseHex, 0.78);
  const dark = mixHex("#000000", baseHex, 0.58);
  return `linear-gradient(90deg, ${light} 0%, ${baseHex} 55%, ${dark} 100%)`;
}

function ConferenceHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex flex-col items-center md:mb-5">
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 22,
          letterSpacing: "0.16em",
          color: "#f8fbff",
        }}
        className="md:text-[26px]"
      >
        {title}
      </div>

      <div
        style={{
          width: 220,
          height: 1,
          marginTop: 4,
          background:
            "linear-gradient(90deg, transparent, #5f7cff, transparent)",
          opacity: 0.6,
        }}
        className="md:w-[260px]"
      />
    </div>
  );
}

function getPctTextClass(
  myPct: number,
  otherPct: number,
  hasData: boolean
): string {
  if (!hasData) return "text-white/45";
  if (myPct === otherPct) return "text-white";
  return myPct > otherPct ? "text-yellow-300" : "text-white/70";
}

function SeriesCard({
  series,
  market,
  index,
}: {
  series: SeriesItem;
  market?: {
    winnerPickCounts: MarketCountMap;
    gamesPickCounts: MarketCountMap;
  };
  index: number;
}) {
  const [showGames, setShowGames] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnimateBars(true);
    }, 120 + index * 220);

    return () => window.clearTimeout(timer);
  }, [index]);

  const teamA = series.teams[0].code;
  const teamB = series.teams[1].code;

  const winnerCounts = market?.winnerPickCounts ?? {};
  const gamesCounts = market?.gamesPickCounts ?? {};

  const countA = Number(winnerCounts[teamA] ?? 0);
  const countB = Number(winnerCounts[teamB] ?? 0);
  const total = countA + countB;

  const teamAPct = percent(countA, total);
  const teamBPct = percent(countB, total);

  const colorA =
    getTeamPrimaryColor("nba", NBA_TEAM_ID_BY_CODE[teamA]) ?? "#3b82f6";
  const colorB =
    getTeamPrimaryColor("nba", NBA_TEAM_ID_BY_CODE[teamB]) ?? "#ef4444";

  const pctClassA = getPctTextClass(teamAPct, teamBPct, total > 0);
  const pctClassB = getPctTextClass(teamBPct, teamAPct, total > 0);

  return (
    <div
      className="
        w-full rounded-2xl border border-white/15 bg-[#050814]/80
        px-3 py-3 text-left text-white
        md:rounded-3xl md:px-4 md:py-4
      "
    >
      <div className="grid grid-cols-3 items-center">
        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] text-white/50 md:text-[11px]">
            #{series.teams[0].seed}
          </div>
          <Jersey
            className="h-8 w-8 md:h-10 md:w-10"
            fill={colorA}
            stroke="#fff"
          />
          <div className="mt-1 text-xs font-bold md:text-sm">{teamA}</div>
        </div>

        <div className="text-center text-sm font-bold md:text-base">VS</div>

        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] text-white/50 md:text-[11px]">
            #{series.teams[1].seed}
          </div>
          <Jersey
            className="h-8 w-8 md:h-10 md:w-10"
            fill={colorB}
            stroke="#fff"
          />
          <div className="mt-1 text-xs font-bold md:text-sm">{teamB}</div>
        </div>
      </div>

      <div className="mt-2 md:mt-3">
        <div className="mb-1 flex justify-between text-[10px] font-semibold md:text-xs">
          <span className={pctClassA}>
            {total > 0 ? `${teamAPct}%` : "--"}
          </span>
          <span className={pctClassB}>
            {total > 0 ? `${teamBPct}%` : "--"}
          </span>
        </div>

        <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10 md:h-2.5">
          {total > 0 ? (
            <>
              <div
                style={{
                  width: animateBars ? `${teamAPct}%` : "0%",
                  background: buildBarGradient(colorA),
                  transition: "width 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <div
                style={{
                  width: animateBars ? `${teamBPct}%` : "0%",
                  background: buildBarGradient(colorB),
                  transition: "width 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </>
          ) : (
            <div className="h-full w-full bg-white/10" />
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          onClick={() => setShowGames((v) => !v)}
          className="text-[10px] tracking-[0.2em] text-white/60 hover:text-white"
        >
          {showGames ? "HIDE DETAILS" : "DETAILS"}
        </button>
      </div>

      {showGames && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <PlayoffBracketSeriesGamesTab gamesPickCounts={gamesCounts} />
        </div>
      )}
    </div>
  );
}

export default function PlayoffBracketRound1Market({
  season,
  markets,
}: Props) {
  const { eastSeries, westSeries } = useMemo(() => {
    const config = getPlayoffBracketConfig(season);
    const { eastR1, westR1 } = buildRound1Series(config);

    return {
      eastSeries: eastR1.map((series, index) => ({
        id: `R1_E${index + 1}` as SeriesId,
        teams: series as [Team, Team],
      })),
      westSeries: westR1.map((series, index) => ({
        id: `R1_W${index + 1}` as SeriesId,
        teams: series as [Team, Team],
      })),
    };
  }, [season]);

  return (
    <div className="space-y-8 md:space-y-10">
      <section>
        <ConferenceHeader title="EASTERN CONFERENCE" />

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {eastSeries.map((series, index) => (
            <SeriesCard
              key={series.id}
              series={series}
              market={markets?.[series.id]}
              index={index}
            />
          ))}
        </div>
      </section>

      <section>
        <ConferenceHeader title="WESTERN CONFERENCE" />

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {westSeries.map((series, index) => (
            <SeriesCard
              key={series.id}
              series={series}
              market={markets?.[series.id]}
              index={index + eastSeries.length}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
