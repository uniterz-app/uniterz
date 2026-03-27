"use client";

import { useEffect, useMemo, useState } from "react";
import Jersey from "@/app/component/games/icons/Jersey";
import { nameBebas } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import { getPlayoffBracketConfig } from "@/lib/playoff-bracket-config";
import type { Language } from "@/lib/i18n/language";

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
  const [animateBars, setAnimateBars] = useState(false);
  const isEn = language === "en";

  const items = [
    { label: isEn ? "R2" : "2回戦進出", pct: row.r2 },
    { label: isEn ? "CF" : "CF進出", pct: row.cf },
    { label: "Finals", pct: row.finals },
    { label: isEn ? "Champion" : "優勝", pct: row.champion },
  ];

  useEffect(() => {
    if (!open) {
      setAnimateBars(false);
      return;
    }

    setAnimateBars(false);

    const timer = window.setTimeout(() => {
      setAnimateBars(true);
    }, 40);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="tracking-[0.02em] text-white/70">
                {item.label}
              </span>
              <span className="font-semibold text-white/90">
                {item.pct > 0 ? `${item.pct}%` : "--"}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: animateBars ? `${item.pct}%` : "0%",
                  background: buildBarGradient(color),
                  boxShadow: "inset 0 0 5px rgba(0,0,0,0.22)",
                  transition: "width 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionDelay: `${i * 180}ms`,
                }}
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
}: {
  row: TeamRow;
  language: Language;
}) {
  const [open, setOpen] = useState(false);
  const color = row.color;

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-[#050814]/80 px-3 py-3 text-left text-white md:px-4 md:py-4">
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-2">
        <div className="text-center">
          <div className="text-[10px] text-white/45 md:text-[11px]">SEED</div>
          <div className="mt-0.5 text-sm font-bold md:text-base">
            {row.seed ? `#${row.seed}` : "--"}
          </div>
        </div>

        <div className="flex justify-center">
          <Jersey
            className="h-9 w-9 md:h-10 md:w-10"
            fill={color}
            stroke="#fff"
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
            <span className="font-semibold text-cyan-300">{row.bestPct}%</span>
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

      {open && (
        <TeamProgressDetails
          row={row}
          color={color}
          open={open}
          language={language}
        />
      )}
    </div>
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
          color: getTeamPrimaryColor("nba", teamId) ?? "#3b82f6",
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        {language === "en" ? "No data available" : "データがありません"}
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section>
        <ConferenceHeader title="EASTERN CONFERENCE" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {eastRows.map((row) => (
            <TeamCard key={row.code} row={row} language={language} />
          ))}
        </div>
      </section>

      <section>
        <ConferenceHeader title="WESTERN CONFERENCE" />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {westRows.map((row) => (
            <TeamCard key={row.code} row={row} language={language} />
          ))}
        </div>
      </section>
    </div>
  );
}