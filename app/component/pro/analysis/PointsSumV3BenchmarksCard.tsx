"use client";

import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useId, useMemo, useRef } from "react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";

/** 当月の総合得点（合計）と母集団の基準線用 */
export type PointsSumV3Reference = {
  self: number;
  mean: number;
  median: number;
  p90: number;
  max: number;
  /** 母集団ユーザー数（monthly_global_stats_v2.users） */
  cohortUserCount: number;
  /** 合計得点順位（1始まり）。無い月は null */
  selfRank: number | null;
};

type Props = {
  data: PointsSumV3Reference;
  language?: Language;
};

const CHART_W = 308;
const CHART_H = 176;
const Y_LABEL_X = 10;
const PAD_L = 42;
const PAD_R = 6;
const PAD_T = 10;
const PAD_B = 10;

const STROKE_MEAN = "rgba(251, 113, 133, 0.9)";
const STROKE_MEDIAN = "rgba(34, 211, 238, 0.9)";
const STROKE_P90 = "rgba(167, 139, 250, 0.92)";
const STROKE_MAX = "rgba(226, 232, 240, 0.55)";
const STROKE_SELF = "#fbbf24";

const FLOW_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AXES_DUR = 0.42;
const AXES_STAGGER = 0.14;
const GRID_BASE_DELAY = AXES_DUR + AXES_STAGGER * 0.35;
const GRID_STAGGER = 0.05;
const GRID_DUR = 0.38;
const LINE_BASE_DELAY = GRID_BASE_DELAY + GRID_DUR + 0.08;
const LINE_STAGGER = 0.12;
const LINE_DRAW_DUR = 0.48;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function fmtAxis(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 200) return `${Math.round(v)}`;
  if (Math.abs(v) >= 20) return v.toFixed(0);
  return v.toFixed(1);
}

function fmtLegend(v: number) {
  if (!Number.isFinite(v)) return "—";
  return Math.abs(v) >= 100 ? `${Math.round(v)}` : v.toFixed(1);
}

export default function PointsSumV3BenchmarksCard({
  data,
  language = "ja",
}: Props) {
  const m = t(language);
  const isEn = language === "en";
  const uid = useId().replace(/:/g, "");
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartWrapRef, {
    once: true,
    amount: 0.32,
    margin: "0px 0px -8% 0px",
  });
  const reduceMotion = useReducedMotion();
  const play = inView && !reduceMotion;
  const showFinal = inView || !!reduceMotion;

  const { self, mean, median, p90, max, cohortUserCount, selfRank } = data;

  const values = [self, mean, median, p90, max].filter((x) =>
    Number.isFinite(x)
  );
  if (values.length === 0) return null;

  const domainLo = 0;
  const maxVal = Math.max(...values.map((v) => Math.max(0, v)), 1);
  const domainHi = maxVal * 1.06;

  const plotH = CHART_H - PAD_T - PAD_B;
  const plotW = CHART_W - PAD_L - PAD_R;

  const yAt = (v: number) => {
    const t = (domainHi - clamp(v, domainLo, domainHi)) / (domainHi - domainLo);
    return PAD_T + t * plotH;
  };

  const x1 = PAD_L;
  const x2 = PAD_L + plotW;
  const yBottom = CHART_H - PAD_B;
  const yAxisLen = yBottom - PAD_T;
  const yMid = (PAD_T + yBottom) / 2;

  const cohortLabel = isEn
    ? `${Math.max(0, Math.round(cohortUserCount)).toLocaleString()} users`
    : `${Math.max(0, Math.round(cohortUserCount)).toLocaleString()}人`;
  const youLabel = m.profile.you;
  const medianLabel = m.profile.median;
  const meanLabel = m.profile.mean;
  const rankLabel =
    selfRank != null &&
    Number.isFinite(selfRank) &&
    selfRank >= 1 &&
    cohortUserCount > 0
      ? isEn
        ? `#${selfRank} of ${Math.round(cohortUserCount)}`
        : `${Math.round(selfRank)}位 / ${Math.round(cohortUserCount)}人中`
      : null;

  const linesBottomUp = useMemo(() => {
    const defs = [
      {
        id: "mean",
        v: mean,
        stroke: STROKE_MEAN,
        strokeWidth: 1.35,
        dash: undefined as string | undefined,
        labelJa: "平均",
        labelEn: "Mean total",
      },
      {
        id: "median",
        v: median,
        stroke: STROKE_MEDIAN,
        strokeWidth: 1.35,
        labelJa: "中央値",
        labelEn: "Median",
      },
      {
        id: "p90",
        v: p90,
        stroke: STROKE_P90,
        strokeWidth: 1.35,
        labelJa: "上位10%",
        labelEn: "Top 10%",
      },
      {
        id: "max",
        v: max,
        stroke: STROKE_MAX,
        strokeWidth: 1.15,
        dash: "5 4",
        labelJa: "1位",
        labelEn: "1st",
      },
      {
        id: "self",
        v: self,
        stroke: STROKE_SELF,
        strokeWidth: 2.6,
        labelJa: "あなた",
        labelEn: "You",
      },
    ];
    const y = (vv: number) => {
      const tt =
        (domainHi - clamp(vv, domainLo, domainHi)) / (domainHi - domainLo);
      return PAD_T + tt * plotH;
    };
    return defs
      .map((L) => ({ ...L, yy: y(L.v) }))
      .sort((a, b) => b.yy - a.yy);
  }, [mean, median, p90, max, self, domainHi]);

  const tickVals = [0, domainHi / 2, domainHi].map((t) =>
    Math.round(t * 10) / 10
  );

  const legend = linesBottomUp
    .slice()
    .sort((a, b) => {
      const order = ["mean", "median", "p90", "max", "self"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    })
    .map((L) => ({
      ...L,
      label: isEn ? L.labelEn : L.labelJa,
    }));

  const legendDelay =
    LINE_BASE_DELAY +
    linesBottomUp.length * LINE_STAGGER +
    LINE_DRAW_DUR +
    0.06;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 p-3 md:p-4",
        summaryCardShadowSmClass,
        summaryCardShadowLgClass,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
        <div className="mb-2 text-sm font-semibold text-white md:text-base">
          {m.profile.totalPointsComparison}
        </div>

        <p className="mb-2 text-[11px] leading-snug text-white/55 md:text-xs">
          <span className="text-white/70">{m.profile.cohort}: </span>
          {cohortLabel}
          {rankLabel ? (
            <>
              <span className="mx-1.5 text-white/25">·</span>
              <span className="text-white/70">{m.profile.yourRank}: </span>
              {rankLabel}
            </>
          ) : null}
        </p>

        <div ref={chartWrapRef} className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="mx-auto block h-auto w-full max-w-[328px]"
            role="img"
            aria-label={m.profile.totalPointsComparison}
          >
            <defs>
              <filter
                id={`${uid}-selfGlow`}
                x="-80%"
                y="-300%"
                width="260%"
                height="700%"
              >
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <motion.text
              x={Y_LABEL_X}
              y={yMid}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(-90, ${Y_LABEL_X}, ${yMid})`}
              className="fill-white/42 text-[9px]"
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: showFinal ? 1 : 0 }}
              transition={{
                duration: play ? 0.35 : 0,
                delay: play ? GRID_BASE_DELAY + GRID_DUR * 0.2 : 0,
                ease: FLOW_EASE,
              }}
            >
              {m.profile.totalPtsLabel}
            </motion.text>

            {/* 縦軸（下→上） */}
            <motion.line
              x1={PAD_L}
              y1={yBottom}
              x2={PAD_L}
              y2={PAD_T}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1.25}
              strokeLinecap="round"
              vectorEffect="nonScalingStroke"
              strokeDasharray={yAxisLen}
              initial={{ strokeDashoffset: reduceMotion ? 0 : yAxisLen }}
              animate={{
                strokeDashoffset: showFinal ? 0 : yAxisLen,
              }}
              transition={{
                duration: play ? AXES_DUR : 0,
                ease: FLOW_EASE,
              }}
            />

            {/* 横軸（左→右） */}
            <motion.line
              x1={PAD_L}
              y1={yBottom}
              x2={x2}
              y2={yBottom}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1.25}
              strokeLinecap="round"
              vectorEffect="nonScalingStroke"
              strokeDasharray={plotW}
              initial={{ strokeDashoffset: reduceMotion ? 0 : plotW }}
              animate={{
                strokeDashoffset: showFinal ? 0 : plotW,
              }}
              transition={{
                duration: play ? AXES_DUR : 0,
                delay: play ? AXES_STAGGER : 0,
                ease: FLOW_EASE,
              }}
            />

            {tickVals.map((tv, gi) => {
              const yy = yAt(tv);
              return (
                <g key={`tick-${tv}`}>
                  <motion.line
                    x1={x1}
                    x2={x2}
                    y1={yy}
                    y2={yy}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                    vectorEffect="nonScalingStroke"
                    strokeDasharray={plotW}
                    initial={{
                      strokeDashoffset: reduceMotion ? 0 : plotW,
                      opacity: reduceMotion ? 1 : 0,
                    }}
                    animate={{
                      strokeDashoffset: showFinal ? 0 : plotW,
                      opacity: showFinal ? 1 : 0,
                    }}
                    transition={{
                      duration: play ? GRID_DUR : 0,
                      delay: play ? GRID_BASE_DELAY + gi * GRID_STAGGER : 0,
                      ease: FLOW_EASE,
                    }}
                  />
                  <motion.text
                    x={PAD_L - 6}
                    y={yy + 3}
                    textAnchor="end"
                    className="fill-white/45 text-[8px]"
                    initial={{ opacity: reduceMotion ? 1 : 0 }}
                    animate={{ opacity: showFinal ? 1 : 0 }}
                    transition={{
                      duration: play ? 0.32 : 0,
                      delay: play
                        ? GRID_BASE_DELAY + gi * GRID_STAGGER + GRID_DUR * 0.32
                        : 0,
                      ease: FLOW_EASE,
                    }}
                  >
                    {fmtAxis(tv)}
                  </motion.text>
                </g>
              );
            })}

            {linesBottomUp.map((L, i) => {
              const yy = L.yy;
              const delay = LINE_BASE_DELAY + i * LINE_STAGGER;
              const isSelf = L.id === "self";
              const dashPattern = L.dash ?? `${plotW}`;

              return (
                <g key={L.id}>
                  {isSelf ? (
                    <motion.line
                      x1={x1}
                      x2={x2}
                      y1={yy}
                      y2={yy}
                      stroke={STROKE_SELF}
                      strokeWidth={5.5}
                      strokeLinecap="round"
                      vectorEffect="nonScalingStroke"
                      filter={`url(#${uid}-selfGlow)`}
                      strokeDasharray={plotW}
                      initial={{
                        strokeDashoffset: reduceMotion ? 0 : plotW,
                        opacity: reduceMotion ? 0.62 : 0,
                      }}
                      animate={{
                        strokeDashoffset: showFinal ? 0 : plotW,
                        opacity:
                          !showFinal
                            ? 0
                            : play
                              ? [0.38, 0.95, 0.38]
                              : 0.62,
                      }}
                      transition={{
                        strokeDashoffset: {
                          duration: play ? LINE_DRAW_DUR : 0,
                          delay: play ? delay : 0,
                          ease: FLOW_EASE,
                        },
                        opacity: {
                          duration: play ? 2.35 : 0,
                          repeat: play ? Infinity : 0,
                          ease: "easeInOut",
                          delay: play ? delay + LINE_DRAW_DUR * 0.72 : 0,
                        },
                      }}
                    />
                  ) : null}
                  <motion.line
                    x1={x1}
                    x2={x2}
                    y1={yy}
                    y2={yy}
                    stroke={L.stroke}
                    strokeWidth={L.strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={dashPattern}
                    vectorEffect="nonScalingStroke"
                    initial={{
                      strokeDashoffset: reduceMotion ? 0 : plotW,
                    }}
                    animate={{
                      strokeDashoffset: showFinal ? 0 : plotW,
                    }}
                    transition={{
                      duration: play ? LINE_DRAW_DUR : 0,
                      delay: play ? delay : 0,
                      ease: FLOW_EASE,
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <motion.ul
          className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] leading-tight text-white/75 md:text-[11px]"
          initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }}
          animate={{
            opacity: showFinal ? 1 : 0,
            y: showFinal ? 0 : 6,
          }}
          transition={{
            duration: play ? 0.45 : 0,
            delay: play ? legendDelay : 0,
            ease: FLOW_EASE,
          }}
        >
          {legend.map((L) => (
            <li key={L.id} className="flex items-center gap-1.5">
              {L.id === "max" ? (
                <span
                  className="inline-block w-4 shrink-0 border-t border-dashed pt-px"
                  style={{ borderColor: STROKE_MAX }}
                />
              ) : (
                <span
                  className="inline-block h-0.5 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: L.stroke }}
                />
              )}
              <span className="text-white/70">{L.label}</span>
              <span className="tabular-nums text-white/90">{fmtLegend(L.v)}</span>
            </li>
          ))}
        </motion.ul>

        <p className="mt-2 text-[10px] leading-relaxed text-white/45 md:text-[11px]">
          {m.profile.benchmarkExplanation}
        </p>
      </div>
    </div>
  );
}
