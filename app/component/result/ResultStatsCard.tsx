"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { LineChart } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { RESULT_STAT_ROW_GRID_DEFAULT } from "@/lib/result/resultStatRowGrid";
import {
  buildResultStatMetricValues,
  extractResultSettlementBreakdown,
  type ResultStatMetricKey,
} from "@/lib/result/buildResultStatRows";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
  useWcPkWinnerResult,
  WcPkWinnerResultRow,
} from "@/app/component/result/WcGoalScorerResultRow";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import {
  RESULT_HIT_CYBER_CLIP,
  resultDetailOverlaySectionClass,
  resultDetailPanelClass,
} from "@/lib/result/resultGlass";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
  language?: Language;
  inOverlay?: boolean;
};

type StatRow = {
  key: ResultStatMetricKey;
  label: string;
  desc: string;
  value: number;
  barMax: number;
  /** null means an upset game did not occur, so show "--". */
  displayValue: number | null;
  Icon?: React.ComponentType<{ className?: string }>;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function ResultStatsCard({
  post,
  minHeightClassName,
  language = "ja",
  inOverlay = false,
}: Props) {
  const m = t(language);
  const wcGoalScorer = useWcGoalScorerResult(post);
  const wcPkWinner = useWcPkWinnerResult(post);

  const fmt1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "--");

  const {
    rows,
    basePoints,
    upsetBonus,
    streakBonus,
    goalScorerBonus,
    totalPoints,
  }: {
    rows: StatRow[];
    basePoints: number;
    upsetBonus: number;
    streakBonus: number;
    goalScorerBonus: number;
    totalPoints: number;
  } = useMemo(() => {
    const breakdown = extractResultSettlementBreakdown(post.stats);

    return {
      ...breakdown,
      rows: buildResultStatMetricValues(breakdown).map((row) => ({
        ...row,
        label:
          row.key === "upsetPoints"
            ? m.results.upsetPointsLabel
            : m.results.totalPointsLabel,
        desc:
          row.key === "upsetPoints"
            ? m.results.upsetPointsDesc
            : m.results.totalPointsDesc,
      })),
    };
  }, [post.stats, m]);

  const barAnimateMs = 520;
  const barStaggerMs = 90;

  const shell = inOverlay
    ? resultDetailOverlaySectionClass({ padding: "px-4 py-3" })
    : resultDetailPanelClass({ padding: "p-5" });

  const showUpsetBonus = upsetBonus > 1e-6;
  const showStreakBonus = streakBonus > 1e-6;
  const showGoalScorerBonus = goalScorerBonus > 1e-6;

  return (
    <div
      className={[
        shell,
        inOverlay ? "" : minHeightClassName ?? "min-h-[320px]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!inOverlay ? (
        <ShellGridOverlay roundedClassName={RESULT_HIT_CYBER_CLIP} />
      ) : null}
      <div className="relative z-1">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <LineChart className="h-5 w-5 shrink-0 text-orange-400 sm:h-6 sm:w-6" aria-hidden />
        <span>{m.results.performanceStats}</span>
      </div>

      <div className="space-y-1">
        {wcPkWinner ? (
          <WcPkWinnerResultRow
            label={m.results.wcPkWinnerLabel}
            info={wcPkWinner}
          />
        ) : null}

        {wcGoalScorer ? (
          <WcGoalScorerResultRow
            label={m.results.wcGoalScorerLabel}
            info={wcGoalScorer}
          />
        ) : null}

        {rows.map((r, index) => {
          const cap = r.barMax;
          const ratio = cap > 0 ? clamp01(r.value / cap) : 0;
          const display =
            r.displayValue === null
              ? "--"
              : (Math.round(r.displayValue * 10) / 10).toFixed(1);
          const rowIndex =
            index + (wcGoalScorer ? 1 : 0) + (wcPkWinner ? 1 : 0);

          return (
            <div
              key={r.key}
              className={RESULT_STAT_ROW_GRID_DEFAULT}
            >
              <div className="min-w-0">
                <span className="truncate text-[13px] font-semibold text-white sm:text-[15px]">
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                metricKey={r.key}
                animateMs={barAnimateMs}
                delayMs={rowIndex * barStaggerMs}
                size="md"
              />

              <div
                className={`min-w-0 text-right text-[14px] text-white sm:text-[16px] ${resultStatsMetricNumClass}`}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-white/8 bg-white/4 px-3 py-2.5 sm:px-3.5 sm:py-3">
        <p className="text-center text-[12px] font-medium leading-snug text-white/75 sm:text-[14px]">
          <span className="text-white/90">
            {m.results.basePoints}{" "}
            <span
              className={[resultStatsMetricNumClass, "text-[13px] sm:text-[16px]"].join(
                " "
              )}
            >
              {fmt1(basePoints)}
            </span>
          </span>
          {showUpsetBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {m.results.upsetBonusLabel}{" "}
                <span
                  className={[resultStatsMetricNumClass, "text-[13px] sm:text-[16px]"].join(
                    " "
                  )}
                >
                  {fmt1(upsetBonus)}
                </span>
              </span>
            </>
          )}
          {showStreakBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {m.results.streakBonusLabel}{" "}
                <span
                  className={[resultStatsMetricNumClass, "text-[13px] sm:text-[16px]"].join(
                    " "
                  )}
                >
                  {fmt1(streakBonus)}
                </span>
              </span>
            </>
          )}
          {showGoalScorerBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {m.results.goalScorerBonusLabel}{" "}
                <span
                  className={[resultStatsMetricNumClass, "text-[13px] sm:text-[16px]"].join(
                    " "
                  )}
                >
                  {fmt1(goalScorerBonus)}
                </span>
              </span>
            </>
          )}
          <span className="text-white/35"> = </span>
          <span
            className={[
              resultStatsMetricNumClass,
              "text-orange-200/95 text-[15px] sm:text-[18px]",
            ].join(" ")}
          >
            {totalPoints.toFixed(1)}
          </span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={`${r.key}-desc`}
            className="text-[12px] leading-snug sm:text-[13px]"
          >
            <span className="font-semibold text-white/80">{r.label}：</span>
            <span className="text-white/55">{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <Link
          href="/web/help"
          className="text-[12px] text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200 sm:text-[13px]"
        >
          {m.results.helpPageLink}
        </Link>
      </div>
      </div>
    </div>
  );
}

export default memo(ResultStatsCard);
