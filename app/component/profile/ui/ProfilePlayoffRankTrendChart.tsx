"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { Info } from "lucide-react";
import { nameBebas, nameRajdhani, resultStatsMetricNumClass } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import styles from "./profileChartInfoFaq.module.css";
import { isProfileChartAnimationOff } from "@/lib/profile/profileVisualEffects";

export type ProfilePlayoffRankTrendRow = {
  dateKey: string;
  rank: number;
  labelShort: string;
  date: string;
};

type TrendState = "up" | "down" | "flat";

type Props = {
  data: ProfilePlayoffRankTrendRow[];
  language?: Language;
  entranceSync?: boolean;
  rechartsAfterEntrance?: boolean;
  loading?: boolean;
  visualEffectsLite?: boolean;
};

const LINE = "#22d3ee";
const LINE_GLOW = "rgba(34, 211, 238, 0.45)";
const DOT_REVEAL_MS = 480;
const TREND_THEME: Record<
  TrendState,
  {
    stroke: string;
    fill: string;
    glowNormal: string;
    glowHover: string;
  }
> = {
  up: {
    stroke: "#34d399",
    fill: "rgba(2, 28, 20, 0.92)",
    glowNormal: "rgba(52, 211, 153, 0.35)",
    glowHover: "rgba(52, 211, 153, 0.62)",
  },
  down: {
    stroke: "#fb7185",
    fill: "rgba(36, 7, 17, 0.92)",
    glowNormal: "rgba(251, 113, 133, 0.35)",
    glowHover: "rgba(251, 113, 133, 0.62)",
  },
  flat: {
    stroke: LINE,
    fill: "rgba(5,8,20,0.92)",
    glowNormal: LINE_GLOW,
    glowHover: "rgba(34, 211, 238, 0.65)",
  },
};

function yearsInRows(rows: ProfilePlayoffRankTrendRow[]): Set<number> {
  const ys = new Set<number>();
  for (const r of rows) {
    const y = Number(r.dateKey.slice(0, 4));
    if (Number.isFinite(y)) ys.add(y);
  }
  return ys;
}

/** 横軸用（dateKey は JST の暦日と一致） */
function formatAxisDate(
  dateKey: string,
  lang: Language,
  showYear: boolean
): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(Date.UTC(y, mo - 1, da));
  const locale = lang === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    ...(showYear ? { year: "numeric" as const } : {}),
    month: "numeric",
    day: "numeric",
  }).format(d);
}

function RankMarkerDot(props: {
  cx?: number;
  cy?: number;
  payload?: { rank?: number; trend?: TrendState };
  active?: boolean;
  large?: boolean;
  reveal?: boolean;
}) {
  const {
    cx,
    cy,
    payload,
    active = false,
    large = false,
    reveal = false,
  } = props;
  const rank = payload?.rank;
  const trend: TrendState = payload?.trend ?? "flat";
  if (cx == null || cy == null || rank == null || rank < 1) return null;
  const baseR = large ? 15 : 13;
  const r = active ? baseR + 2 : baseR;
  const baseFont = large ? 12 : 11;
  const fontSize = active ? baseFont + 2 : baseFont;
  const theme = TREND_THEME[trend];
  const glow = active ? theme.glowHover : theme.glowNormal;
  return (
    <g
      className={reveal ? "rank-dot-reveal" : undefined}
      style={reveal ? { transformOrigin: `${cx}px ${cy}px` } : undefined}
    >
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={glow} strokeWidth={4} opacity={0.7} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={theme.fill}
        stroke={theme.stroke}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy}
        dy="0.32em"
        textAnchor="middle"
        className={resultStatsMetricNumClass}
        fill="rgba(248,250,252,0.95)"
        fontSize={fontSize}
        fontWeight={700}
      >
        {rank}
      </text>
    </g>
  );
}

export default function ProfilePlayoffRankTrendChart({
  data,
  language = "ja",
  entranceSync = false,
  rechartsAfterEntrance = false,
  loading = false,
  visualEffectsLite = false,
}: Props) {
  const msg = t(language);
  const chartAnimationsOff = isProfileChartAnimationOff(visualEffectsLite);
  const title = msg.profile.rankingProgress;
  const subtitle = msg.profile.rankingProgressDesc;
  /** Info 用（サブタイトルと同じ文言のみ。他 UI は従来のまま） */
  const chartInfoTooltipMsg = subtitle;
  const emptyHint = msg.profile.rankingProgressNoData;

  const ref = useRef<HTMLDivElement>(null);
  const [ioVisible, setIoVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (entranceSync) return;
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIoVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.95 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [entranceSync]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** ページ内にこのカードが入ってきたタイミングで開始 */
  const chartVisible = entranceSync || ioVisible || chartAnimationsOff;
  const rechartsAnimActive = chartAnimationsOff
    ? false
    : !entranceSync || rechartsAfterEntrance;
  const [showDotsLayer, setShowDotsLayer] = useState(false);
  const [dotRevealActive, setDotRevealActive] = useState(false);
  const [showLineLayer, setShowLineLayer] = useState(false);
  const [lineLayerKey, setLineLayerKey] = useState(0);
  const [linePaintReady, setLinePaintReady] = useState(false);
  const [statsReady, setStatsReady] = useState(false);

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const chartRows = useMemo(
    () =>
      rows.map((row, i) => {
        if (i === 0) return { ...row, trend: "flat" as TrendState };
        const prev = rows[i - 1]?.rank ?? row.rank;
        const trend: TrendState =
          row.rank < prev ? "up" : row.rank > prev ? "down" : "flat";
        return { ...row, trend };
      }),
    [rows]
  );

  const showYearOnXAxis = useMemo(
    () => yearsInRows(chartRows).size > 1,
    [chartRows]
  );

  /** 実データの順位レンジ＋余白（常に 1 固定ではなく動的） */
  const yDomain = useMemo((): [number, number] => {
    if (chartRows.length === 0) return [1, 2];
    let minR = Infinity;
    let maxR = -Infinity;
    for (const r of chartRows) {
      if (typeof r.rank !== "number" || !Number.isFinite(r.rank)) continue;
      minR = Math.min(minR, r.rank);
      maxR = Math.max(maxR, r.rank);
    }
    if (!Number.isFinite(minR) || !Number.isFinite(maxR)) return [1, 2];
    const span = Math.max(1, maxR - minR);
    const pad = Math.max(1, Math.ceil(span * 0.12));
    const lo = Math.max(1, minR - pad);
    const hi = maxR + pad;
    if (lo >= hi) return [Math.max(1, minR - 1), maxR + 1];
    return [lo, hi];
  }, [chartRows]);

  const yTicks = useMemo(() => {
    const [lo, hi] = yDomain;
    const span = hi - lo;
    const step = Math.max(1, Math.ceil(span / 5));
    const ticks: number[] = [];
    let v = Math.ceil(lo / step) * step;
    if (v < lo) v = lo;
    for (; v <= hi; v += step) ticks.push(v);
    if (ticks.length === 0) return [lo, hi];
    if (ticks[0] > lo) ticks.unshift(lo);
    if (ticks[ticks.length - 1] < hi) ticks.push(hi);
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [yDomain]);

  /** ラベルが重ならないよう間引き（0 = 全点） */
  const xAxisInterval = rows.length > 28 ? 3 : rows.length > 18 ? 2 : rows.length > 11 ? 1 : 0;
  const axisTickFontSize = isDesktop ? 11 : 10;
  const axisLabelFontSize = isDesktop ? 10 : 9;
  const trendSummary = useMemo(() => {
    if (chartRows.length === 0) {
      return {
        startRank: null as number | null,
        currentRank: null as number | null,
        netDelta: null as number | null,
        bestJump: null as number | null,
        worstDrop: null as number | null,
      };
    }

    const startRank = chartRows[0]?.rank ?? null;
    const currentRank = chartRows[chartRows.length - 1]?.rank ?? null;
    const netDelta =
      startRank != null && currentRank != null ? startRank - currentRank : null;

    let bestJump: number | null = null;
    let worstDrop: number | null = null;
    for (let i = 1; i < chartRows.length; i++) {
      const prev = chartRows[i - 1]!.rank;
      const cur = chartRows[i]!.rank;
      const d = prev - cur;
      if (d > 0) bestJump = bestJump == null ? d : Math.max(bestJump, d);
      if (d < 0) worstDrop = worstDrop == null ? d : Math.min(worstDrop, d);
    }

    return { startRank, currentRank, netDelta, bestJump, worstDrop };
  }, [chartRows]);

  const chartKey = `${entranceSync ? "e" : "io"}-${rechartsAfterEntrance ? "on" : "off"}-${rows.length}`;

  const isEmpty = !loading && rows.length === 0;
  const currentRankIsTop20 =
    trendSummary.currentRank != null &&
    trendSummary.currentRank >= 1 &&
    trendSummary.currentRank <= 20;

  useEffect(() => {
    if (!chartVisible || chartRows.length === 0) {
      setShowDotsLayer(false);
      setDotRevealActive(false);
      setShowLineLayer(false);
      setStatsReady(false);
      return;
    }
    if (!rechartsAnimActive) {
      setShowDotsLayer(true);
      setDotRevealActive(false);
      setShowLineLayer(true);
      setLineLayerKey((v) => v + 1);
      setStatsReady(true);
      return;
    }
    setShowDotsLayer(false);
    setDotRevealActive(false);
    setShowLineLayer(false);
    setStatsReady(false);

    // 1) 点・数字は全点まとめてフェードアップ
    const LINE_START_DELAY_MS = 240;

    const rafId = requestAnimationFrame(() => {
      setShowDotsLayer(true);
      setDotRevealActive(true);
    });
    const tid = setTimeout(() => {
      // ここから先は点を静的表示（再レンダリングで再アニメしない）
      setDotRevealActive(false);
      setLineLayerKey((v) => v + 1);
      setShowLineLayer(true);
    }, DOT_REVEAL_MS + LINE_START_DELAY_MS);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
    };
  }, [chartVisible, chartRows.length, chartKey, rechartsAnimActive]);

  useEffect(() => {
    if (!showLineLayer) {
      setLinePaintReady(false);
      setStatsReady(false);
      return;
    }

    // ライン開始時の一瞬のフラッシュを避けるため、1フレーム遅らせて可視化
    const rafId = requestAnimationFrame(() => setLinePaintReady(true));

    if (!rechartsAnimActive) {
      setStatsReady(true);
      return () => cancelAnimationFrame(rafId);
    }
    const tid = setTimeout(() => setStatsReady(true), 980);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
    };
  }, [showLineLayer, rechartsAnimActive, lineLayerKey]);

  return (
    <ProfileKinetikPanelFrame ref={ref} className="p-3">
      {/* z をチャートより上にし、下方向の Info ツールチップが SVG に隠れないようにする */}
      <div className="relative z-20 px-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p
                className={[
                  nameRajdhani.className,
                  "font-semibold tracking-wide text-white/95 text-lg sm:text-[1.72rem]",
                ].join(" ")}
              >
                {title}
              </p>
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
          </div>
          {!loading && chartRows.length > 0 && trendSummary.currentRank != null ? (
            <div className="pointer-events-none shrink-0 pt-0.5 text-right">
              <span
                className={[
                  "block text-[9px] leading-tight sm:text-[11px]",
                  currentRankIsTop20 ? "text-amber-200/90" : "text-cyan-100/72",
                ].join(" ")}
              >
                {msg.profile.currentRank}
              </span>
              <span
                className={[
                  "mt-0.5 block leading-none",
                  resultStatsMetricNumClass,
                  isDesktop ? "text-3xl sm:text-[2.35rem]" : "text-2xl",
                  currentRankIsTop20 ? "text-amber-300" : "text-cyan-100",
                ].join(" ")}
              >
                {trendSummary.currentRank}
              </span>
            </div>
          ) : null}
        </div>
        <p className="mt-1.5 max-w-[520px] text-xs leading-relaxed text-slate-400 sm:text-[14px]">
          {subtitle}
        </p>
      </div>

      <div className="relative z-0 mt-2 h-52 sm:h-56">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-xs text-white/50">
            …
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 grid place-items-center px-3" role="status">
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
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartVisible && (
              <LineChart
                key={chartKey}
                data={chartRows}
                margin={{ top: 22, right: 22, left: 14, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateKey"
                  tickFormatter={(v) =>
                    formatAxisDate(String(v), language, showYearOnXAxis)
                  }
                  tick={{ fontSize: axisTickFontSize, fill: "rgba(148,163,184,0.9)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={xAxisInterval}
                  padding={{ left: 14, right: 14 }}
                  minTickGap={12}
                  angle={0}
                  textAnchor="middle"
                  tickMargin={8}
                  height={24}
                />
                <YAxis
                  dataKey="rank"
                  domain={yDomain}
                  reversed
                  ticks={yTicks}
                  padding={{ top: 18, bottom: 0 }}
                  allowDecimals={false}
                  tick={{ fontSize: axisTickFontSize, fill: "rgba(148,163,184,0.85)" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  label={{
                    value: msg.profile.rank,
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "rgba(148,163,184,0.55)", fontSize: axisLabelFontSize },
                  }}
                />
                <Tooltip cursor={false} content={() => null} wrapperStyle={{ display: "none" }} />
                {showDotsLayer && (
                  <Line
                    type="linear"
                    dataKey="rank"
                    stroke="rgba(34,211,238,0)"
                    dot={(dotProps: { index?: number; [key: string]: unknown }) => {
                      const idx = typeof dotProps.index === "number" ? dotProps.index : -1;
                      if (idx < 0) return null;
                      return (
                        <RankMarkerDot
                          {...dotProps}
                          large={isDesktop}
                          reveal={dotRevealActive}
                        />
                      );
                    }}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                {showLineLayer && (
                  <Line
                    key={`line-${lineLayerKey}`}
                    type="monotone"
                    dataKey="rank"
                    stroke={LINE}
                    strokeWidth={2}
                    dot={false}
                    activeDot={(dotProps) =>
                      isDesktop
                        ? <RankMarkerDot {...dotProps} active large />
                        : <RankMarkerDot {...dotProps} />
                    }
                    style={{
                      opacity: linePaintReady ? 1 : 0,
                      transition: "opacity 120ms linear",
                    }}
                    isAnimationActive={rechartsAnimActive}
                    animationDuration={rechartsAnimActive ? 980 : 0}
                    animationEasing="ease-out"
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {!loading && chartRows.length > 0 && (
        <div
          className="relative z-10 mt-2"
          style={{
            opacity: statsReady ? 1 : 0,
            transform: statsReady ? "translateY(0px)" : "translateY(8px)",
            transition: "opacity 480ms cubic-bezier(0.22,1,0.36,1), transform 480ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div
            className={[
              "rounded-lg border border-cyan-300/25 bg-white/[0.06] px-2.5 py-2",
              "backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
              "ring-1 ring-inset ring-cyan-400/15",
              isDesktop ? "px-3 py-2.5" : "",
            ].join(" ")}
          >
            <div
              className={[
                "grid items-center gap-1.5",
                "grid-cols-[1fr_auto_1fr_auto_1fr]",
              ].join(" ")}
            >
              <div className="px-1 py-0.5 text-center">
                <p
                  className={[
                    "leading-tight",
                    trendSummary.bestJump == null
                      ? "text-white/55"
                      : trendSummary.bestJump > 0
                        ? "text-emerald-300"
                        : trendSummary.bestJump < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                    language !== "ja"
                      ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                      : "text-[9px] font-medium",
                  ].join(" ")}
                >
                  {msg.profile.bestJumpUp}
                </p>
                <p
                  className={[
                    resultStatsMetricNumClass,
                    "mt-1 leading-none text-[1.25rem] sm:text-4xl",
                    trendSummary.bestJump == null
                      ? "text-white/65"
                      : trendSummary.bestJump > 0
                        ? "text-emerald-300"
                        : trendSummary.bestJump < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                  ].join(" ")}
                >
                  {trendSummary.bestJump != null ? `+${trendSummary.bestJump}` : "—"}
                </p>
              </div>
              <span className="text-center text-cyan-100/30">|</span>
              <div className="px-1 py-0.5 text-center">
                <p
                  className={[
                    "leading-tight",
                    trendSummary.worstDrop == null
                      ? "text-white/55"
                      : trendSummary.worstDrop > 0
                        ? "text-emerald-300"
                        : trendSummary.worstDrop < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                    language !== "ja"
                      ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                      : "text-[9px] font-medium",
                  ].join(" ")}
                >
                  {msg.profile.biggestDrop}
                </p>
                <p
                  className={[
                    resultStatsMetricNumClass,
                    "mt-1 leading-none text-[1.25rem] sm:text-4xl",
                    trendSummary.worstDrop == null
                      ? "text-white/65"
                      : trendSummary.worstDrop > 0
                        ? "text-emerald-300"
                        : trendSummary.worstDrop < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                  ].join(" ")}
                >
                  {trendSummary.worstDrop != null ? trendSummary.worstDrop : "—"}
                </p>
              </div>
              <span className="text-center text-cyan-100/30">|</span>
              <div className="px-1 py-0.5 text-center">
                <p
                  className={[
                    "leading-tight",
                    trendSummary.netDelta == null
                      ? "text-white/55"
                      : trendSummary.netDelta > 0
                        ? "text-emerald-300"
                        : trendSummary.netDelta < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                    language !== "ja"
                      ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                      : "text-[9px] font-medium",
                  ].join(" ")}
                >
                  {msg.profile.netChange}
                </p>
                <p
                  className={[
                    resultStatsMetricNumClass,
                    "mt-1 leading-none text-[1.25rem] sm:text-4xl",
                    trendSummary.netDelta == null
                      ? "text-white/65"
                      : trendSummary.netDelta > 0
                        ? "text-emerald-300"
                        : trendSummary.netDelta < 0
                          ? "text-rose-300"
                          : "text-cyan-200",
                  ].join(" ")}
                >
                  {trendSummary.netDelta == null
                    ? "—"
                    : trendSummary.netDelta > 0
                      ? `↑ +${trendSummary.netDelta}`
                      : trendSummary.netDelta < 0
                        ? `↓ ${trendSummary.netDelta}`
                        : "→ 0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .recharts-wrapper:focus,
        .recharts-wrapper:focus-visible,
        .recharts-surface:focus,
        .recharts-surface:focus-visible {
          outline: none;
        }
        :global(.rank-dot-reveal) {
          opacity: 0;
          transform: translateY(8px);
          animation: rankDotReveal ${DOT_REVEAL_MS}ms cubic-bezier(0.2, 0.9, 0.32, 1) forwards;
        }
        @keyframes rankDotReveal {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </ProfileKinetikPanelFrame>
  );
}
