"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { getPlayoffBracketConfig } from "@/lib/playoff-bracket-config";
import type { Language } from "@/lib/i18n/language";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type MarketCountMap = Record<string, number>;

type TeamProgressMap = {
  R2: MarketCountMap;
  CF: MarketCountMap;
  FINALS: MarketCountMap;
  CHAMPION: MarketCountMap;
};

type Props = {
  season: string;
  teamProgressMarkets: TeamProgressMap;
  totalEntries: number;
  language?: Language;
};

type TeamRow = {
  code: string;
  teamId: string;
  seed: number | null;
  conference: "east" | "west" | null;
  color: string;
  colorEnd: string;
  r2: number;
  cf: number;
  finals: number;
  champion: number;
  bestLabel: string;
  bestPct: number;
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

function getBestMetricLabel(row: {
  r2: number;
  cf: number;
  finals: number;
  champion: number;
}, language: Language) {
  const isEn = language === "en";
  const items = [
    {
      label: isEn ? "R2" : "2回戦進出",
      pct: row.r2,
      priority: 0,
    },
    {
      label: isEn ? "CF" : "CF進出",
      pct: row.cf,
      priority: 1,
    },
    { label: "Finals", pct: row.finals, priority: 2 },
    {
      label: isEn ? "Champion" : "優勝",
      pct: row.champion,
      priority: 3,
    },
  ].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    return b.priority - a.priority;
  });

  return items[0];
}

function TeamProgressDetails({
  row,
  color,
  open,
  language,
}: {
  row: TeamRow;
  color: string;
  open: boolean;
  language: Language;
}) {
  const isEn = language === "en";

  const items = [
    { label: isEn ? "R2" : "2回戦進出", pct: row.r2 },
    { label: isEn ? "CF" : "CF進出", pct: row.cf },
    { label: "Finals", pct: row.finals },
    { label: isEn ? "Champion" : "優勝", pct: row.champion },
  ];

  if (!open) return null;

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="tracking-[0.02em] text-white/70">
                {item.label}
              </span>
              <span
                className={`font-semibold text-white/90 ${resultStatsMetricNumClass}`}
              >
                {item.pct > 0 ? `${item.pct}%` : "--"}
              </span>
            </div>

            <div className="flex items-center">
              <ResultStatRatingBar
                ratio={item.pct > 0 ? item.pct / 100 : 0}
                teamBaseHex={color}
                animateMs={520}
                delayMs={i * 140}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamCard({
  row,
  language,
  cardIndex,
}: {
  row: TeamRow;
  language: Language;
  cardIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const color = row.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: cardIndex * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden w-full rounded-2xl border border-white/15 bg-[#050814]/80 px-3 py-3 text-left text-white md:px-4 md:py-4"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-2">
        <div className="text-center">
          <div className="text-[10px] text-white/45 md:text-[11px]">SEED</div>
          <div className="mt-0.5 text-sm font-bold md:text-base">
            {row.seed ? `#${row.seed}` : "--"}
          </div>
        </div>

        <div className="flex justify-center">
          <HalftoneJerseyMark
            accent={color}
            accentEnd={row.colorEnd}
            className="h-14 w-14 md:h-20 md:w-20"
          />
        </div>

        <div className="min-w-0">
          <div
            className={`${nameBebas.className} truncate text-[18px] leading-none tracking-[0.14em] text-white md:text-[26px]`}
          >
            {row.code}
          </div>

          <div className="mt-1 text-[11px] text-white/65 md:text-xs">
            {row.bestLabel}{" "}
            <span
              className={`font-semibold text-cyan-300 ${resultStatsMetricNumClass}`}
            >
              {row.bestPct}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[10px] tracking-[0.2em] text-white/60 transition hover:text-white"
        >
          {open ? "HIDE DETAILS" : "DETAILS"}
        </button>
      </div>

      <TeamProgressDetails
        row={row}
        color={color}
        open={open}
        language={language}
      />
      </div>
    </motion.div>
  );
}

function ConferenceHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex flex-col items-center md:mb-5">
      <div
        className={`${nameBebas.className} text-[22px] tracking-[0.16em] text-[#f8fbff] md:text-[26px]`}
      >
        {title}
      </div>
      <div className="mt-1 h-px w-[220px] bg-[linear-gradient(90deg,transparent,#5f7cff,transparent)] opacity-60 md:w-[260px]" />
    </div>
  );
}

export default function PlayoffBracketTeamProgressMarket({
  season,
  teamProgressMarkets,
  totalEntries,
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const { eastCodes, westCodes, seedByTeam } = useMemo(() => {
    const config = getPlayoffBracketConfig(season);

    const eastSorted = [...config.east].sort((a, b) => a.seed - b.seed);
    const westSorted = [...config.west].sort((a, b) => a.seed - b.seed);

    const seedMap: Record<string, number> = {};
    for (const t of [...eastSorted, ...westSorted]) {
      seedMap[t.code] = t.seed;
    }

    return {
      eastCodes: eastSorted.map((t) => t.code),
      westCodes: westSorted.map((t) => t.code),
      seedByTeam: seedMap,
    };
  }, [season]);

  const rows = useMemo<TeamRow[]>(() => {
    const codes = Array.from(
      new Set([
        ...Object.keys(teamProgressMarkets.R2 ?? {}),
        ...Object.keys(teamProgressMarkets.CF ?? {}),
        ...Object.keys(teamProgressMarkets.FINALS ?? {}),
        ...Object.keys(teamProgressMarkets.CHAMPION ?? {}),
      ])
    );

    return codes
      .map((code) => {
        const teamId = NBA_TEAM_ID_BY_CODE[code] ?? code;

        const rowBase = {
          r2: percent(Number(teamProgressMarkets.R2?.[code] ?? 0), totalEntries),
          cf: percent(Number(teamProgressMarkets.CF?.[code] ?? 0), totalEntries),
          finals: percent(
            Number(teamProgressMarkets.FINALS?.[code] ?? 0),
            totalEntries
          ),
          champion: percent(
            Number(teamProgressMarkets.CHAMPION?.[code] ?? 0),
            totalEntries
          ),
        };

        const best = getBestMetricLabel(rowBase, language);

        return {
          code,
          teamId,
          seed: seedByTeam[code] ?? null,
          conference: eastCodes.includes(code)
            ? ("east" as const)
            : westCodes.includes(code)
              ? ("west" as const)
              : null,
          color: getTeamJerseyPrimaryColor("nba", teamId) ?? "#3b82f6",
          colorEnd: getTeamJerseySecondaryColor("nba", teamId),
          ...rowBase,
          bestLabel: best.label,
          bestPct: best.pct,
        };
      })
      .sort((a, b) => {
        if ((a.seed ?? 99) !== (b.seed ?? 99)) return (a.seed ?? 99) - (b.seed ?? 99);
        return a.code.localeCompare(b.code);
      });
  }, [teamProgressMarkets, totalEntries, eastCodes, westCodes, seedByTeam]);

  const eastRows = rows.filter((row) => row.conference === "east");
  const westRows = rows.filter((row) => row.conference === "west");

  if (rows.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1">
          {language === "en" ? "No data available" : "データがありません"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section>
        <ConferenceHeader title="EASTERN CONFERENCE" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {eastRows.map((row, index) => (
            <TeamCard
              key={row.code}
              row={row}
              language={language}
              cardIndex={index}
            />
          ))}
        </div>
      </section>

      <section>
        <ConferenceHeader title="WESTERN CONFERENCE" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {westRows.map((row, index) => (
            <TeamCard
              key={row.code}
              row={row}
              language={language}
              cardIndex={index + eastRows.length}
            />
          ))}
        </div>
      </section>
    </div>
  );
}