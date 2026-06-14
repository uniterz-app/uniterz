// app/component/result/mobile/MobileResultStatsCard.tsx
"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { LineChart } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { RESULT_STAT_ROW_GRID_COMPACT } from "@/lib/result/resultStatRowGrid";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
} from "@/app/component/result/WcGoalScorerResultRow";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { resultDetailPanelClass } from "@/lib/result/resultGlass";
import { resultShowsScorePrecision } from "@/lib/result/wcResultUi";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
  language?: Language;
  inOverlay?: boolean;
};

type StatRow = {
  key: "scorePrecision" | "upsetPoints" | "pointsV3";
  label: string;
  desc: string;
  value: number;
  max?: number;
  barMax?: number;
  format?: (v: number) => string;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function MobileResultStatsCard({
  post,
  minHeightClassName,
  language = "ja",
  inOverlay = false,
}: Props) {
  const m = t(language);
  const wcGoalScorer = useWcGoalScorerResult(post);

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
    const scorePrecision = toNumber(post.stats?.scorePrecision, 0);
    const hadUpsetGame = Boolean((post.stats as any)?.hadUpsetGame);
    const upsetPoints = toNumber((post.stats as any)?.upsetPoints, 0);
    const pointsV3 = toNumber((post.stats as any)?.pointsV3, 0);

    const basePoints = toNumber(
      (post.stats as any)?.pointsV3Detail?.basePoints,
      0
    );
    const upsetBonus = toNumber(
      (post.stats as any)?.pointsV3Detail?.upsetBonus,
      0
    );
    const streakBonus = toNumber(
      (post.stats as any)?.pointsV3Detail?.streakBonus,
      0
    );
    const goalScorerBonus = toNumber(
      (post.stats as any)?.goalScorerBonus ??
        (post.stats as any)?.pointsV3Detail?.goalScorerBonus,
      0
    );

    const showScorePrecision = resultShowsScorePrecision(post.league);

    return {
      basePoints,
      upsetBonus,
      streakBonus,
      goalScorerBonus,
      totalPoints: pointsV3,
      rows: [
        ...(showScorePrecision
          ? [
              {
                key: "scorePrecision" as const,
                label: m.results.scorePrecisionLabel,
                desc: m.results.scorePrecisionDesc,
                value: scorePrecision,
                max: 10,
                barMax: 10,
                format: (v: number) => v.toFixed(1),
              },
            ]
          : []),
        {
          key: "upsetPoints" as const,
          label: m.results.upsetPointsLabel,
          desc: m.results.upsetPointsDesc,
          value: upsetPoints,
          max: 10,
          barMax: 10,
          format: (v: number) =>
            hadUpsetGame
              ? `${(Math.round(v * 10) / 10).toFixed(1)}`
              : "--",
        },
        {
          key: "pointsV3" as const,
          label: m.results.totalPointsLabel,
          desc: m.results.totalPointsDesc,
          value: pointsV3,
          /** バーは10点満点表示（ボーナス込みで実数値は10超えうる → バーは満タンで頭打ち） */
          barMax: 10,
          format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
        },
      ],
    };
  }, [post.stats, post.league, m]);

  const barAnimateMs = 480;
  const barStaggerMs = 80;

  const shell = `${resultDetailPanelClass({ padding: "p-4", mobile: true })} text-white`;

  const showUpsetBonus = upsetBonus > 1e-6;
  const showStreakBonus = streakBonus > 1e-6;
  const showGoalScorerBonus = goalScorerBonus > 1e-6;

  return (
    <div className={[shell, minHeightClassName ?? "min-h-[280px]"].join(" ")}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
        <LineChart className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
        <span>{m.results.performanceStats}</span>
      </div>

      <div className="space-y-0.5">
        {wcGoalScorer ? (
          <WcGoalScorerResultRow
            label={m.results.wcGoalScorerLabel}
            info={wcGoalScorer}
            compact
          />
        ) : null}

        {rows.map((r, index) => {
          const cap = r.barMax ?? r.max ?? 1;
          const ratio = cap > 0 ? clamp01(r.value / cap) : 0;
          const display =
            r.format != null ? r.format(r.value) : String(r.value);
          const rowIndex = wcGoalScorer ? index + 1 : index;

          return (
            <div
              key={r.key}
              className={RESULT_STAT_ROW_GRID_COMPACT}
            >
              <div className="min-w-0">
                <span className="block truncate whitespace-nowrap text-[10px] font-semibold leading-none text-white">
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                metricKey={r.key}
                animateMs={barAnimateMs}
                delayMs={rowIndex * barStaggerMs}
                size="sm"
              />

              <div
                className={`min-w-0 text-right text-[10px] leading-none ${resultStatsMetricNumClass}`}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5">
        <p className="text-center text-[10px] font-medium leading-snug text-white/75">
          <span className="text-white/90">
            {m.results.basePoints}{" "}
            <span className={resultStatsMetricNumClass}>{fmt1(basePoints)}</span>
          </span>
          {showUpsetBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {m.results.upsetBonusLabel}{" "}
                <span className={resultStatsMetricNumClass}>
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
                <span className={resultStatsMetricNumClass}>
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
                <span className={resultStatsMetricNumClass}>
                  {fmt1(goalScorerBonus)}
                </span>
              </span>
            </>
          )}
          <span className="text-white/35"> = </span>
          <span className={[resultStatsMetricNumClass, "text-orange-200/95"].join(" ")}>
            {totalPoints.toFixed(1)}
          </span>
        </p>
      </div>

      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div key={`${r.key}-desc`} className="text-[11px] leading-snug">
            <span className="font-semibold text-white/80">{r.label}：</span>
            <span className="text-white/55">{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5 text-center">
        <Link
          href="/mobile/help"
          className="text-[11px] text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200"
        >
          {m.results.helpPageLink}
        </Link>
      </div>
      </div>
    </div>
  );
}

export default memo(MobileResultStatsCard);
