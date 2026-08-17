"use client";

import { useMemo } from "react";
import RankGapCyberDonut from "@/app/component/rankings/gap/RankGapCyberDonut";
import { CyberRankNumber, CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import type { RankGapAnalysis } from "@/lib/rankings/rankGapAnalysis";
import { formatGapCohortTopPercent } from "@/lib/rankings/rankGapAnalysis";
import {
  buildRankGapDonutSlices,
  RANK_GAP_CHAMFER_CLIP,
  RANK_GAP_CYBER,
  type RankGapDonutSlice,
  type RankGapDonutSliceId,
} from "@/lib/rankings/rankGapDonut";

type Props = {
  analysis: RankGapAnalysis;
  language?: Language;
  layout?: "mobile" | "web";
};

const MY_RANK_TOP_PERCENT_GOLD = "#FFD65A";

function LegendCard({
  slice,
  label,
  unitPt,
  topPercentLabel,
}: {
  slice: RankGapDonutSlice;
  label: string;
  unitPt: string;
  topPercentLabel: string | null;
}) {
  const pctLabel = `${(slice.ratio * 100).toFixed(1)}%`;

  return (
    <div
      className="flex min-w-0 overflow-hidden"
      style={{ backgroundColor: RANK_GAP_CYBER.cardBgElevated }}
    >
      <span
        className="w-1 shrink-0 self-stretch"
        style={{ backgroundColor: slice.color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className={[
              nameOxanium.className,
              "min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.18em]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.labelMuted }}
          >
            {label}
          </div>
          {topPercentLabel ? (
            <span
              className={[
                nameOxanium.className,
                "shrink-0 rounded px-1.5 py-[3px] text-[10px] font-bold uppercase leading-none tracking-wide tabular-nums",
              ].join(" ")}
              style={{
                color: MY_RANK_TOP_PERCENT_GOLD,
                background: "rgba(255,214,90,0.08)",
              }}
            >
              {topPercentLabel}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <CyberScanlineText
            className={[
              nameOxanium.className,
              summaryMetricNumClass,
              "text-[22px] font-black leading-none tabular-nums text-white",
            ].join(" ")}
          >
            {formatMetricDecimals(slice.points, 0)}
          </CyberScanlineText>
          <span
            className={[
              nameOxanium.className,
              "text-[10px] font-semibold uppercase tracking-[0.12em]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.feedMuted }}
          >
            {unitPt}
          </span>
          <span
            className={[
              nameOxanium.className,
              summaryMetricNumClass,
              "text-[13px] font-bold tabular-nums",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.feedMuted }}
          >
            {pctLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RankGapPointsBreakdown({
  analysis,
  language = "ja",
  layout = "mobile",
}: Props) {
  const m = t(language);
  const g = m.rankings.rankGap;
  const topPercentTemplate = m.rankings.topPercent;
  const unitPt = g.ptUnit;

  const donutSlices = useMemo(
    () =>
      buildRankGapDonutSlices(
        analysis.self,
        analysis.cohort,
        analysis.showGoalScorer,
        analysis.cohortMetricTopPercent
      ),
    [
      analysis.self,
      analysis.cohort,
      analysis.showGoalScorer,
      analysis.cohortMetricTopPercent,
    ]
  );

  const labelById = useMemo(
    (): Record<RankGapDonutSliceId, string> => ({
      base: g.axisBase,
      upsetBonus: g.axisUpsetBonus,
      streakBonus: g.axisStreakBonus,
      goalScorerBonus: g.axisGoalScorerBonus,
    }),
    [g]
  );

  const donutSize = layout === "web" ? 188 : 172;
  const donutThickness = layout === "web" ? 42 : 38;

  const donutSegments = donutSlices.map((slice) => ({
    value: slice.ratio,
    color: slice.color,
    glow: slice.glow,
  }));

  return (
    <div
      className="relative"
      style={{
        clipPath: RANK_GAP_CHAMFER_CLIP,
        WebkitClipPath: RANK_GAP_CHAMFER_CLIP,
      }}
    >
      <div
        className="relative border"
        style={{
          borderColor: RANK_GAP_CYBER.neonBorderStrong,
          backgroundColor: RANK_GAP_CYBER.cardBg,
          boxShadow: RANK_GAP_CYBER.cardOuterGlow,
        }}
      >
        <header
          className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5"
        >
          <div className="min-w-0">
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.26em]",
              ].join(" ")}
              style={{
                color: RANK_GAP_CYBER.cyan,
                textShadow: RANK_GAP_CYBER.textGlow,
              }}
            >
              {g.cyberEyebrow}
            </p>
            <h2 className="mt-1.5 text-[17px] font-bold tracking-tight text-white sm:text-lg">
              {g.pointsBreakdown}
            </h2>
          </div>

          <div className="flex shrink-0 flex-col items-end leading-none">
            <span
              className={[
                nameOxanium.className,
                "mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.24em] sm:text-[11px]",
              ].join(" ")}
              style={{ color: RANK_GAP_CYBER.magenta }}
            >
              <span
                className="text-[15px] leading-none sm:text-[17px]"
                aria-hidden
              >
                ·
              </span>
              {g.liveRank}
            </span>
            <div className="origin-top-right scale-[1.2] sm:scale-[1.28]">
              <CyberRankNumber
                rank={analysis.currentRank}
                compact={false}
                displayValue={`#${analysis.currentRank}`}
              />
            </div>
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-4 px-4 pb-4 sm:mt-5 sm:flex-row sm:items-stretch sm:gap-5 sm:px-5 sm:pb-5">
          <div className="flex shrink-0 justify-center overflow-visible sm:justify-start sm:self-center">
            <RankGapCyberDonut
              segments={donutSegments}
              size={donutSize}
              thickness={donutThickness}
              drawDelayMs={100}
              ariaLabel={`${g.totalPoints} ${formatMetricDecimals(analysis.self.pointsSumV3, 0)}${unitPt}`}
              center={
                <div className="text-center">
                  <CyberScanlineText
                    className={[
                      nameOxanium.className,
                      summaryMetricNumClass,
                      "text-[26px] font-black leading-none tabular-nums text-white sm:text-[28px]",
                    ].join(" ")}
                  >
                    {formatMetricDecimals(analysis.self.pointsSumV3, 0)}
                  </CyberScanlineText>
                  <div
                    className={[
                      nameOxanium.className,
                      "mt-1.5 text-[9px] font-bold uppercase tracking-[0.22em]",
                    ].join(" ")}
                    style={{ color: RANK_GAP_CYBER.magenta }}
                  >
                    {g.donutCenterLabel}
                  </div>
                </div>
              }
            />
          </div>

          <div
            className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2"
            role="list"
          >
            {donutSlices.map((slice) => {
              const topPercentLabel =
                slice.cohortTopPercent != null
                  ? topPercentTemplate.replace(
                      "{n}",
                      formatGapCohortTopPercent(slice.cohortTopPercent)
                    )
                  : null;

              return (
                <div key={slice.id} role="listitem">
                  <LegendCard
                    slice={slice}
                    label={labelById[slice.id]}
                    unitPt={unitPt}
                    topPercentLabel={topPercentLabel}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="pointer-events-none absolute right-0 bottom-0 z-3 px-2.5 py-1 pb-3 sm:px-3 sm:pb-3"
          style={{
            backgroundColor: RANK_GAP_CYBER.magenta,
            clipPath: `polygon(8px 0, 100% 0, 100% 100%, 0 100%)`,
          }}
          aria-hidden
        >
          <span
            className={[
              nameOxanium.className,
              "text-[10px] font-black uppercase tracking-[0.16em] text-black sm:text-[11px]",
            ].join(" ")}
          >
            PRO
          </span>
        </div>
      </div>
    </div>
  );
}
