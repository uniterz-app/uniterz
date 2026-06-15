"use client";

/**
 * Daily Combo Chart — Neural / HUD（本番チャート本体）
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Info } from "lucide-react";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import chartInfoStyles from "./profileChartInfoFaq.module.css";
import "./profileDailyComboChart.css";

export type ProfileDailyComboChartPoint = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
  upsetPoints: number;
};

function clampNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildCumulative(rows: ProfileDailyComboChartPoint[]) {
  let p = 0;
  return rows.map((r) => {
    p += clampNum(r.pointsV3);
    return { ...r, pointsCum: p };
  });
}

function formatDateLabel(value: string): string {
  const parts = value.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return value;
}

function formatXSlot(index: number): string {
  return `X-${String(index + 1).padStart(2, "0")}`;
}

function linspaceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(min + ((max - min) * i) / (count - 1));
  }
  return out;
}

function formatLineAxisTick(value: number, top: number): string {
  const n = clampNum(value);
  if (top < 20) return formatMetricDecimals(n, 1);
  return String(Math.floor(n));
}

function niceCeil(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf = 1;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

function segmentFill(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.45) {
    const u = clamped / 0.45;
    const r = Math.round(6 + u * (192 - 6));
    const g = Math.round(182 + u * (38 - 182));
    const b = Math.round(212 + u * (211 - 212));
    return `rgb(${r},${g},${b})`;
  }
  if (clamped < 0.78) {
    const u = (clamped - 0.45) / 0.33;
    const r = Math.round(192 + u * (255 - 192));
    const g = Math.round(38 + u * (255 - 38));
    const b = Math.round(211 + u * (255 - 211));
    return `rgb(${r},${g},${b})`;
  }
  const u = (clamped - 0.78) / 0.22;
  const v = Math.round(220 + u * 35);
  return `rgb(${v},${v},${Math.min(255, v + 8)})`;
}

type SegBarProps = {
  x: number;
  barW: number;
  plotBottom: number;
  plotMaxH: number;
  value: number;
  maxValue: number;
  segmentCount?: number;
};

function barHeightPx(value: number, maxValue: number, plotMaxH: number): number {
  if (value <= 0 || maxValue <= 0 || plotMaxH <= 0) return 0;
  return (value / maxValue) * plotMaxH;
}

const BAR_LABEL_GAP = 5;

function SegmentedBar({
  x,
  barW,
  plotBottom,
  plotMaxH,
  value,
  maxValue,
  segmentCount = 14,
}: SegBarProps) {
  const barH = barHeightPx(value, maxValue, plotMaxH);
  if (barH < 1) return null;

  const ratio = value / maxValue;
  const litCount = Math.max(1, Math.round(ratio * segmentCount));
  const gap = litCount > 1 ? 2 : 0;
  const segH = (barH - gap * (litCount - 1)) / litCount;
  if (segH <= 0) return null;

  const segs = [];

  for (let i = 0; i < litCount; i++) {
    const segY = plotBottom - (i + 1) * segH - i * gap;
    const t = litCount > 1 ? i / (litCount - 1) : 1;
    segs.push(
      <rect
        key={i}
        className="dcc-neural__seg-lit"
        x={x}
        y={segY}
        width={barW}
        height={segH}
        rx={0.5}
        fill={segmentFill(t)}
        opacity={0.92 + t * 0.08}
      />
    );
  }

  return <g>{segs}</g>;
}

function BarValueLabel({
  x,
  barW,
  plotBottom,
  plotMaxH,
  value,
  maxValue,
}: SegBarProps) {
  const barH = barHeightPx(value, maxValue, plotMaxH);
  if (barH < 1 || value <= 0) return null;
  const barTopY = plotBottom - barH;

  return (
    <text
      x={x + barW / 2}
      y={barTopY - BAR_LABEL_GAP}
      textAnchor="middle"
      className={["dcc-neural__bar-label", nameRajdhani.className].join(" ")}
    >
      {Math.floor(value)}
    </text>
  );
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function useNarrowViewport(fallback: boolean) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => fallback
  );
}

export type ProfileDailyComboChartNeuralProps = {
  data: ProfileDailyComboChartPoint[];
  language?: Language;
  rankingLeague?: RankingLeagueSource;
  layout?: "web" | "mobile";
};

export default function ProfileDailyComboChartNeural({
  data,
  language = "ja",
  rankingLeague = "nba",
  layout = "web",
}: ProfileDailyComboChartNeuralProps) {
  const narrowViewport = useNarrowViewport(layout === "mobile");
  const isCompactChart = layout === "mobile" || narrowViewport;
  const msg = t(language);
  const isWcTrend = rankingLeague === "worldcup";
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const chartRows = useMemo(() => buildCumulative(rows), [rows]);

  const [selectedIdx, setSelectedIdx] = useState(() =>
    Math.max(0, chartRows.length - 1)
  );

  useEffect(() => {
    if (chartRows.length === 0) return;
    setSelectedIdx((prev) => Math.min(prev, chartRows.length - 1));
  }, [chartRows.length]);

  const selectedRow = chartRows[selectedIdx] ?? chartRows[chartRows.length - 1];

  const maxBar = useMemo(() => {
    let m = 0;
    for (const r of chartRows) {
      m = Math.max(m, clampNum(r.posts), clampNum(r.wins));
    }
    return Math.max(1, m);
  }, [chartRows]);

  const maxLine = useMemo(() => {
    let m = 1;
    for (const r of chartRows) {
      m = Math.max(m, clampNum(r.pointsCum));
    }
    return niceCeil(m * 1.06);
  }, [chartRows]);

  const lineAxisTicks = useMemo(
    () => linspaceTicks(0, maxLine, 5),
    [maxLine]
  );

  const title = msg.profile.dailyComboChart;
  const subtitle = msg.profile.dailyComboChartDesc;
  const chartInfoTooltipMsg = msg.profile.dailyComboChartInfo;

  const scorePrecisionLabel = isWcTrend
    ? msg.rankings.exactHits
    : msg.profile.scorePrecision;
  const scorePrecisionUnit = isWcTrend
    ? language === "ja"
      ? "試合"
      : "matches"
    : msg.profile.ptsUnit;
  const scorePrecisionDecimals = isWcTrend ? 0 : 1;

  const statLabels = {
    hitsPosts: msg.profile.hitsSlashPosts,
    scorePrec: scorePrecisionLabel,
    totalPts: msg.profile.totalPoints,
    upset: msg.profile.upsetLabel,
    unitCount: msg.profile.items,
    unitPts: msg.profile.ptsUnit,
  };

  const legendLabels = {
    bars: `${msg.profile.postsCount} / ${msg.profile.correctPicks}`,
    line: `${language === "ja" ? "累積 " : "Cumulative "}${msg.profile.totalPoints}`,
  };

  const W = 640;
  const H = isCompactChart ? 300 : 220;
  const padL = 36;
  const padR = 46;
  const padT = 4;
  const barLabelLane = isCompactChart ? 20 : 16;
  const padB = 28;
  const chartW = W - padL - padR;
  const plotBottom = H - padB;
  const plotTop = padT + barLabelLane;
  const plotH = plotBottom - plotTop;
  const colCount = chartRows.length;
  const groupW = colCount > 0 ? chartW / colCount : chartW;
  const barGap = 3;
  const barW = Math.min(14, Math.max(6, groupW * 0.22));
  const pairW = barW * 2 + barGap;

  const yPctTicks = [0, 25, 50, 75, 100];

  const linePoints = chartRows.map((row, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const ratio = maxLine > 0 ? clampNum(row.pointsCum) / maxLine : 0;
    const cy = plotBottom - ratio * plotH;
    return { x: cx, y: cy, row, i };
  });

  const linePath = buildLinePath(linePoints);

  return (
    <div className="dcc-neural w-full min-w-0">
      <div className="relative z-20 mb-2 px-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={[
              nameRajdhani.className,
              "font-semibold tracking-wide text-white/95 text-lg sm:text-[1.72rem]",
            ].join(" ")}
          >
            {title}
          </p>
          <div className={chartInfoStyles.wrap}>
            <button
              type="button"
              className={chartInfoStyles.faqButton}
              aria-label={chartInfoTooltipMsg}
            >
              <Info className="shrink-0" strokeWidth={1.75} aria-hidden />
            </button>
            <div className={chartInfoStyles.tooltip} aria-hidden>
              {chartInfoTooltipMsg}
            </div>
          </div>
        </div>
        <p className="mt-0.5 text-[11px] text-white/60 sm:text-xs">{subtitle}</p>
      </div>

      <div className="dcc-neural__panel">
        <div
          className={[
            "dcc-neural__chart-zone",
            isCompactChart ? "px-0 py-0.5" : "px-1 py-2 sm:px-2",
          ].join(" ")}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="dcc-neural__chart-svg h-auto w-full"
            overflow="visible"
            role="img"
            aria-label={title}
          >
            {yPctTicks.map((pct) => {
              const y = plotBottom - (pct / 100) * plotH;
              return (
                <g key={`grid-${pct}`}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="dcc-neural__y-label"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {lineAxisTicks.map((tick) => {
              const ratio = maxLine > 0 ? tick / maxLine : 0;
              const y = plotBottom - ratio * plotH;
              return (
                <text
                  key={`r-${tick}`}
                  x={W - padR + 6}
                  y={y + 3}
                  textAnchor="start"
                  className={[
                    "dcc-neural__y-label dcc-neural__y-label--right",
                    nameOxanium.className,
                  ].join(" ")}
                >
                  {formatLineAxisTick(tick, maxLine)}
                </text>
              );
            })}

            {chartRows.map((row, i) => {
              const gx = padL + groupW * i + (groupW - pairW) / 2;
              const selected = i === selectedIdx;
              return (
                <g
                  key={row.date}
                  className={[
                    "dcc-neural__bar-col",
                    selected ? "dcc-neural__bar-col--selected" : "",
                  ].join(" ")}
                  onClick={() => setSelectedIdx(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIdx(i);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={formatDateLabel(row.date)}
                >
                  <SegmentedBar
                    x={gx}
                    barW={barW}
                    plotBottom={plotBottom}
                    plotMaxH={plotH}
                    value={clampNum(row.posts)}
                    maxValue={maxBar}
                  />
                  <SegmentedBar
                    x={gx + barW + barGap}
                    barW={barW}
                    plotBottom={plotBottom}
                    plotMaxH={plotH}
                    value={clampNum(row.wins)}
                    maxValue={maxBar}
                  />
                </g>
              );
            })}

            {linePath ? (
              <>
                <path
                  d={linePath}
                  fill="none"
                  stroke="#ccff00"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="dcc-neural__line-glow"
                  opacity={0.35}
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#ccff00"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="dcc-neural__line-glow"
                />
              </>
            ) : null}

            <g className="dcc-neural__bar-labels" aria-hidden>
              {chartRows.map((row, i) => {
                const gx = padL + groupW * i + (groupW - pairW) / 2;
                return (
                  <g key={`lbl-${row.date}`}>
                    <BarValueLabel
                      x={gx}
                      barW={barW}
                      plotBottom={plotBottom}
                      plotMaxH={plotH}
                      value={clampNum(row.posts)}
                      maxValue={maxBar}
                    />
                    <BarValueLabel
                      x={gx + barW + barGap}
                      barW={barW}
                      plotBottom={plotBottom}
                      plotMaxH={plotH}
                      value={clampNum(row.wins)}
                      maxValue={maxBar}
                    />
                  </g>
                );
              })}
            </g>

            {linePoints.map((pt) => {
              const show =
                pt.i === selectedIdx ||
                (pt.i > 0 &&
                  pt.i < linePoints.length - 1 &&
                  pt.y < linePoints[pt.i - 1]!.y &&
                  pt.y < linePoints[pt.i + 1]!.y);
              if (!show) return null;
              return (
                <circle
                  key={pt.i}
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.i === selectedIdx ? 3.5 : 2.5}
                  fill="#ccff00"
                  className="dcc-neural__line-dot"
                />
              );
            })}

            {chartRows.map((row, i) => {
              const cx = padL + groupW * i + groupW / 2;
              const selected = i === selectedIdx;
              return (
                <text
                  key={`x-${row.date}`}
                  x={cx}
                  y={H - 6}
                  textAnchor="middle"
                  transform={`rotate(-90 ${cx} ${H - 6})`}
                  className={[
                    "dcc-neural__x-label",
                    selected ? "dcc-neural__x-label--selected" : "",
                    nameOxanium.className,
                  ].join(" ")}
                >
                  {formatXSlot(i)}
                </text>
              );
            })}
          </svg>
        </div>

        {selectedRow ? (
          <div
            className={[
              "dcc-neural__stats-wrap",
              isCompactChart ? "px-0 pt-2" : "border-t border-white/10 px-3 py-2.5 sm:px-4",
            ].join(" ")}
          >
            <p
              className={[
                nameRajdhani.className,
                "mb-2 text-[13px] font-semibold tracking-wide text-cyan-200/90",
              ].join(" ")}
            >
              {formatDateLabel(selectedRow.date)}
            </p>
            <div className="dcc-neural__stats-grid">
              <div className="dcc-neural__stat-cell">
                <p className={["dcc-neural__stat-label", nameOxanium.className].join(" ")}>
                  {statLabels.hitsPosts}
                </p>
                <div className="dcc-neural__stat-value-row">
                  <span className={["dcc-neural__stat-value", nameOxanium.className].join(" ")}>
                    {formatMetricDecimals(clampNum(selectedRow.wins), 0)}
                    <span className="text-white/30">/</span>
                    {formatMetricDecimals(clampNum(selectedRow.posts), 0)}
                  </span>
                  <span className={["dcc-neural__stat-unit", nameOxanium.className].join(" ")}>
                    {statLabels.unitCount}
                  </span>
                </div>
              </div>
              <div className="dcc-neural__stat-cell">
                <p className={["dcc-neural__stat-label", nameOxanium.className].join(" ")}>
                  {statLabels.scorePrec}
                </p>
                <div className="dcc-neural__stat-value-row">
                  <span className={["dcc-neural__stat-value", nameOxanium.className].join(" ")}>
                    {formatMetricDecimals(
                      clampNum(selectedRow.scorePrecision),
                      scorePrecisionDecimals
                    )}
                  </span>
                  <span className={["dcc-neural__stat-unit", nameOxanium.className].join(" ")}>
                    {scorePrecisionUnit}
                  </span>
                </div>
              </div>
              <div className="dcc-neural__stat-cell">
                <p className={["dcc-neural__stat-label", nameOxanium.className].join(" ")}>
                  {statLabels.totalPts}
                </p>
                <div className="dcc-neural__stat-value-row">
                  <span className={["dcc-neural__stat-value", nameOxanium.className].join(" ")}>
                    {formatMetricDecimals(clampNum(selectedRow.pointsV3), 1)}
                  </span>
                  <span className={["dcc-neural__stat-unit", nameOxanium.className].join(" ")}>
                    {statLabels.unitPts}
                  </span>
                </div>
              </div>
              <div className="dcc-neural__stat-cell">
                <p className={["dcc-neural__stat-label", nameOxanium.className].join(" ")}>
                  {statLabels.upset}
                </p>
                <div className="dcc-neural__stat-value-row">
                  <span className={["dcc-neural__stat-value", nameOxanium.className].join(" ")}>
                    {formatMetricDecimals(clampNum(selectedRow.upsetPoints), 1)}
                  </span>
                  <span className={["dcc-neural__stat-unit", nameOxanium.className].join(" ")}>
                    {statLabels.unitPts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={[
          nameOxanium.className,
          "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/45",
        ].join(" ")}
      >
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-[1px]"
            style={{ background: "linear-gradient(180deg, #fff, #c026d3, #22d3ee)" }}
          />
          {legendLabels.bars}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-[2px] w-4 rounded bg-[#ccff00] shadow-[0_0_6px_#ccff00]" />
          {legendLabels.line}
        </span>
      </div>
    </div>
  );
}
