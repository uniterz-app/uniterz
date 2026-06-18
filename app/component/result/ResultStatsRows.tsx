"use client";

import { useMemo } from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { resultShowsScorePrecision } from "@/lib/result/wcResultUi";
import {
  RESULT_STAT_ROW_GRID_COMPACT,
  RESULT_STAT_ROW_GRID_DEFAULT,
} from "@/lib/result/resultStatRowGrid";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
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
  /** ビューポート判定をスキップして即アニメ */
  ratingBarsImmediate?: boolean;
  /** 行の先頭オフセット（ゴール得点者行の分） */
  rowIndexOffset?: number;
  /** MatchCard 統合表示向け：ラベル・バー・数値をやや大きく */
  comfortable?: boolean;
  className?: string;
};

/** スコア精度・アップセット・総合得点の3行バー */
export default function ResultStatsRows({
  post,
  language,
  isMobile,
  ratingBarsImmediate = false,
  rowIndexOffset = 0,
  comfortable = false,
  className = "",
}: Props) {
  const m = t(language);
  const hadUpsetGame = Boolean((post.stats as { hadUpsetGame?: boolean })?.hadUpsetGame);

  const scorePrecisionValueClass = isYellow10pt(post.stats?.scorePrecision)
    ? "text-yellow-300"
    : "text-white";
  const pointsV3ValueClass = isYellow10pt(
    (post.stats as { pointsV3?: unknown })?.pointsV3
  )
    ? "text-yellow-300"
    : "text-white";
  const upsetValueClass =
    hadUpsetGame &&
    isRedUpset((post.stats as { upsetPoints?: unknown })?.upsetPoints)
      ? "text-red-400"
      : "text-white";

  const showScorePrecision = resultShowsScorePrecision(post.league);

  const statRows = useMemo(() => {
    const scorePrecision = toNumber(post.stats?.scorePrecision, 0);
    const upsetPoints = toNumber(
      (post.stats as { upsetPoints?: unknown })?.upsetPoints,
      0
    );
    const pointsV3 = toNumber((post.stats as { pointsV3?: unknown })?.pointsV3, 0);

    const rows = [
      ...(showScorePrecision
        ? [
            {
              key: "scorePrecision" as const,
              label: m.results.scorePrecisionLabel,
              value: scorePrecision,
              barMax: 10,
              format: (v: number) => v.toFixed(1),
            },
          ]
        : []),
      {
        key: "upsetPoints" as const,
        label: m.results.upsetPointsLabel,
        value: upsetPoints,
        barMax: 10,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: m.results.totalPointsLabel,
        value: pointsV3,
        barMax: 10,
        format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ];

    return rows;
  }, [post.stats, post.league, m, hadUpsetGame, showScorePrecision]);

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
        const display = r.format(r.value);
        const rowIndex = rowIndexOffset + index;

        const valueClass =
          r.key === "scorePrecision"
            ? scorePrecisionValueClass
            : r.key === "upsetPoints"
              ? upsetValueClass
              : pointsV3ValueClass;

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
              delayMs={rowIndex * barStaggerMs}
              size={barSize}
              animationActive={ratingBarsImmediate ? true : undefined}
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
