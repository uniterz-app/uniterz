"use client";

import { useEffect, useMemo, useState } from "react";
import { nameBebas } from "@//lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";

type MarketCountMap = Record<string, number>;

type Props = {
  championPickCounts: MarketCountMap;
  totalEntries: number;
};

type Row = {
  teamId: string;
  short: string;
  count: number;
  pct: number;
  color: string;
};

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

function teamIdFromCode(code: string) {
  const entry = Object.entries(TEAM_SHORT).find(
    ([teamId, short]) => teamId.startsWith("nba-") && short === code
  );
  return entry?.[0] ?? null;
}

function getRowStyle(index: number) {
  if (index === 0) {
    return {
      row: "py-1.5",
      rank: "text-[20px] md:text-[24px]",
      team: "text-[18px] md:text-[20px]",
      meta: "text-[12px] md:text-[13px]",
      barH: "h-1.5",
    };
  }

  if (index === 1) {
    return {
      row: "py-1.5",
      rank: "text-[18px] md:text-[20px]",
      team: "text-[17px] md:text-[18px]",
      meta: "text-[11px] md:text-[12px]",
      barH: "h-1.5",
    };
  }

  if (index === 2) {
    return {
      row: "py-1.5",
      rank: "text-[17px] md:text-[19px]",
      team: "text-[16px] md:text-[17px]",
      meta: "text-[11px] md:text-[12px]",
      barH: "h-1.5",
    };
  }

  return {
    row: "py-1.5",
    rank: "text-[15px] md:text-[16px]",
    team: "text-[15px]",
    meta: "text-[11px]",
    barH: "h-1",
  };
}

export default function PlayoffBracketChampionMarket({
  championPickCounts,
  totalEntries,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [animatedMap, setAnimatedMap] = useState<Record<number, boolean>>({});

  const rows: Row[] = useMemo(() => {
    return Object.entries(championPickCounts)
      .map(([code, count]) => {
        const teamId = teamIdFromCode(code) ?? code;

        return {
          teamId,
          short: code,
          count,
          pct: percent(count, totalEntries),
          color: getTeamPrimaryColor("nba", teamId) ?? "#3b82f6",
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [championPickCounts, totalEntries]);

  const visibleRows = expanded ? rows : rows.slice(0, 5);

  useEffect(() => {
    if (!rows.length) return;

    setAnimatedMap({});

    const timers = rows.slice(0, 5).map((_, i) =>
      window.setTimeout(() => {
        setAnimatedMap((prev) => ({ ...prev, [i]: true }));
      }, 120 + i * 220)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [rows]);

  useEffect(() => {
    if (!expanded || rows.length <= 5) return;

    const timers = rows.slice(5).map((_, i) =>
      window.setTimeout(() => {
        const rowIndex = i + 5;
        setAnimatedMap((prev) => ({ ...prev, [rowIndex]: true }));
      }, 120 + i * 220)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [expanded, rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        データがありません
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      <div>
        {visibleRows.map((row, index) => {
          const s = getRowStyle(index);
          const animateBar = !!animatedMap[index];

          return (
            <div
              key={row.short}
              className={`px-1 ${s.row} ${
                index !== visibleRows.length - 1 || rows.length > 5
                  ? "border-b border-white/10"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div
                    className={`w-5 font-black leading-none text-white/45 ${s.rank}`}
                  >
                    {index + 1}
                  </div>

                  <div
                    className={`${nameBebas.className} font-extrabold tracking-[0.12em] text-white ${s.team}`}
                  >
                    {row.short}
                  </div>
                </div>

                <div className="text-right text-white">
                  <div className={`font-bold tabular-nums leading-none ${s.meta}`}>
                    {row.count}
                  </div>
                  <div
                    className={`mt-0.5 text-white/85 tabular-nums leading-none ${s.meta}`}
                  >
                    {row.pct}%
                  </div>
                </div>
              </div>

              <div className="mt-0.5">
                <div
                  className={`w-full overflow-hidden rounded-full bg-white/10 ${s.barH}`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: animateBar ? `${row.pct}%` : "0%",
                      background: buildBarGradient(row.color),
                      boxShadow: "inset 0 0 5px rgba(0,0,0,0.25)",
                      transition: "width 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {rows.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center py-2 text-[12px] font-semibold text-white/65 transition hover:text-white"
          >
            {expanded ? "閉じる" : "もっとみる"}
          </button>
        )}
      </div>
    </div>
  );
}