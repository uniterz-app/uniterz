"use client";

import { useMemo } from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import {
  RESULT_STAT_ROW_GRID_COMPACT,
  RESULT_STAT_ROW_GRID_DEFAULT,
} from "@/lib/result/resultStatRowGrid";
import {
  buildResultStatMetricValues,
  extractResultSettlementBreakdown,
} from "@/lib/result/buildResultStatRows";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function isYellow10pt(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 7;
}

function isRedUpset(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

type Props = {
  post: PredictionPostV2;
  language: Language;
  isMobile: boolean;
  ratingBarsImmediate?: boolean;
  rowIndexOffset?: number;
  comfortable?: boolean;
  className?: string;
  animationsOff?: boolean;
};

/** アップセット・総合得点の2行バー */
export default function ResultStatsRows({
  post,
  language,
  isMobile,
  ratingBarsImmediate = false,
  rowIndexOffset = 0,
  comfortable = false,
  className = "",
  animationsOff = false,
}: Props) {
  const m = t(language);
  const breakdown = useMemo(
    () => extractResultSettlementBreakdown(post.stats),
    [post.stats]
  );
  const { hadUpsetGame } = breakdown;

  const pointsV3ValueClass = isYellow10pt(breakdown.pointsV3)
    ? "text-yellow-300"
    : "text-white";
  const upsetValueClass =
    hadUpsetGame &&
    isRedUpset(breakdown.upsetPoints)
      ? "text-red-400"
      : "text-white";

  const statRows = useMemo(
    () =>
      buildResultStatMetricValues(breakdown).map((row) => ({
        ...row,
        label:
          row.key === "upsetPoints"
            ? m.results.upsetPointsLabel
            : m.results.totalPointsLabel,
      })),
    [breakdown, m]
  );

  const barAnimateMs = isMobile ? 480 : 520;
  const barStaggerMs = isMobile ? 80 : 90;
  const barSize = isMobile && !comfortable ? "sm" : comfortable ? "lg" : "md";
  const rowGridClass = isMobile
    ? comfortable
      ? "grid grid-cols-[5.5rem_minmax(0,1fr)_2.25rem] items-center gap-x-2"
      : RESULT_STAT_ROW_GRID_COMPACT
    : comfortable
      ? "grid grid-cols-[8.75rem_minmax(0,1fr)_3.5rem] items-center gap-x-3"
      : RESULT_STAT_ROW_GRID_DEFAULT;

  return (
    <div
      className={[
        isMobile
          ? comfortable
            ? "space-y-2.5"
            : "space-y-2.5"
          : comfortable
            ? "space-y-2"
            : "space-y-1",
        className,
      ].join(" ")}
    >
      {statRows.map((r, index) => {
        const cap = r.barMax;
        const ratio =
          r.key === "upsetPoints" && !hadUpsetGame
            ? 0
            : cap > 0
              ? clamp01(r.value / cap)
              : 0;
        const display =
          r.displayValue === null
            ? "--"
            : (Math.round(r.displayValue * 10) / 10).toFixed(1);
        const rowIndex = rowIndexOffset + index;

        const valueClass =
          r.key === "upsetPoints" ? upsetValueClass : pointsV3ValueClass;

        return (
          <div
            key={r.key}
            className={[
              rowGridClass,
              isMobile
                ? comfortable
                  ? "py-1.5"
                  : "py-1"
                : comfortable
                  ? "py-1"
                  : "",
            ].join(" ")}
          >
            <div className="min-w-0">
              <span
                className={
                  isMobile
                    ? comfortable
                      ? "block truncate whitespace-nowrap text-[12px] font-semibold leading-snug text-white"
                      : "block truncate whitespace-nowrap text-[10px] font-semibold leading-snug text-white"
                    : comfortable
                      ? "truncate text-[14px] font-semibold text-white sm:text-[15px]"
                      : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                }
              >
                {r.label}
              </span>
            </div>

            <ResultStatRatingBar
              ratio={ratio}
              metricKey={r.key}
              animateMs={barAnimateMs}
              delayMs={animationsOff ? 0 : rowIndex * barStaggerMs}
              size={barSize}
              animationActive={animationsOff || ratingBarsImmediate ? true : undefined}
              animationsOff={animationsOff}
            />

            <div
              className={
                isMobile
                  ? comfortable
                    ? `min-w-0 text-right text-[12px] leading-none ${resultStatsMetricNumClass}`
                    : `min-w-0 text-right text-[10px] leading-none ${resultStatsMetricNumClass}`
                    : comfortable
                      ? `min-w-0 text-right text-[14px] text-white sm:text-[15px] ${resultStatsMetricNumClass}`
                      : `min-w-0 text-right text-[12px] text-white sm:text-[13px] ${resultStatsMetricNumClass}`
              }
            >
              <span className={valueClass}>{display}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
