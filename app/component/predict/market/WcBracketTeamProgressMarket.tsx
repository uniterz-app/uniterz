"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountryFlag from "@/app/component/games/CountryFlag";
import { nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { coerceWcTeamId, teamIdToCountryName } from "@/lib/wc/wcCountry";
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

const CARD_CLASS = "wc-bracket-user-card relative min-w-0 px-2.5 py-2.5 sm:px-3";

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
    <div className="mt-2.5 border-t border-cyan-400/15 pt-2.5">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="tracking-[0.04em] text-white/65">
                {item.label}
              </span>
              <span
                className={`font-semibold text-[#00F5FF] ${resultStatsMetricNumClass}`}
              >
                {item.pct > 0 ? `${item.pct}%` : "--"}
              </span>
            </div>
            <ResultStatRatingBar
              ratio={item.pct > 0 ? item.pct / 100 : 0}
              teamBaseHex="#00f5ff"
              animateMs={520}
              delayMs={i * 140}
              size="sm"
            />
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: cardIndex * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={CARD_CLASS}
    >
      <div className="relative z-10">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="inline-flex h-8 w-11 overflow-hidden rounded-[2px] ring-1 ring-white/20 sm:h-9 sm:w-12">
            <CountryFlag
              teamId={row.teamId}
              variant="inline"
              className="block! h-full! w-full! ring-0!"
            />
          </span>
          <div className="w-full min-w-0">
            <div
              className={`${nameBebas.className} truncate text-[13px] leading-none tracking-[0.06em] text-white sm:text-[15px]`}
            >
              {row.name}
            </div>
            <div className="mt-1 text-[10px] text-white/60">
              {row.bestLabel}{" "}
              <span
                className={`font-semibold text-[#00F5FF] ${resultStatsMetricNumClass}`}
              >
                {row.bestPct}%
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 flex w-full items-center justify-center border border-cyan-400/30 bg-cyan-400/6 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-cyan-200/80 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-cyan-100"
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
          teamId: coerceWcTeamId(teamId) ?? teamId,
          name:
            teamIdToCountryName(coerceWcTeamId(teamId) ?? teamId, "en") ??
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
      <p className="py-8 text-center text-sm text-white/55">{m.common.noData}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
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
