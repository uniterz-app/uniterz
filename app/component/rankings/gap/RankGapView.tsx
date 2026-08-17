"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import type {
  RankGapAnalysis,
  RankGapAxisId,
  RankGapAxisRow,
} from "@/lib/rankings/rankGapAnalysis";
import RankGapPointsBreakdown from "@/app/component/rankings/gap/RankGapPointsBreakdown";
import {
  RANK_GAP_CHAMFER_CLIP,
  RANK_GAP_CYBER,
} from "@/lib/rankings/rankGapDonut";

const GAP_TAG_ACCENT = {
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

type Props = {
  analysis: RankGapAnalysis | null;
  loading?: boolean;
  errorCode?: string | null;
  language?: Language;
  layout?: "mobile" | "web";
  onRetry?: () => void;
};

function axisAccent(row: RankGapAxisRow) {
  return GAP_TAG_ACCENT[row.tag];
}

function formatAxisValue(id: RankGapAxisId, value: number): string {
  if (id === "exactHits") {
    return formatMetricDecimals(value, value < 10 ? 1 : 0);
  }
  if (id === "totalPoints") {
    return formatMetricDecimals(value, 0);
  }
  return formatMetricDecimals(value, value < 20 ? 1 : 0);
}

function axisUnit(
  id: RankGapAxisId,
  unitPt: string,
  language: Language
): string {
  if (id === "exactHits") {
    return language === "en" ? "hits" : "回";
  }
  return unitPt;
}

function formatDelta(id: RankGapAxisId, delta: number, unitPt: string): string {
  const abs = Math.abs(delta);
  const rounded =
    id === "exactHits"
      ? formatMetricDecimals(abs, abs < 10 ? 1 : 0)
      : formatMetricDecimals(abs, abs < 20 ? 1 : 0);
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "±";
  const suffix = id === "exactHits" ? "" : unitPt;
  return `${sign}${rounded}${suffix}`;
}

function formatCohortAvgLine(
  template: string,
  tierLabel: string,
  row: RankGapAxisRow,
  unitPt: string,
  language: Language
): string {
  const unit = axisUnit(row.id, unitPt, language);
  const value = formatAxisValue(row.id, row.cohortAvg);
  return template
    .replace("{tier}", tierLabel)
    .replace("{value}", `${value}${unit}`);
}

function formatCohortBandDeltaLine(
  tierLabel: string,
  deltaLabel: string,
  language: Language
): string {
  if (language === "en") {
    return `${tierLabel} band ${deltaLabel}`;
  }
  return `${tierLabel}帯 ${deltaLabel}`;
}

function RankGapAxisRowView({
  row,
  label,
  unitPt,
  cohortAvgTemplate,
  tierLabel,
  language,
}: {
  row: RankGapAxisRow;
  label: string;
  unitPt: string;
  cohortAvgTemplate: string;
  tierLabel: string;
  language: Language;
}) {
  const accent = axisAccent(row);
  const deltaLabel = formatDelta(row.id, row.delta, unitPt);
  const unit = axisUnit(row.id, unitPt, language);
  const cohortAvgLine = formatCohortAvgLine(
    cohortAvgTemplate,
    tierLabel,
    row,
    unitPt,
    language
  );
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
  const cohortBandDeltaLine = formatCohortBandDeltaLine(
    tierLabel,
    deltaLabel,
    language
  );

  return (
    <div
      className="flex gap-2.5 border px-3 py-3"
      style={{
        borderColor: accent.border,
        backgroundColor: accent.bg,
      }}
    >
      <span
        className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full"
        style={{
          backgroundColor: accent.bar,
          boxShadow: `0 0 4px ${accent.glow}`,
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.16em]",
              ].join(" ")}
              style={{ color: RANK_GAP_CYBER.labelMuted }}
            >
              {label}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <CyberScanlineText
                className={[
                  nameOxanium.className,
                  summaryMetricNumClass,
                  "text-xl font-black tabular-nums text-white",
                ].join(" ")}
              >
                {formatAxisValue(row.id, row.self)}
              </CyberScanlineText>
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: RANK_GAP_CYBER.feedMuted }}
              >
                {unit}
              </span>
            </div>
            <div
              className={[
                nameOxanium.className,
                "mt-1 text-xs font-bold tabular-nums tracking-wide",
              ].join(" ")}
              style={{ color: RANK_GAP_CYBER.feedMuted }}
            >
              {cohortAvgLine}
            </div>
          </div>
          <div className="shrink-0 max-w-[46%] text-right">
            <div
              className={[
                nameOxanium.className,
                "text-xs font-bold tabular-nums leading-snug tracking-wide",
              ].join(" ")}
              style={{ color: accent.text }}
            >
              {cohortBandDeltaLine}
            </div>
            <div
              className={[
                nameOxanium.className,
                "mt-0.5 text-[11px] font-bold leading-snug tracking-wide",
              ].join(" ")}
              style={{ color: accent.text }}
            >
              {tagLabel}
            </div>
          </div>
        </div>
        <div className="mt-2.5">
          <CyberSlantedSegBar
            pct={row.barPct}
            segments={10}
            compact
            forceStatic
            accent={{
              border: accent.border,
              glow: accent.glow,
              bg: "rgba(255,255,255,0.04)",
            }}
            maxWidthClass="max-w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function RankGapView({
  analysis,
  loading = false,
  errorCode = null,
  language = "ja",
  layout = "mobile",
  onRetry,
}: Props) {
  const m = t(language);
  const g = m.rankings.rankGap;
  const reduceMotion = useReducedMotion();
  const unitPt = g.ptUnit;

  const axisLabels = useMemo(
    (): Record<RankGapAxisId, string> => ({
      totalPoints: g.axisTotalPoints,
      base: g.axisBase,
      exactHits: g.axisExactHits,
      upsetBonus: g.axisUpsetBonus,
      streakBonus: g.axisStreakBonus,
      goalScorerBonus: g.axisGoalScorerBonus,
    }),
    [g]
  );

  const cohortGapHint = analysis
    ? g.cohortGapHint.replace("{tier}", analysis.tierLabel)
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <CandleChartLoader label={g.loading} />
      </div>
    );
  }

  if (!analysis) {
    const message =
      errorCode === "pro_required"
        ? g.errorProRequired
        : errorCode === "unauthorized"
          ? g.errorSignIn
          : g.errorGeneric;
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 px-5 py-10 text-center">
        <p className="text-sm text-white/65">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl border border-cyan-400/35 bg-cyan-500/12 px-4 py-2 text-xs font-semibold text-cyan-100"
          >
            {m.common.retry}
          </button>
        ) : null}
      </div>
    );
  }

  const shellMax = layout === "web" ? "max-w-[640px]" : "max-w-full";

  return (
    <div className={["mx-auto w-full space-y-4", shellMax].join(" ")}>
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          {g.title}
        </h1>
        <p className="text-xs leading-relaxed text-white/50">{g.subtitle}</p>
      </header>

      <RankGapPointsBreakdown
        analysis={analysis}
        language={language}
        layout={layout}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-0.5">
          <h2
            className={[
              nameOxanium.className,
              "text-[11px] font-bold uppercase tracking-[0.16em]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.cyan }}
          >
            {g.cohortGapSection}
          </h2>
          <span className="text-[11px] leading-snug text-white/45">
            {cohortGapHint}
          </span>
        </div>

        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2"
          style={{ backgroundColor: RANK_GAP_CYBER.divider }}
        >
          {analysis.axes.map((row, i) => (
            <motion.div
              key={row.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : i * 0.05,
                duration: 0.28,
              }}
            >
              <RankGapAxisRowView
                row={row}
                label={axisLabels[row.id]}
                unitPt={unitPt}
                cohortAvgTemplate={g.cohortAvg}
                tierLabel={analysis.tierLabel}
                language={language}
              />
            </motion.div>
          ))}
        </div>
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
        <p className="text-sm leading-relaxed text-white/82">{analysis.advice}</p>
      </div>
    </div>
  );
}
