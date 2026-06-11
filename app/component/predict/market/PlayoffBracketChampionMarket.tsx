"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { nameBebas } from "@/lib/fonts";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";

type MarketCountMap = Record<string, number>;

type Props = {
  championPickCounts: MarketCountMap;
  totalEntries: number;
  language?: Language;
};

type Row = {
  teamId: string;
  short: string;
  count: number;
  pct: number;
  color: string;
};

/** 表示用（件数ベースの整数パーセント） */
function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
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
    };
  }

  if (index === 1) {
    return {
      row: "py-1.5",
      rank: "text-[18px] md:text-[20px]",
      team: "text-[17px] md:text-[18px]",
      meta: "text-[11px] md:text-[12px]",
    };
  }

  if (index === 2) {
    return {
      row: "py-1.5",
      rank: "text-[17px] md:text-[19px]",
      team: "text-[16px] md:text-[17px]",
      meta: "text-[11px] md:text-[12px]",
    };
  }

  return {
    row: "py-1.5",
    rank: "text-[15px] md:text-[16px]",
    team: "text-[15px]",
    meta: "text-[11px]",
  };
}

export default function PlayoffBracketChampionMarket({
  championPickCounts,
  totalEntries,
  language = "ja",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const m = t(language);

  const rows: Row[] = useMemo(() => {
    return Object.entries(championPickCounts)
      .map(([code, count]) => {
        const teamId = teamIdFromCode(code) ?? code;

        return {
          teamId,
          short: code,
          count,
          pct: percent(count, totalEntries),
          color: getTeamJerseyPrimaryColor("nba", teamId) ?? "#3b82f6",
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [championPickCounts, totalEntries]);

  const visibleRows = expanded ? rows : rows.slice(0, 5);

  if (rows.length === 0) {
    return (
      <div className={`${CYBER_GLASS_PANEL} p-5 text-sm text-white/60`}>
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1">
          {m.common.noData}
        </div>
      </div>
    );
  }

  return (
    <div className={`${CYBER_GLASS_PANEL} p-2 shadow-[0_10px_30px_rgba(0,0,0,0.55)]`}>
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
        {visibleRows.map((row, index) => {
          const s = getRowStyle(index);
          const ratio = totalEntries > 0 ? row.pct / 100 : 0;

          return (
            <motion.div
              key={row.short}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.42,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
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

              <div className="mt-1.5 flex items-center">
                <ResultStatRatingBar
                  ratio={ratio}
                  teamBaseHex={row.color}
                  segmentCount={10}
                  animateMs={560}
                  delayMs={80 + index * 100}
                  size="md"
                />
              </div>
            </motion.div>
          );
        })}

        {rows.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center py-2 text-[12px] font-semibold text-white/65 transition hover:text-white"
          >
            {expanded ? m.common.close : m.common.showMore}
          </button>
        )}
      </div>
    </div>
  );
}
