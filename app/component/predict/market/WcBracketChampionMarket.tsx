"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountryFlag from "@/app/component/games/CountryFlag";
import { alfa, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { coerceWcTeamId, teamIdToCountryName } from "@/lib/wc/wcCountry";
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

const CARD_CLASS = "wc-bracket-user-card relative px-3 py-2.5";

function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
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
      .map(([teamId, count]) => {
        const id = coerceWcTeamId(teamId) ?? teamId;
        return {
        teamId: id,
        name:
          teamIdToCountryName(id, "en") ??
          id.replace(/^wc-/, "").toUpperCase(),
        count,
        pct: percent(count, totalEntries),
      };
      })
      .sort((a, b) => b.count - a.count);
  }, [championPickCounts, totalEntries]);

  const visibleRows = expanded ? rows : rows.slice(0, 5);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/55">{m.common.noData}</p>
    );
  }

  return (
    <div className="space-y-2">
      {visibleRows.map((row, index) => {
        const ratio = totalEntries > 0 ? row.pct / 100 : 0;

        return (
          <motion.div
            key={row.teamId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.38,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={CARD_CLASS}
          >
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={[
                      "w-5 shrink-0 font-black tabular-nums leading-none text-white/40",
                      alfa.className,
                    ].join(" ")}
                    style={{ fontSize: index < 3 ? 18 : 15 }}
                  >
                    {index + 1}
                  </span>
                  <span className="inline-flex h-5 w-[30px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/20">
                    <CountryFlag
                      teamId={row.teamId}
                      variant="inline"
                      className="block! h-full! w-full! ring-0!"
                    />
                  </span>
                  <div
                    className={`${nameBebas.className} min-w-0 truncate text-[16px] leading-none tracking-[0.08em] text-white sm:text-[18px]`}
                  >
                    {row.name}
                  </div>
                </div>

                <div className="shrink-0 text-right text-white">
                  <div
                    className={`font-bold tabular-nums leading-none text-[12px] sm:text-[13px] ${resultStatsMetricNumClass}`}
                  >
                    {row.count}
                  </div>
                  <div
                    className={`mt-0.5 text-[#00F5FF] tabular-nums leading-none text-[11px] sm:text-[12px] ${resultStatsMetricNumClass}`}
                  >
                    {row.pct}%
                  </div>
                </div>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                teamBaseHex="#00f5ff"
                segmentCount={10}
                animateMs={560}
                delayMs={80 + index * 100}
                size="md"
              />
            </div>
          </motion.div>
        );
      })}

      {rows.length > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center border border-cyan-400/30 bg-black/40 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-cyan-200/80 transition hover:border-cyan-300/50 hover:text-cyan-100"
        >
          {expanded ? m.common.close : m.common.showMore}
        </button>
      ) : null}
    </div>
  );
}
