"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import type {
  RankShadowCompareId,
  RankShadowCompareRow,
} from "@/lib/rankings/rankShadowAnalysis";
import {
  RANK_GAP_CHAMFER_CLIP,
  RANK_GAP_CYBER,
} from "@/lib/rankings/rankGapDonut";

const SHADOW_TAG_ACCENT = {
  strength: {
    bar: "#39ff88",
    glow: "rgba(57,255,136,0.38)",
    border: "rgba(57,255,136,0.45)",
    text: "#39ff88",
    bg: RANK_GAP_CYBER.cardBgElevated,
  },
  weakness: {
    bar: "#38bdf8",
    glow: "rgba(56,189,248,0.38)",
    border: "rgba(56,189,248,0.45)",
    text: "#38bdf8",
    bg: RANK_GAP_CYBER.cardBgElevated,
  },
  neutral: {
    bar: "rgba(255,255,255,0.55)",
    glow: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.22)",
    text: "rgba(255,255,255,0.72)",
    bg: RANK_GAP_CYBER.cardBgElevated,
  },
} as const;

const WIN_VALUE_COLOR = "#8ef0b8";
const LOSE_VALUE_COLOR = "rgba(255,255,255,0.55)";
const TIE_VALUE_COLOR = "#ffffff";

type CompareWinner = "you" | "cohort" | "tie";

function resolveCompareWinner(row: RankShadowCompareRow): CompareWinner {
  const { self, cohortAvg, delta } = row;
  if (self === cohortAvg || delta === 0) return "tie";
  return delta > 0 ? "you" : "cohort";
}

function valueColorForSide(side: "you" | "cohort", winner: CompareWinner): string {
  if (winner === "tie") return TIE_VALUE_COLOR;
  return winner === side ? WIN_VALUE_COLOR : LOSE_VALUE_COLOR;
}

type Props = {
  rows: RankShadowCompareRow[];
  compareAdvice: string;
  language?: Language;
};

function rowAccent(row: RankShadowCompareRow) {
  return SHADOW_TAG_ACCENT[row.tag];
}

function formatValue(id: RankShadowCompareId, value: number): string {
  if (id === "rank") {
    const n = Math.round(value);
    if (n > 0) return `+${n}`;
    if (n < 0) return String(n);
    return "±0";
  }
  if (id === "totalPoints") return formatMetricDecimals(value, 0);
  if (id === "exactHits") {
    return formatMetricDecimals(value, value < 10 ? 1 : 0);
  }
  return formatMetricDecimals(value, value < 20 ? 1 : 0);
}

function rowUnit(
  id: RankShadowCompareId,
  unitPt: string,
  language: Language
): string {
  if (id === "rank") return language === "en" ? "places" : "位";
  if (id === "exactHits") return language === "en" ? "hits" : "回";
  return unitPt;
}

function formatDelta(
  id: RankShadowCompareId,
  delta: number,
  unitPt: string
): string {
  const abs = Math.abs(delta);
  const rounded =
    id === "rank"
      ? String(Math.round(abs))
      : id === "exactHits"
        ? formatMetricDecimals(abs, abs < 10 ? 1 : 0)
        : id === "totalPoints"
          ? formatMetricDecimals(abs, 0)
          : formatMetricDecimals(abs, abs < 20 ? 1 : 0);
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "±";
  const suffix = id === "exactHits" ? "" : unitPt;
  return `${sign}${rounded}${suffix}`;
}

function CompareStatBlock({
  caption,
  value,
  unit,
  valueColor,
}: {
  caption: string;
  value: string;
  unit: string;
  valueColor: string;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div
        className={[
          nameOxanium.className,
          "text-[9px] font-bold uppercase tracking-[0.14em]",
        ].join(" ")}
        style={{ color: RANK_GAP_CYBER.labelMuted }}
      >
        {caption}
      </div>
      <div className="mt-1 flex items-baseline justify-center gap-1">
        <span
          className={[
            nameOxanium.className,
            summaryMetricNumClass,
            "text-lg font-black tabular-nums leading-none",
          ].join(" ")}
          style={{ color: valueColor }}
        >
          {value}
        </span>
        {unit ? (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{
              color:
                valueColor === WIN_VALUE_COLOR
                  ? "rgba(142,240,184,0.72)"
                  : RANK_GAP_CYBER.feedMuted,
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RankShadowCompareRowView({
  row,
  label,
  unitPt,
  youLabel,
  cohortLabel,
  cohortDeltaTemplate,
  language,
}: {
  row: RankShadowCompareRow;
  label: string;
  unitPt: string;
  youLabel: string;
  cohortLabel: string;
  cohortDeltaTemplate: string;
  language: Language;
}) {
  const accent = rowAccent(row);
  const winner = resolveCompareWinner(row);
  const deltaLabel = formatDelta(row.id, row.delta, unitPt);
  const unit = rowUnit(row.id, unitPt, language);
  const cohortBandDeltaLine = cohortDeltaTemplate.replace("{delta}", deltaLabel);
  const tagLabel =
    row.tag === "weakness"
      ? language === "en"
        ? "Gap"
        : "不足"
      : row.tag === "strength"
        ? language === "en"
          ? "Edge"
          : "強み"
        : language === "en"
          ? "Even"
          : "同水準";

  return (
    <div
      className="border px-3 py-3"
      style={{
        borderColor: accent.border,
        backgroundColor: accent.bg,
      }}
    >
      <div
        className={[
          nameOxanium.className,
          "text-center text-[9px] font-bold uppercase tracking-[0.16em]",
        ].join(" ")}
        style={{ color: RANK_GAP_CYBER.labelMuted }}
      >
        {label}
      </div>

      <div className="mt-2 flex items-end justify-center gap-2">
        <CompareStatBlock
          caption={youLabel}
          value={formatValue(row.id, row.self)}
          unit={unit}
          valueColor={valueColorForSide("you", winner)}
        />
        <div
          className={[
            nameOxanium.className,
            "mb-2 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em]",
          ].join(" ")}
          style={{ color: "rgba(255,255,255,0.32)" }}
          aria-hidden
        >
          vs
        </div>
        <CompareStatBlock
          caption={cohortLabel}
          value={formatValue(row.id, row.cohortAvg)}
          unit={unit}
          valueColor={valueColorForSide("cohort", winner)}
        />
      </div>

      <div className="mt-2.5 text-center">
        <div
          className={[
            nameOxanium.className,
            "text-xs font-bold tabular-nums tracking-wide",
          ].join(" ")}
          style={{ color: accent.text }}
        >
          {cohortBandDeltaLine}
        </div>
        <div
          className={[
            nameOxanium.className,
            "mt-0.5 text-[11px] font-bold tracking-wide",
          ].join(" ")}
          style={{ color: accent.text }}
        >
          {tagLabel}
        </div>
      </div>
    </div>
  );
}

export default function RankShadowCompareSection({
  rows,
  compareAdvice,
  language = "ja",
}: Props) {
  const m = t(language);
  const s = m.rankings.rankShadow;
  const g = m.rankings.rankGap;
  const reduceMotion = useReducedMotion();
  const unitPt = g.ptUnit;

  const compareLabels = useMemo(
    (): Record<RankShadowCompareId, string> => ({
      rank: s.axisRank,
      totalPoints: g.axisTotalPoints,
      exactHits: s.axisExactHits,
      streakBonus: s.axisStreakBonus,
      upsetBonus: s.axisUpsetBonus,
      goalScorerBonus: g.axisGoalScorerBonus,
    }),
    [s, g]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-0.5">
        <h2
          className={[
            nameOxanium.className,
            "text-[13px] font-bold uppercase tracking-[0.14em]",
          ].join(" ")}
          style={{ color: RANK_GAP_CYBER.cyan }}
        >
          {s.compareSection}
        </h2>
        <span className="text-[12px] leading-snug text-white/45">
          {s.compareHint}
        </span>
      </div>

      <div
        className="grid grid-cols-1 gap-px sm:grid-cols-2"
        style={{ backgroundColor: RANK_GAP_CYBER.divider }}
      >
        {rows.map((row, i) => (
          <motion.div
            key={row.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduceMotion ? 0 : i * 0.05,
              duration: 0.28,
            }}
          >
            <RankShadowCompareRowView
              row={row}
              label={compareLabels[row.id]}
              unitPt={unitPt}
              youLabel={s.compareYouLabel}
              cohortLabel={s.compareCohortLabel}
              cohortDeltaTemplate={s.cohortBandDelta}
              language={language}
            />
          </motion.div>
        ))}
      </div>

      <div
        className="relative border px-4 py-3.5"
        style={{
          clipPath: RANK_GAP_CHAMFER_CLIP,
          WebkitClipPath: RANK_GAP_CHAMFER_CLIP,
          borderColor: RANK_GAP_CYBER.neonBorder,
          backgroundColor: RANK_GAP_CYBER.cardBgElevated,
        }}
      >
        <div
          className={[
            nameOxanium.className,
            "mb-1 text-[10px] font-bold uppercase tracking-[0.18em]",
          ].join(" ")}
          style={{ color: RANK_GAP_CYBER.magenta }}
        >
          {g.adviceLabel}
        </div>
        <p className="text-sm leading-relaxed text-white/82">{compareAdvice}</p>
      </div>
    </div>
  );
}
