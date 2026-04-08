"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Jersey from "@/app/component/games/icons/Jersey";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getPlayoffBracketConfig,
  buildRound1Series,
} from "@/lib/playoff-bracket-config";
import type { SeriesId } from "@/lib/playoff-bracket";
import PlayoffBracketSeriesGamesTab from "./PlayoffBracketSeriesGamesTab";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";

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

const R1_SKEW_DEG = -14;

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

function teamVerticalSheen(hex: string) {
  const hi = mixHex("#ffffff", hex, 0.4);
  const lo = mixHex("#000000", hex, 0.38);
  return `linear-gradient(180deg, ${hi} 0%, ${hex} 48%, ${lo} 100%)`;
}

/** 1stラウンド用：1本のトラックをホーム／アウェイのチーム色で左右分割（リザルトバーと同じスキュー） */
function Round1DuelSplitBar({
  pctA,
  pctB,
  colorA,
  colorB,
  animateMs,
  delayMs,
}: {
  pctA: number;
  pctB: number;
  colorA: string;
  colorB: string;
  animateMs: number;
  delayMs: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const wA = inView ? pctA : 0;
  const wB = inView ? pctB : 0;

  return (
    <div
      ref={rootRef}
      className="flex min-w-0 flex-1 items-center px-1"
      style={{ transform: `skewX(${R1_SKEW_DEG}deg)` }}
      aria-hidden
    >
      <div className="flex h-[7px] min-w-0 flex-1 overflow-hidden rounded-[2px] bg-white/6">
        <div
          className="h-full min-w-0 overflow-hidden rounded-l-[2px] shadow-[inset_0_0_6px_rgba(0,0,0,0.2)]"
          style={{
            width: `${wA}%`,
            transitionProperty: "width",
            transitionDuration: `${animateMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDelay: `${delayMs}ms`,
            background: teamVerticalSheen(colorA),
            boxShadow:
              wA > 1
                ? `inset 0 0 6px rgba(0,0,0,0.22), 0 0 10px ${mixHex(
                    "#000000",
                    colorA,
                    0.25
                  )}`
                : "inset 0 0 6px rgba(0,0,0,0.22)",
          }}
        />
        <div
          className="h-full min-w-0 overflow-hidden rounded-r-[2px] shadow-[inset_0_0_6px_rgba(0,0,0,0.2)]"
          style={{
            width: `${wB}%`,
            transitionProperty: "width",
            transitionDuration: `${animateMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            transitionDelay: `${delayMs}ms`,
            background: teamVerticalSheen(colorB),
            boxShadow:
              wB > 1
                ? `inset 0 0 6px rgba(0,0,0,0.22), 0 0 10px ${mixHex(
                    "#000000",
                    colorB,
                    0.25
                  )}`
                : "inset 0 0 6px rgba(0,0,0,0.22)",
          }}
        />
      </div>
    </div>
  );
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

  const barDelay = 100 + index * 180;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: index * 0.055,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative overflow-hidden w-full rounded-2xl border border-white/15 bg-[#050814]/80
        px-3 py-3 text-left text-white
        md:rounded-3xl md:px-4 md:py-4
      "
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32] md:rounded-3xl"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
      <div className="grid grid-cols-3 items-center">
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-white/45 md:text-[11px]">SEED</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-white md:text-base">
            #{series.teams[0].seed}
          </div>
          <Jersey
            className="mt-1 h-8 w-8 md:h-10 md:w-10"
            fill={colorA}
            stroke="#fff"
          />
          <div
            className={`${nameBebas.className} mt-1 max-w-full truncate text-center text-[18px] leading-none tracking-[0.14em] text-white md:text-[26px]`}
          >
            {teamA}
          </div>
        </div>

        <div
          className={`${nameBebas.className} text-center text-base tracking-[0.14em] text-white/85 md:text-xl`}
        >
          VS
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] text-white/45 md:text-[11px]">SEED</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-white md:text-base">
            #{series.teams[1].seed}
          </div>
          <Jersey
            className="mt-1 h-8 w-8 md:h-10 md:w-10"
            fill={colorB}
            stroke="#fff"
          />
          <div
            className={`${nameBebas.className} mt-1 max-w-full truncate text-center text-[18px] leading-none tracking-[0.14em] text-white md:text-[26px]`}
          >
            {teamB}
          </div>
        </div>
      </div>

      <div className="mt-2 md:mt-3">
        <div className="mb-1 flex justify-between gap-2 text-[10px] font-semibold md:text-xs">
          <span
            className={`min-w-0 flex-1 text-center ${pctClassA} ${resultStatsMetricNumClass}`}
          >
            {total > 0 ? `${teamAPct}%` : "--"}
          </span>
          <span
            className={`min-w-0 flex-1 text-center ${pctClassB} ${resultStatsMetricNumClass}`}
          >
            {total > 0 ? `${teamBPct}%` : "--"}
          </span>
        </div>

        <div className="flex w-full items-stretch">
          {total > 0 ? (
            <Round1DuelSplitBar
              pctA={teamAPct}
              pctB={teamBPct}
              colorA={colorA}
              colorB={colorB}
              animateMs={640}
              delayMs={barDelay}
            />
          ) : (
            <div className="h-[7px] w-full rounded-sm bg-white/10" />
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
    </motion.div>
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
