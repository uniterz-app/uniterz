"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { LineChart } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
} from "@/app/component/result/WcGoalScorerResultRow";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
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
  /** レーティングバー用の上限（未指定なら max） */
  barMax?: number;
  format?: (v: number) => string;
  Icon?: React.ComponentType<{ className?: string }>;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function ResultStatsCard({
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

    return {
      basePoints,
      upsetBonus,
      streakBonus,
      goalScorerBonus,
      totalPoints: pointsV3,
      rows: [
        {
          key: "scorePrecision",
          label: m.results.scorePrecisionLabel,
          desc: m.results.scorePrecisionDesc,
          value: scorePrecision,
          max: 10,
          barMax: 10,
          format: (v) => v.toFixed(1),
        },
        {
          key: "upsetPoints",
          label: m.results.upsetPointsLabel,
          desc: m.results.upsetPointsDesc,
          value: upsetPoints,
          max: 10,
          barMax: 10,
          format: (v) =>
            hadUpsetGame
              ? `${(Math.round(v * 10) / 10).toFixed(1)}`
              : "--",
        },
        {
          key: "pointsV3",
          label: m.results.totalPointsLabel,
          desc: m.results.totalPointsDesc,
          value: pointsV3,
          /** バーは10点満点表示（ボーナス込みで実数値は10超えうる → バーは満タンで頭打ち） */
          barMax: 10,
          format: (v) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
        },
      ],
    };
  }, [post.stats, m]);

  const barAnimateMs = 520;
  const barStaggerMs = 90;

  const shell = inOverlay
    ? `${MATCH_OVERLAY_GLASS_PANEL} relative overflow-hidden p-5`
    : "relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]";

  const showUpsetBonus = upsetBonus > 1e-6;
  const showStreakBonus = streakBonus > 1e-6;
  const showGoalScorerBonus = goalScorerBonus > 1e-6;

  return (
    <div className={[shell, minHeightClassName ?? "min-h-[320px]"].join(" ")}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <LineChart className="h-5 w-5 shrink-0 text-orange-400 sm:h-6 sm:w-6" aria-hidden />
        <span>{m.results.performanceStats}</span>
      </div>

      <div className="space-y-1">
        {wcGoalScorer ? (
          <WcGoalScorerResultRow
            label={m.results.wcGoalScorerLabel}
            info={wcGoalScorer}
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
              className="flex items-center gap-2.5 sm:gap-3"
            >
              <div className="flex w-32 min-w-0 shrink-0 sm:w-34">
                <span className="truncate text-[13px] font-semibold text-white sm:text-[15px]">
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                animateMs={barAnimateMs}
                delayMs={rowIndex * barStaggerMs}
                size="md"
              />

              <div
                className={`w-12 shrink-0 text-right text-[14px] text-white sm:w-14 sm:text-[16px] ${resultStatsMetricNumClass}`}
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
