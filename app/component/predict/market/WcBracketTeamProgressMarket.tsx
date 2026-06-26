"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountryFlag from "@/app/component/games/CountryFlag";
import { nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import type { WcTeamProgressMap } from "@/lib/wc/wc-bracket-market-aggregate";

type Props = {
  teamProgressMarkets: WcTeamProgressMap;
  totalEntries: number;
  language?: Language;
};

type TeamRow = {
  teamId: string;
  name: string;
  r16: number;
  qf: number;
  sf: number;
  final: number;
  champion: number;
  bestLabel: string;
  bestPct: number;
};

function percent(v: number, total: number) {
  if (!total) return 0;
  return Math.round((v / total) * 100);
}

function wcRoundLabels(language: Language) {
  const isJa = language === "ja";
  return {
    r16: isJa ? "ベスト16" : "R16",
    qf: isJa ? "準々決勝" : "QF",
    sf: isJa ? "準決勝" : "SF",
    final: isJa ? "決勝進出" : "FINAL",
    champion: isJa ? "優勝" : "CHAMPION",
  };
}

function getBestMetricLabel(
  row: Pick<TeamRow, "r16" | "qf" | "sf" | "final" | "champion">,
  language: Language
) {
  const labels = wcRoundLabels(language);
  const items = [
    { label: labels.r16, pct: row.r16, priority: 0 },
    { label: labels.qf, pct: row.qf, priority: 1 },
    { label: labels.sf, pct: row.sf, priority: 2 },
    { label: labels.final, pct: row.final, priority: 3 },
    { label: labels.champion, pct: row.champion, priority: 4 },
  ].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    return b.priority - a.priority;
  });
  return items[0];
}

function TeamProgressDetails({
  row,
  open,
  language,
}: {
  row: TeamRow;
  open: boolean;
  language: Language;
}) {
  const labels = wcRoundLabels(language);
  const items = [
    { label: labels.r16, pct: row.r16 },
    { label: labels.qf, pct: row.qf },
    { label: labels.sf, pct: row.sf },
    { label: labels.final, pct: row.final },
    { label: labels.champion, pct: row.champion },
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
                teamBaseHex="#38bdf8"
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
  const m = t(language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: cardIndex * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${CYBER_GLASS_PANEL} w-full px-3 py-3 text-left text-white md:px-4 md:py-4`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
          <CountryFlag
            teamId={row.teamId}
            className="h-12 w-16 rounded-[3px] object-cover md:h-14 md:w-[4.5rem]"
          />
          <div className="min-w-0">
            <div
              className={`${nameBebas.className} truncate text-[18px] leading-none tracking-[0.08em] text-white md:text-[24px]`}
            >
              {row.name}
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-white/12 bg-white/5 py-2 text-[11px] font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
        >
          {open ? m.common.close : m.common.showMore}
        </button>

        <TeamProgressDetails row={row} open={open} language={language} />
      </div>
    </motion.div>
  );
}

export default function WcBracketTeamProgressMarket({
  teamProgressMarkets,
  totalEntries,
  language = "ja",
}: Props) {
  const rows: TeamRow[] = useMemo(() => {
    const teamIds = new Set<string>();
    for (const bucket of Object.values(teamProgressMarkets)) {
      for (const teamId of Object.keys(bucket)) {
        teamIds.add(teamId);
      }
    }

    return [...teamIds]
      .map((teamId) => {
        const r16 = percent(
          teamProgressMarkets.R16[teamId] ?? 0,
          totalEntries
        );
        const qf = percent(teamProgressMarkets.QF[teamId] ?? 0, totalEntries);
        const sf = percent(teamProgressMarkets.SF[teamId] ?? 0, totalEntries);
        const final = percent(
          teamProgressMarkets.FINAL[teamId] ?? 0,
          totalEntries
        );
        const champion = percent(
          teamProgressMarkets.CHAMPION[teamId] ?? 0,
          totalEntries
        );
        const best = getBestMetricLabel(
          { r16, qf, sf, final, champion },
          language
        );
        return {
          teamId,
          name:
            teamIdToCountryName(teamId, language) ??
            teamId.replace(/^wc-/, "").toUpperCase(),
          r16,
          qf,
          sf,
          final,
          champion,
          bestLabel: best.label,
          bestPct: best.pct,
        };
      })
      .sort((a, b) => b.bestPct - a.bestPct || b.champion - a.champion);
  }, [teamProgressMarkets, totalEntries, language]);

  const m = t(language);

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
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.map((row, index) => (
        <TeamCard
          key={row.teamId}
          row={row}
          language={language}
          cardIndex={index}
        />
      ))}
    </div>
  );
}
