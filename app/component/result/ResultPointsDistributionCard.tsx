// app/component/result/ResultPointsDistributionCard.tsx
"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  type GamePointsDistributionV1,
  DUMMY_GAME_POINTS_DISTRIBUTION,
} from "@/lib/results/gamePointsDistribution";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";

function useMetricCountUp(
  target: number,
  decimals: number,
  active: boolean,
  durationMs: number,
  reduceMotion: boolean,
  startDelayMs = 0
) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setV(roundMetricDecimals(target, decimals));
      return;
    }
    if (!active) {
      setV(0);
      return;
    }
    let cancelled = false;
    const delayTimer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min((now - start) / durationMs, 1);
        setV(roundMetricDecimals(target * p, decimals));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
    };
  }, [target, decimals, active, durationMs, reduceMotion, startDelayMs]);

  return v;
}

type Props = {
  post: PredictionPostV2;
  /** 未指定・null はダミー（UI 確認用）。games.pointsDistribution を渡す */
  distribution?: GamePointsDistributionV1 | null;
  language?: Language;
  inOverlay?: boolean;
  compact?: boolean;
};

/** チャート縦軸の表示上限（pointsV3 が連勝・アップセットで 10 超でもここで頭打ち） */
const SCORE_MIN = 0;
const SCORE_CHART_MAX = 10;
/** 勝者的中の下限（スコア 0〜4 と 4〜10 で縦の割り当てを変える） */
const SCORE_HIT_FLOOR = 4;
/**
 * プロット高さのうち 0〜4 が占める割合。小さいほど 0 と 4 が縦に近づく（4〜10 を広く使う）。
 */
const PLOT_HEIGHT_SHARE_0_TO_4 = 0.07;
const CHART_W = 320;
const CHART_H = 200;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 8;
const PAD_B = 28;

const FLOW_EASE = [0.22, 1, 0.36, 1] as const;

/** 他ユーザーの点（スレート寄りのラベンダー） */
const PEER_DOT_FILL = "rgba(196, 181, 253, 0.52)";
/** 自分の点（アンバー系・グローも同色） */
const YOU_HALO_FILL = "rgba(251, 191, 36, 0.22)";
const YOU_CORE_FILL = "#fbbf24";
const YOU_CORE_STROKE = "rgba(255, 252, 241, 0.9)";
/** 中央値ガイド（図の水平線・凡例で共通色）— 暗背景で判別しやすいシアン */
const MEDIAN_LINE_STROKE = "rgba(34, 211, 238, 0.88)";
const MEDIAN_LEGEND_FILL = "#22d3ee";
/** 平均ガイド — 中央値と寒暖で対比するローズ */
const MEAN_LINE_STROKE = "rgba(251, 113, 133, 0.88)";
const MEAN_LEGEND_FILL = "#fb7185";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** 決定的ジッター（インデックスのみ、同データで同配置） */
function jitter01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clampChartScore(raw: number): number {
  return clamp(raw, SCORE_MIN, SCORE_CHART_MAX);
}

function scoreToY(score: number): number {
  const H = CHART_H - PAD_T - PAD_B;
  const yBottom = PAD_T + H;
  const yTop = PAD_T;
  const band04 = PLOT_HEIGHT_SHARE_0_TO_4 * H;
  const yAt4 = yBottom - band04;

  if (score <= SCORE_HIT_FLOOR) {
    const t = score / SCORE_HIT_FLOOR;
    return yBottom - t * band04;
  }
  const t =
    (score - SCORE_HIT_FLOOR) / (SCORE_CHART_MAX - SCORE_HIT_FLOOR);
  return yAt4 - t * (yAt4 - yTop);
}

type Dot = { x: number; y: number; kind: "peer" | "you" };

function buildDotsFromDistribution(
  dist: GamePointsDistributionV1,
  myScore: number | null,
  maxDots: number
): Dot[] {
  const dots: Dot[] = [];
  let idx = 0;
  const totalPeers = dist.bins.reduce((s, b) => s + b.count, 0);
  const scale = totalPeers > maxDots ? maxDots / totalPeers : 1;

  for (const bin of dist.bins) {
    const take = Math.max(0, Math.round(bin.count * scale));
    const span = bin.hi - bin.lo;
    for (let k = 0; k < take; k++) {
      const t = jitter01(idx, 1);
      const u = jitter01(idx, 2);
      const score =
        span <= 0
          ? clampChartScore(bin.lo)
          : clampChartScore(bin.lo + span * (0.08 + t * 0.84));
      const nx = PAD_L + u * (CHART_W - PAD_L - PAD_R);
      dots.push({ x: nx, y: scoreToY(score), kind: "peer" });
      idx += 1;
    }
  }

  if (myScore != null && Number.isFinite(myScore)) {
    const s = clampChartScore(myScore);
    dots.push({
      x: PAD_L + (CHART_W - PAD_L - PAD_R) * 0.52,
      y: scoreToY(s),
      kind: "you",
    });
  }

  return dots;
}

const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;
const PLOT_BOTTOM = CHART_H - PAD_B;
const AXIS_V_LEN = PLOT_BOTTOM - PAD_T;
const AXIS_H_LEN = PLOT_W;

export default function ResultPointsDistributionCard({
  post,
  distribution,
  language = "ja",
  inOverlay = false,
  compact = false,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const isEn = language === "en";
  const reduceMotion = useReducedMotion();
  const chartSectionRef = useRef<HTMLDivElement>(null);
  const statsRowRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartSectionRef, {
    once: true,
    amount: 0.28,
    margin: "0px 0px -8% 0px",
  });
  const statsInView = useInView(statsRowRef, {
    once: true,
    amount: 0.35,
    margin: "0px 0px -12% 0px",
  });

  const useSamplePeers = distribution == null;
  const dist = useSamplePeers ? DUMMY_GAME_POINTS_DISTRIBUTION : distribution;

  const myScoreRaw = post.stats?.pointsV3;
  const myScore =
    typeof myScoreRaw === "number" && Number.isFinite(myScoreRaw) ? myScoreRaw : null;

  const dots = useMemo(
    () => buildDotsFromDistribution(dist, myScore, compact ? 220 : 320),
    [dist, myScore, compact]
  );

  const peerDots = useMemo(
    () => dots.filter((d) => d.kind === "peer"),
    [dots]
  );
  const youDot = useMemo(
    () => dots.find((d) => d.kind === "you") ?? null,
    [dots]
  );

  const animMountKey = useMemo(
    () =>
      `${dist.n}-${peerDots.length}-${myScore ?? "x"}-${compact ? "c" : "w"}`,
    [dist.n, peerDots.length, myScore, compact]
  );

  const [axesReady, setAxesReady] = useState(false);
  const [plotReady, setPlotReady] = useState(false);
  const [peersReady, setPeersReady] = useState(false);
  const [youReady, setYouReady] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setAxesReady(true);
      setPlotReady(true);
      setPeersReady(true);
      setYouReady(true);
      return;
    }

    if (!chartInView) {
      setAxesReady(false);
      setPlotReady(false);
      setPeersReady(false);
      setYouReady(false);
      return;
    }

    setAxesReady(false);
    setPlotReady(false);
    setPeersReady(false);
    setYouReady(false);

    const plotDelay = compact ? 560 : 680;
    const peersBaseDelay = compact ? 1180 : 1380;
    const peerStaggerCap = compact ? 820 : 980;
    const peerStaggerMs = Math.min(
      peerDots.length * (compact ? 17 : 20),
      peerStaggerCap
    );
    const youExtra = compact ? 420 : 520;

    const tAxes = setTimeout(() => setAxesReady(true), 80);
    const tPlot = setTimeout(() => setPlotReady(true), plotDelay);
    const tPeers = setTimeout(() => setPeersReady(true), peersBaseDelay);
    const tYou = setTimeout(
      () => setYouReady(true),
      peersBaseDelay + peerStaggerMs + youExtra
    );

    return () => {
      clearTimeout(tAxes);
      clearTimeout(tPlot);
      clearTimeout(tPeers);
      clearTimeout(tYou);
    };
  }, [chartInView, reduceMotion, animMountKey, peerDots.length, compact]);

  const shell = inOverlay
    ? `${MATCH_OVERLAY_GLASS_PANEL} relative overflow-hidden text-white ${compact ? "p-4" : "p-6"}`
    : [
        "relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 text-white",
        "shadow-[0_14px_40px_rgba(0,0,0,0.55)]",
        compact ? "p-4" : "p-6",
      ].join(" ");

  const title = isEn ? "Score distribution" : "得点の分布";
  const subtitle = useSamplePeers
    ? isEn
      ? "Sample layout — real matches show aggregated scores from this game."
      : "表示イメージ用のサンプルです。本番はこの試合の集計が入ります。"
    : isEn
      ? "All scored posts for this match (same rules as your result)."
      : "この試合の採点済み予想の分布（あなたの得点と同じルール）";
  const scoringNote = useSamplePeers
    ? isEn
      ? "Chart vertical scale tops out at 10; higher scores are drawn at the ceiling."
      : "縦軸の表示上限は 10。それより高い得点はグラフ上端にまとめて表示します。"
    : isEn
      ? "Wrong winner → 0. Hits start at 4; streak/upset bonuses can exceed 10. Chart caps at 10 (ceiling). No 1–3."
      : "勝者を外すと0点。的中は4点から。連勝・アップセットで10点超もあり得ますが、分布図の縦軸は10で頭打ち表示。1〜3点は出ません。";
  const axisLabel = isEn ? "pointsV3" : "総合点 (pointsV3)";
  const youLabel = isEn ? "You" : "あなた";
  const medianLabel = isEn ? "Median" : "中央値";
  const meanLabel = isEn ? "Mean" : "平均";
  const nLabel = isEn ? "n" : "件数";
  const axisFoot = isEn
    ? "0 / 4–10+ · chart max 10"
    : "0 / 4–10+ ・表示上限10";

  const gridYs = [0, 4, 5, 6, 7, 8, 9, 10];

  const wantsAnim = !reduceMotion && chartInView;
  const showPeers = reduceMotion || peersReady;
  const showYou = reduceMotion || youReady;

  const countDuration = compact ? 640 : 780;
  const countActive = statsInView;
  const nDisplay = useMetricCountUp(
    dist.n,
    0,
    countActive,
    countDuration,
    !!reduceMotion,
    0
  );
  const medianTarget = dist.median ?? 0;
  const medianDisplay = useMetricCountUp(
    medianTarget,
    2,
    countActive && dist.median != null,
    countDuration,
    !!reduceMotion,
    compact ? 55 : 70
  );
  const meanTarget = dist.mean ?? 0;
  const meanDisplay = useMetricCountUp(
    meanTarget,
    2,
    countActive && dist.mean != null,
    countDuration,
    !!reduceMotion,
    compact ? 110 : 140
  );

  const statsLabelClass = compact
    ? "text-[13px] sm:text-[15px] text-white/80"
    : "text-[15px] sm:text-base text-white/80";
  const statsNumClass = compact
    ? "text-[15px] sm:text-lg font-semibold tabular-nums text-white"
    : "text-lg sm:text-xl font-semibold tabular-nums text-white";

  return (
    <div className={shell}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      <div className={compact ? "mb-3" : "mb-4"}>
        <div className="flex items-start gap-2">
          <BarChart3
            className={[
              "h-5 w-5 shrink-0 text-violet-300/90",
              compact ? "mt-px" : "mt-0.5",
            ].join(" ")}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div
              className={[
                "font-semibold leading-tight text-white",
                compact ? "text-[13px]" : "text-base",
              ].join(" ")}
            >
              {title}
            </div>
            <div className="mt-0.5 text-[10px] leading-snug text-white/45 sm:text-[11px]">
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={statsRowRef}
        className={[
          "mb-4 flex flex-wrap gap-x-6 gap-y-2",
          compact ? "mb-3" : "",
        ].join(" ")}
      >
        <span className={`inline-flex items-baseline gap-2 ${statsLabelClass}`}>
          <span className="font-medium">{nLabel}:</span>
          <span className={`${statsNumClass} ${resultStatsMetricNumClass}`}>
            {nDisplay}
          </span>
        </span>
        {dist.median != null && (
          <span className={`inline-flex items-baseline gap-2 ${statsLabelClass}`}>
            <span
              className={[
                "mb-px shrink-0 self-center rounded-full",
                compact ? "h-[2px] w-3.5 sm:w-4" : "h-[2.5px] w-4 sm:w-[18px]",
              ].join(" ")}
              style={{ backgroundColor: MEDIAN_LEGEND_FILL }}
              aria-hidden
            />
            <span className="font-medium">{medianLabel}:</span>
            <span className={`${statsNumClass} ${resultStatsMetricNumClass}`}>
              {medianDisplay.toFixed(2)}
            </span>
          </span>
        )}
        {dist.mean != null && (
          <span className={`inline-flex items-baseline gap-2 ${statsLabelClass}`}>
            <span
              className={[
                "mb-px shrink-0 self-center rounded-full",
                compact ? "h-[2px] w-3.5 sm:w-4" : "h-[2.5px] w-4 sm:w-[18px]",
              ].join(" ")}
              style={{ backgroundColor: MEAN_LEGEND_FILL }}
              aria-hidden
            />
            <span className="font-medium">{meanLabel}:</span>
            <span className={`${statsNumClass} ${resultStatsMetricNumClass}`}>
              {meanDisplay.toFixed(2)}
            </span>
          </span>
        )}
      </div>

      <div
        ref={chartSectionRef}
        className="flex justify-center overflow-x-auto"
      >
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="max-w-full"
          role="img"
          aria-label={title}
        >
          <defs>
            <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 縦軸（プロット左縁）— 下から伸ばす（dash で描画） */}
          <motion.line
            x1={PAD_L}
            y1={PLOT_BOTTOM}
            x2={PAD_L}
            y2={PAD_T}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
            strokeLinecap="round"
            strokeDasharray={AXIS_V_LEN}
            initial={false}
            animate={
              axesReady
                ? { strokeDashoffset: 0, opacity: 1 }
                : { strokeDashoffset: AXIS_V_LEN, opacity: 0 }
            }
            transition={{ duration: 0.88, ease: FLOW_EASE }}
          />

          {/* 横軸（プロット下縁）— 左から伸ばす */}
          <motion.line
            x1={PAD_L}
            y1={PLOT_BOTTOM}
            x2={CHART_W - PAD_R}
            y2={PLOT_BOTTOM}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
            strokeLinecap="round"
            strokeDasharray={AXIS_H_LEN}
            initial={false}
            animate={
              axesReady
                ? { strokeDashoffset: 0, opacity: 1 }
                : { strokeDashoffset: AXIS_H_LEN, opacity: 0 }
            }
            transition={{ duration: 0.88, delay: 0.14, ease: FLOW_EASE }}
          />

          <motion.rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            rx={6}
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.08)"
            initial={false}
            animate={
              plotReady
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.985 }
            }
            style={{ transformOrigin: `${PAD_L + PLOT_W / 2}px ${PAD_T + PLOT_H / 2}px` }}
            transition={{ duration: 0.78, ease: FLOW_EASE }}
          />

          {/* 薄いグリッド（横線が左→右に伸びる） */}
          {gridYs.map((g, gi) => {
            const ny = scoreToY(g);
            return (
              <motion.line
                key={`g-${g}`}
                x1={PAD_L}
                x2={CHART_W - PAD_R}
                y1={ny}
                y2={ny}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
                strokeDasharray={PLOT_W}
                initial={false}
                animate={
                  plotReady
                    ? { strokeDashoffset: 0, opacity: 1 }
                    : { strokeDashoffset: PLOT_W, opacity: 0 }
                }
                transition={{
                  duration: 0.45,
                  delay: 0.04 + gi * 0.045,
                  ease: FLOW_EASE,
                }}
              />
            );
          })}

          {gridYs.map((g, gi) => {
            const ny = scoreToY(g);
            return (
              <motion.text
                key={`t-${g}`}
                x={PAD_L - 6}
                y={ny + 3}
                textAnchor="end"
                className="fill-white/40 text-[9px]"
                style={{ fontSize: 9 }}
                initial={false}
                animate={
                  axesReady
                    ? { opacity: 1, x: PAD_L - 6 }
                    : { opacity: 0, x: PAD_L - 14 }
                }
                transition={{
                  duration: 0.58,
                  delay: 0.08 + gi * 0.052,
                  ease: FLOW_EASE,
                }}
              >
                {g === SCORE_CHART_MAX ? `${g}+` : g}
              </motion.text>
            );
          })}

          {dist.median != null && Number.isFinite(dist.median) && (
            <motion.line
              x1={PAD_L}
              x2={CHART_W - PAD_R}
              y1={scoreToY(clampChartScore(dist.median))}
              y2={scoreToY(clampChartScore(dist.median))}
              stroke={MEDIAN_LINE_STROKE}
              strokeWidth={1}
              strokeLinecap="round"
              vectorEffect="nonScalingStroke"
              strokeDasharray={PLOT_W}
              initial={false}
              animate={
                plotReady
                  ? { strokeDashoffset: 0, opacity: 1 }
                  : { strokeDashoffset: PLOT_W, opacity: 0 }
              }
              transition={{
                duration: 0.52,
                delay: 0.22,
                ease: FLOW_EASE,
              }}
            />
          )}
          {dist.mean != null && Number.isFinite(dist.mean) && (
            <motion.line
              x1={PAD_L}
              x2={CHART_W - PAD_R}
              y1={scoreToY(clampChartScore(dist.mean))}
              y2={scoreToY(clampChartScore(dist.mean))}
              stroke={MEAN_LINE_STROKE}
              strokeWidth={1}
              strokeLinecap="round"
              vectorEffect="nonScalingStroke"
              strokeDasharray={PLOT_W}
              initial={false}
              animate={
                plotReady
                  ? { strokeDashoffset: 0, opacity: 1 }
                  : { strokeDashoffset: PLOT_W, opacity: 0 }
              }
              transition={{
                duration: 0.52,
                delay: 0.3,
                ease: FLOW_EASE,
              }}
            />
          )}

          {showPeers &&
            peerDots.map((d, i) => (
              <g key={`p-${animMountKey}-${i}`} transform={`translate(${d.x},${d.y})`}>
                <motion.circle
                  cx={0}
                  cy={0}
                  r={2.1}
                  fill={PEER_DOT_FILL}
                  initial={
                    wantsAnim ? { opacity: 0, scale: 0.2 } : { opacity: 1, scale: 1 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                    delay: wantsAnim
                      ? Math.min(i, 48) * (compact ? 0.017 : 0.02)
                      : 0,
                  }}
                />
              </g>
            ))}

          {youDot && showYou && (
            <g transform={`translate(${youDot.x},${youDot.y})`}>
              <motion.g
                initial={wantsAnim ? { scale: 0.28, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                }}
              >
                <motion.circle
                  cx={0}
                  cy={0}
                  r={7}
                  fill={YOU_HALO_FILL}
                  animate={
                    reduceMotion
                      ? { scale: 1, opacity: 1 }
                      : {
                          scale: [1, 1.14, 1],
                          opacity: [0.65, 0.95, 0.65],
                        }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 2.65,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.35,
                        }
                  }
                />
                <motion.circle
                  cx={0}
                  cy={0}
                  r={4.2}
                  fill={YOU_CORE_FILL}
                  stroke={YOU_CORE_STROKE}
                  strokeWidth={1.2}
                  filter={`url(#${gid}-glow)`}
                  animate={
                    reduceMotion
                      ? { scale: 1, opacity: 1 }
                      : {
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.9, 1],
                        }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 2.65,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.35,
                        }
                  }
                />
              </motion.g>
            </g>
          )}

          <motion.text
            x={PAD_L + PLOT_W / 2}
            y={CHART_H - 6}
            textAnchor="middle"
            className="fill-white/45 text-[9px]"
            style={{ fontSize: 9 }}
            initial={false}
            animate={
              plotReady ? { opacity: 1, y: CHART_H - 6 } : { opacity: 0, y: CHART_H }
            }
            transition={{ duration: 0.62, delay: 0.2, ease: FLOW_EASE }}
          >
            {axisLabel}（{axisFoot}）
          </motion.text>
        </svg>
      </div>

      <p className="mt-2 text-center text-[10px] leading-snug text-white/45 sm:text-[11px]">
        {scoringNote}
      </p>

      <div
        className={[
          "mt-4 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1",
          compact ? "mt-3" : "",
        ].join(" ")}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={[
              "shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.55)]",
              compact ? "h-2.5 w-2.5" : "h-3 w-3",
            ].join(" ")}
            aria-hidden
          />
          <span className={`font-medium ${statsLabelClass}`}>{youLabel}:</span>
        </span>
        {myScore != null && (
          <span className={`${statsNumClass} ${resultStatsMetricNumClass}`}>
            {myScore.toFixed(2)}
            {myScore > SCORE_CHART_MAX + 1e-6 && (
              <span
                className={[
                  "ml-1.5 font-normal text-white/50",
                  compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm",
                ].join(" ")}
              >
                {isEn ? "· on chart: 10+" : "· 図上は10+"}
              </span>
            )}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
