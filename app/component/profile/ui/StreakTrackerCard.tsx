"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { CYBER_GLASS_FILL, CYBER_GLASS_PANEL_XL, CYBER_GLASS_SHADOW } from "@/lib/ui/matchOverlayGlass";
import { streakChartLayoutMaxAbs } from "@/lib/profile/streakTrackerChartLayout";
import {
  useProfileStreakTracker,
  STREAK_TRACKER_LAST_N,
  type StreakTrackerPoint,
} from "@/lib/profile/useProfileStreakTracker";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { jp, nameBebas, nameRajdhani, resultStatsMetricNumClass } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { BarChart3, Info, TrendingDown, TrendingUp } from "lucide-react";
import styles from "./profileChartInfoFaq.module.css";

type Layout = "mobile" | "web";

type Props = {
  uid: string | null | undefined;
  language?: Language;
  entranceReady?: boolean;
  layout?: Layout;
  profileStatsContext?: ProfileStatsStreakContext;
};

function formatTick(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function buildYTicks(maxAbs: number): number[] {
  const m = Math.max(1, maxAbs);
  if (m <= 6) {
    const out: number[] = [];
    for (let v = m; v >= 1; v--) out.push(v);
    out.push(0);
    for (let v = -1; v >= -m; v--) out.push(v);
    return out;
  }
  const mid = Math.max(1, Math.floor(m / 2));
  return [...new Set([m, mid, 0, -mid, -m])].sort((a, b) => b - a);
}

function computeWindowStats(points: StreakTrackerPoint[]) {
  let curW = 0;
  let maxW = 0;
  let curL = 0;
  let maxL = 0;
  for (const p of points) {
    if (p.isWin) {
      curW += 1;
      curL = 0;
      maxW = Math.max(maxW, curW);
    } else {
      curL += 1;
      curW = 0;
      maxL = Math.max(maxL, curL);
    }
  }
  const wins = points.filter((p) => p.isWin).length;
  const losses = points.length - wins;
  return { maxWinStreak: maxW, maxLossStreak: maxL, wins, losses, n: points.length };
}

function streakSizes(layout: Layout) {
  if (layout === "web") {
    return {
      outerPad: "p-4 sm:p-5",
      headerValue: "text-3xl sm:text-4xl",
      headerCaption: "text-[10px] sm:text-xs",
      chartBorder: "min-h-0",
      /** プロット（0ライン含む）— Y軸ラベルと列スタックの高さを一致させる */
      plotH: "h-[228px]",
      labelRow: "mt-1 min-h-[18px]",
      loadingEmptyH: "h-[248px]",
      yAxis: "w-11 shrink-0 flex-col justify-between py-0 pr-1.5",
      tick: "text-[10px] leading-none",
      chartInnerPad: "px-1.5 pt-2 pb-1",
      colMinW: 12,
      colMaxW: 28,
      minWidthPerCol: 18,
      colGap: "gap-1",
      indexLbl: "text-[9px]",
      footer: "mt-3 w-full",
    };
  }
  return {
    outerPad: "p-3",
    headerValue: "text-2xl",
    headerCaption: "text-[9px]",
    chartBorder: "min-h-0",
    plotH: "h-[184px]",
    labelRow: "mt-0.5 min-h-[16px]",
    loadingEmptyH: "h-[204px]",
    yAxis: "w-9 shrink-0 flex-col justify-between py-0 pr-1",
    tick: "text-[9px] leading-none",
    chartInnerPad: "px-1 pt-1.5 pb-0.5",
    colMinW: 9,
    colMaxW: 20,
    minWidthPerCol: 12,
    colGap: "gap-0.5",
    indexLbl: "text-[8px]",
    footer: "mt-2.5 w-full",
  };
}

const CHART_GRID_STYLE: CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)
  `,
  backgroundSize: "18px 18px",
};

export default function StreakTrackerCard({
  uid,
  language = "ja",
  entranceReady,
  layout = "mobile",
  profileStatsContext = { rankingLeague: "nba" },
}: Props) {
  const msg = t(language);
  const reduceMotion = useReducedMotion();
  const S = streakSizes(layout);
  const chartSectionRef = useRef<HTMLDivElement>(null);
  /** チャート枠が十分見えたらアニメ開始（1回のみ） */
  const chartInView = useInView(chartSectionRef, {
    once: true,
    amount: 0.28,
    margin: "0px 0px -8% 0px",
  });

  const { points, loading } = useProfileStreakTracker(uid, profileStatsContext);

  const maxAbs = useMemo(() => streakChartLayoutMaxAbs(points), [points]);
  const ticks = useMemo(() => buildYTicks(maxAbs), [maxAbs]);
  const stats = useMemo(() => computeWindowStats(points), [points]);

  const gateOpen = entranceReady !== false;
  /** スクロールでチャートが見えてから 2 段階アニメ（軸・格子→ブロック） */
  const wantsScrollAnim =
    gateOpen && !reduceMotion && !loading && points.length > 0;
  const canAnimate = wantsScrollAnim && chartInView;

  const animMountKey = canAnimate
    ? `run-${points.map((p) => p.postId).join(",")}`
    : "hold";

  const [axesReady, setAxesReady] = useState(false);
  const [blocksReady, setBlocksReady] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setAxesReady(true);
      setBlocksReady(true);
      return;
    }

    if (!gateOpen || loading || points.length === 0) {
      setAxesReady(false);
      setBlocksReady(false);
      return;
    }

    if (!chartInView) {
      setAxesReady(false);
      setBlocksReady(false);
      return;
    }

    setAxesReady(false);
    setBlocksReady(false);
    const tA = requestAnimationFrame(() => setAxesReady(true));
    /** 軸・格子を軽く出したらすぐブロックへ。プロフィール閲覧では即時性を優先する。 */
    const axisPhaseMs =
      layout === "web"
        ? 260 + Math.min(points.length, STREAK_TRACKER_LAST_N) * 8
        : 220 + Math.min(points.length, STREAK_TRACKER_LAST_N) * 7;
    const tB = setTimeout(() => setBlocksReady(true), axisPhaseMs);
    return () => {
      cancelAnimationFrame(tA);
      clearTimeout(tB);
    };
  }, [
    reduceMotion,
    gateOpen,
    loading,
    points.length,
    chartInView,
    layout,
  ]);

  const lastStreak = points.length ? points[points.length - 1]!.streakAfter : 0;
  /** 仕様: 連勝ならその長さ、連敗なら絶対値、ストリーク0相当なら 1 */
  const displayTarget =
    points.length === 0
      ? 0
      : lastStreak > 0
        ? lastStreak
        : lastStreak < 0
          ? Math.abs(lastStreak)
          : 1;
  const showDash = points.length === 0;
  const headerMetricReveal =
    reduceMotion ||
    !wantsScrollAnim ||
    (chartInView && blocksReady);
  const countEnabled =
    points.length > 0 && !loading && headerMetricReveal;
  const countUp = useCountUp(displayTarget, 780, countEnabled, 1);

  const winStreakCaption = msg.profile.winStreak;
  const lossStreakCaption = msg.profile.lossStreak;
  const flatCaption = msg.profile.lastPick;
  const caption =
    lastStreak > 0
      ? winStreakCaption
      : lastStreak < 0
        ? lossStreakCaption
        : points.length > 0
          ? flatCaption
          : "—";

  const loadingMsg = msg.common.loading;

  const winLabel = msg.profile.win;
  const lossLabel = msg.profile.loss;

  /** 列が左→右へ流れるように stagger（間隔をほんの少し長め） */
  const staggerStep = layout === "web" ? 0.165 : 0.118;
  const staggerDelay = layout === "web" ? 0.185 : 0.14;
  /** 列内ブロックの積み上げ間隔 */
  const blockStagger = layout === "web" ? 0.098 : 0.078;

  const subtitle = msg.profile.last20TrackerDesc.replace("{n}", String(STREAK_TRACKER_LAST_N));
  /** Info 用（表示サブタイトルと同じ文言のみ） */
  const chartInfoTooltipMsg = subtitle;
  const emptyHint = subtitle;

  const statWinLabel = msg.profile.bestWStreak;
  const statLossLabel = msg.profile.bestLStreak;
  const statRecordLabel = msg.profile.last20TrackerSubtitle.replace("{n}", String(STREAK_TRACKER_LAST_N));
  const statRecordValue = `${stats.wins}-${stats.losses}`;

  const shellCls = `${CYBER_GLASS_PANEL_XL} shadow-[0_10px_30px_rgba(0,0,0,0.45)]`;

  return (
    <div className={[shellCls, S.outerPad].join(" ")}>
      <m.div
        className="pointer-events-none absolute inset-0"
        style={PROFILE_SHELL_GRID_STYLE}
        initial={false}
        animate={
          gateOpen && points.length > 0
            ? { opacity: 0.38 }
            : { opacity: 0.2 }
        }
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <div className="relative z-1">
        <div className="relative z-20 mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div
                className={[
                  nameRajdhani.className,
                  "font-semibold tracking-wide text-white/95",
                  layout === "web"
                    ? "text-xl sm:text-[1.72rem]"
                    : "text-lg",
                ].join(" ")}
              >
                {msg.profile.last20Tracker}
              </div>
              <div className={styles.wrap}>
                <button
                  type="button"
                  className={styles.faqButton}
                  aria-label={chartInfoTooltipMsg}
                >
                  <Info className="shrink-0" strokeWidth={1.75} aria-hidden />
                </button>
                <div className={styles.tooltip} aria-hidden>
                  {chartInfoTooltipMsg}
                </div>
              </div>
            </div>
            <p
              className={[
                language === "ja" ? jp.className : "",
                "mt-1.5 max-w-[560px] text-xs leading-relaxed text-slate-400 sm:text-[14px]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col items-center self-end text-center">
            <div
              className={[
                "relative inline-flex aspect-square items-center justify-center",
                layout === "web"
                  ? "min-h-12 min-w-12 sm:min-h-14 sm:min-w-14"
                  : "min-h-11 min-w-11",
              ].join(" ")}
            >
              {!showDash &&
                !(wantsScrollAnim && !headerMetricReveal) &&
                points.length > 0 && (
                  <span
                    className={[
                      "pointer-events-none absolute inset-0 rounded-full",
                      lastStreak > 0 &&
                        "bg-amber-400/14 ring-1 ring-inset ring-amber-300/18",
                      lastStreak < 0 &&
                        "bg-rose-500/14 ring-1 ring-inset ring-rose-400/18",
                      lastStreak === 0 &&
                        "bg-white/[0.07] ring-1 ring-inset ring-white/12",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden
                  />
                )}
              {showDash ? (
                <span
                  className={`relative z-1 ${resultStatsMetricNumClass} text-white/35 ${S.headerValue}`}
                >
                  —
                </span>
              ) : wantsScrollAnim && !headerMetricReveal ? (
                <span
                  className={`relative z-1 ${resultStatsMetricNumClass} text-white/25 ${S.headerValue}`}
                >
                  —
                </span>
              ) : (
                <span
                  className={[
                    "relative z-1",
                    resultStatsMetricNumClass,
                    S.headerValue,
                    lastStreak > 0 && "text-amber-200",
                    lastStreak < 0 && "text-rose-200",
                    lastStreak === 0 && "text-white/95",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {countUp}
                </span>
              )}
            </div>
            <span
              className={[
                "mt-1 max-w-36 leading-tight text-slate-400",
                S.headerCaption,
                language === "ja" ? jp.className : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {caption}
            </span>
          </div>
        </div>

        <div
          ref={chartSectionRef}
          className={`relative z-0 overflow-hidden rounded-2xl border border-white/10 ${CYBER_GLASS_FILL} ${CYBER_GLASS_SHADOW} ${S.chartBorder}`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.52]"
            style={CHART_GRID_STYLE}
            aria-hidden
          />
          <div className="relative z-1">
            {loading ? (
              <div
                className={`grid place-items-center text-sm text-white/60 ${S.loadingEmptyH}`}
              >
                {loadingMsg}
              </div>
            ) : points.length === 0 ? (
              <div
                role="status"
                className={`grid place-items-center px-4 text-center ${S.loadingEmptyH}`}
              >
                <p
                  className={[
                    nameBebas.className,
                    "text-center text-[clamp(1.1rem,3.5vw,1.65rem)] leading-none tracking-[0.18em]",
                  ].join(" ")}
                  style={cyberNoDataLabelStyle}
                >
                  NO DATA
                </p>
                <p className="mt-2 max-w-[240px] text-center text-[10px] text-white/45 sm:text-xs">
                  {emptyHint}
                </p>
              </div>
            ) : !gateOpen ? (
              <div className={S.loadingEmptyH} aria-hidden />
            ) : (
              <div className={`flex items-start ${S.chartInnerPad}`}>
                <m.div
                  className={`flex ${S.yAxis} ${S.plotH} text-right`}
                  initial={false}
                  animate={
                    axesReady
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: layout === "web" ? -12 : -8 }
                  }
                  transition={{
                    duration: 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {ticks.map((t) => (
                    <span
                      key={t}
                      className={`tabular-nums text-slate-400 ${S.tick}`}
                    >
                      {formatTick(t)}
                    </span>
                  ))}
                </m.div>

                <div className="relative min-h-0 min-w-0 flex-1 overflow-x-auto">
                  <div
                    className="flex min-w-0 flex-col"
                    style={{
                      minWidth: `${Math.max(points.length * S.minWidthPerCol, layout === "web" ? 160 : 100)}px`,
                    }}
                  >
                    <div className={`relative ${S.plotH} shrink-0`}>
                      <m.div
                        className="pointer-events-none absolute left-0 right-0 top-1/2 z-2 h-px -translate-y-1/2 bg-cyan-200/45"
                        initial={false}
                        animate={
                          axesReady
                            ? { scaleX: 1, opacity: 1 }
                            : { scaleX: 0, opacity: 0 }
                        }
                        style={{ transformOrigin: "50% 50%" }}
                        transition={{
                          duration: 0.55,
                          delay: 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        aria-hidden
                      />

                      {reduceMotion ? (
                        <div
                          className={`relative z-3 flex h-full items-stretch justify-start ${S.colGap}`}
                        >
                          {points.map((p, i) => (
                            <StreakColumn
                              key={p.postId}
                              point={p}
                              index={i}
                              maxAbs={maxAbs}
                              winLabel={winLabel}
                              lossLabel={lossLabel}
                              layout={layout}
                              sizes={S}
                              mode="static"
                              blockStagger={blockStagger}
                            />
                          ))}
                        </div>
                      ) : wantsScrollAnim && !chartInView ? (
                        <div
                          className={`relative z-3 flex h-full items-stretch justify-start ${S.colGap}`}
                          aria-hidden
                        />
                      ) : canAnimate && !blocksReady ? (
                        <div
                          className={`relative z-3 flex h-full items-stretch justify-start ${S.colGap}`}
                          aria-hidden
                        />
                      ) : (
                        <m.div
                          key={`blk-${animMountKey}`}
                          className={`relative z-3 flex h-full items-stretch justify-start ${S.colGap}`}
                          initial={canAnimate ? "hidden" : false}
                          animate="show"
                          variants={{
                            hidden: {},
                            show: {
                              transition: {
                                staggerChildren: staggerStep,
                                delayChildren: staggerDelay,
                              },
                            },
                          }}
                        >
                          {points.map((p, i) => (
                            <StreakColumn
                              key={p.postId}
                              point={p}
                              index={i}
                              maxAbs={maxAbs}
                              winLabel={winLabel}
                              lossLabel={lossLabel}
                              layout={layout}
                              sizes={S}
                              mode={canAnimate ? "animate" : "static"}
                              blockStagger={blockStagger}
                            />
                          ))}
                        </m.div>
                      )}
                    </div>

                    <div
                      className={`flex shrink-0 justify-start ${S.colGap} ${S.labelRow}`}
                    >
                      {points.map((p, i) => {
                        return (
                          <div
                            key={`xl-${p.postId}`}
                            className="flex flex-1 flex-col items-center justify-center"
                            style={{
                              minWidth: S.colMinW,
                              maxWidth: S.colMaxW,
                            }}
                          >
                            <m.span
                              className={[
                                "tabular-nums",
                                S.indexLbl,
                                "text-slate-500",
                              ].join(" ")}
                              initial={false}
                              animate={axesReady ? { opacity: 1 } : { opacity: 0 }}
                              transition={{
                                duration: 0.42,
                                delay: 0.065 * i,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              {i + 1}
                            </m.span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {points.length > 0 && gateOpen ? (
          <m.div
            className={S.footer}
            initial={false}
            animate={
              blocksReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
            }
            transition={{
              duration: 0.48,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className={[
                "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
                language === "ja" ? jp.className : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="order-1 flex min-h-13 items-center justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] px-3 py-2.5 sm:min-h-0 sm:gap-3 sm:px-3.5 sm:py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <TrendingUp
                    className="h-4 w-4 shrink-0 text-emerald-300 sm:h-5 sm:w-5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span
                    className={[
                      "min-w-0 leading-tight text-emerald-100/90",
                      language !== "ja"
                        ? "text-[10px] font-semibold uppercase tracking-[0.14em]"
                        : "text-[11px] font-medium",
                    ].join(" ")}
                  >
                    {statWinLabel}
                  </span>
                </div>
                <div
                  className={`shrink-0 text-3xl leading-none text-emerald-200 sm:text-4xl ${resultStatsMetricNumClass}`}
                >
                  {stats.maxWinStreak}
                </div>
              </div>
              <div className="order-2 flex min-h-13 items-center justify-between gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-3 py-2.5 sm:min-h-0 sm:gap-3 sm:px-3.5 sm:py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <TrendingDown
                    className="h-4 w-4 shrink-0 text-rose-300 sm:h-5 sm:w-5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span
                    className={[
                      "min-w-0 leading-tight text-rose-100/90",
                      language !== "ja"
                        ? "text-[10px] font-semibold uppercase tracking-[0.14em]"
                        : "text-[11px] font-medium",
                    ].join(" ")}
                  >
                    {statLossLabel}
                  </span>
                </div>
                <div
                  className={`shrink-0 text-3xl leading-none text-rose-200 sm:text-4xl ${resultStatsMetricNumClass}`}
                >
                  {stats.maxLossStreak}
                </div>
              </div>
              <div className="order-3 col-span-2 flex min-h-13 items-center justify-between gap-2 rounded-xl border border-sky-400/20 bg-sky-500/6 px-3 py-2.5 sm:col-span-1 sm:min-h-0 sm:gap-3 sm:px-3.5 sm:py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <BarChart3
                    className="h-4 w-4 shrink-0 text-sky-300 sm:h-5 sm:w-5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span
                    className={[
                      "min-w-0 leading-tight text-slate-200/90",
                      language !== "ja"
                        ? "text-[10px] font-semibold uppercase tracking-[0.14em]"
                        : "text-[11px] font-medium",
                    ].join(" ")}
                  >
                    {statRecordLabel}
                  </span>
                </div>
                <div
                  className={`shrink-0 text-3xl leading-none text-white/95 sm:text-4xl ${resultStatsMetricNumClass}`}
                >
                  {statRecordValue}
                </div>
              </div>
            </div>
          </m.div>
        ) : null}
      </div>
    </div>
  );
}

type Sizes = ReturnType<typeof streakSizes>;

const BLOCK_GAP_PX = 1;

function blockHeightExpr(maxAbs: number) {
  const g = (maxAbs - 1) * BLOCK_GAP_PX;
  return `calc((100% - ${g}px) / ${maxAbs})`;
}

function StreakColumn({
  point,
  index,
  maxAbs,
  winLabel,
  lossLabel,
  layout,
  sizes: S,
  mode,
  blockStagger,
}: {
  point: StreakTrackerPoint;
  index: number;
  maxAbs: number;
  winLabel: string;
  lossLabel: string;
  layout: Layout;
  sizes: Sizes;
  mode: "static" | "animate";
  blockStagger: number;
}) {
  const s = point.streakAfter;
  const n = Math.abs(s);
  const blocks = Array.from({ length: n }, (_, i) => i);
  const hExpr = blockHeightExpr(maxAbs);

  const maxW =
    layout === "web"
      ? "max-w-[22px] sm:max-w-[24px]"
      : "max-w-[16px] sm:max-w-[18px]";

  const titleStr = `#${index + 1} · ${point.isWin ? winLabel : lossLabel} · ${
    s > 0 ? `+${s}` : s < 0 ? `${s}` : "0"
  }`;

  const flowEase = [0.2, 0.85, 0.24, 1] as const;
  const colVariants = {
    hidden: {
      opacity: 0,
      x: layout === "web" ? -22 : -16,
      y: layout === "web" ? 5 : 4,
    },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: layout === "web" ? 0.56 : 0.5,
        ease: flowEase,
      },
    },
  };

  const blockTween = (i: number) => ({
    type: "tween" as const,
    duration: layout === "web" ? 0.58 : 0.52,
    ease: flowEase,
    delay: i * blockStagger,
  });

  const plot = (
    <div className="relative h-full w-full min-h-0">
      {/* 上側＝プラス（0 から上に積む） */}
      <div className="absolute inset-x-0 top-0 flex h-1/2 flex-col-reverse items-center justify-start gap-px">
        {s > 0 &&
          blocks.map((i) =>
            mode === "animate" ? (
              <m.div
                key={i}
                className={`w-[82%] shrink-0 rounded-[2px] bg-emerald-400/92 shadow-[0_0_6px_rgba(52,211,153,0.22)] ${maxW}`}
                style={{
                  height: hExpr,
                  transformOrigin: "bottom center",
                }}
                initial={{ scaleY: 0, opacity: 0.1 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={blockTween(i)}
              />
            ) : (
              <div
                key={i}
                className={`w-[82%] shrink-0 rounded-[2px] bg-emerald-400/92 shadow-[0_0_6px_rgba(52,211,153,0.22)] ${maxW}`}
                style={{ height: hExpr }}
              />
            )
          )}
      </div>
      {/* 下側＝マイナス（0 から下に積む） */}
      <div className="absolute inset-x-0 top-1/2 flex h-1/2 flex-col items-center justify-start gap-px">
        {s < 0 &&
          blocks.map((i) =>
            mode === "animate" ? (
              <m.div
                key={i}
                className={`w-[82%] shrink-0 rounded-[2px] bg-rose-400/92 shadow-[0_0_6px_rgba(251,113,133,0.18)] ${maxW}`}
                style={{
                  height: hExpr,
                  transformOrigin: "top center",
                }}
                initial={{ scaleY: 0, opacity: 0.1 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={blockTween(i)}
              />
            ) : (
              <div
                key={i}
                className={`w-[82%] shrink-0 rounded-[2px] bg-rose-400/92 shadow-[0_0_6px_rgba(251,113,133,0.18)] ${maxW}`}
                style={{ height: hExpr }}
              />
            )
          )}
        {s === 0 && (
          <div className="absolute left-1/2 top-0 h-1 w-[65%] max-w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/22 sm:max-w-[14px]" />
        )}
      </div>
    </div>
  );

  if (mode === "static") {
    return (
      <div
        className="group flex h-full min-h-0 flex-1 flex-col"
        style={{
          minWidth: S.colMinW,
          maxWidth: S.colMaxW,
        }}
        title={titleStr}
      >
        {plot}
      </div>
    );
  }

  return (
    <m.div
      className="group flex h-full min-h-0 flex-1 flex-col"
      style={{
        minWidth: S.colMinW,
        maxWidth: S.colMaxW,
      }}
      variants={colVariants}
      initial="hidden"
      animate="show"
      title={titleStr}
    >
      {plot}
    </m.div>
  );
}
