"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountryFlag from "@/app/component/games/CountryFlag";
import { nameBebas } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import type { WcMarketCountMap } from "@/lib/wc/wc-bracket-market-aggregate";

type Props = {
  championPickCounts: WcMarketCountMap;
  totalEntries: number;
  language?: Language;
};

type Row = {
  teamId: string;
  name: string;
  count: number;
  pct: number;
};

function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
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

export default function WcBracketChampionMarket({
  championPickCounts,
  totalEntries,
  language = "ja",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const m = t(language);

  const rows: Row[] = useMemo(() => {
    return Object.entries(championPickCounts)
      .map(([teamId, count]) => ({
        teamId,
        name:
          teamIdToCountryName(teamId, language) ??
          teamId.replace(/^wc-/, "").toUpperCase(),
        count,
        pct: percent(count, totalEntries),
      }))
      .sort((a, b) => b.count - a.count);
  }, [championPickCounts, totalEntries, language]);

  const visibleRows = expanded ? rows : rows.slice(0, 5);

  if (rows.length === 0) {
    return (
      <div className={`${CYBER_GLASS_PANEL} p-5 text-sm text-white/60`}>
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1">{m.common.noData}</div>
      </div>
    );
  }

  return (
    <div
      className={`${CYBER_GLASS_PANEL} p-2 shadow-[0_10px_30px_rgba(0,0,0,0.55)]`}
    >
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
              key={row.teamId}
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={`w-5 shrink-0 font-black leading-none text-white/45 ${s.rank}`}
                  >
                    {index + 1}
                  </div>
                  <CountryFlag
                    teamId={row.teamId}
                    className="h-5 w-7 shrink-0 rounded-[2px] object-cover"
                  />
                  <div
                    className={`${nameBebas.className} truncate font-extrabold tracking-[0.08em] text-white ${s.team}`}
                  >
                    {row.name}
                  </div>
                </div>

                <div className="shrink-0 text-right text-white">
                  <div
                    className={`font-bold tabular-nums leading-none ${s.meta}`}
                  >
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
                  teamBaseHex="#38bdf8"
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
