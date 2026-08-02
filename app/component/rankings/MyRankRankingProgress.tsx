"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas, nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { PROFILE_CHART_CYBER } from "@/lib/profile/profileOverviewChartCyberTheme";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";

/** 総合得点順位の推移 — 指標タブと独立した固定ラベル */
export const MY_RANK_RANKING_PROGRESS_TITLE = "RANKING PROGRESS · TOTAL PTS";

type TrendState = "up" | "down" | "flat";

type ChartRow = MyRankProgressPoint & { trend: TrendState };

const TREND_THEME: Record<
  TrendState,
  { stroke: string; fill: string; glow: string }
> = {
  up: {
    stroke: PROFILE_CHART_CYBER.lime,
    fill: PROFILE_CHART_CYBER.limeFill,
    glow: PROFILE_CHART_CYBER.limeGlow,
  },
  down: {
    stroke: PROFILE_CHART_CYBER.magenta,
    fill: PROFILE_CHART_CYBER.magentaFill,
    glow: PROFILE_CHART_CYBER.magentaGlow,
  },
  flat: {
    stroke: PROFILE_CHART_CYBER.cyan,
    fill: "rgba(5,8,20,0.92)",
    glow: PROFILE_CHART_CYBER.cyanSoft,
  },
};

function formatAxisDate(dateKey: string, language: Language): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(Date.UTC(y, mo - 1, da));
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", {
    month: "numeric",
    day: "numeric",
  }).format(d);
}

function RankMarkerDotCompact(props: {
  cx?: number;
  cy?: number;
  payload?: { rank?: number; trend?: TrendState };
}) {
  const { cx, cy, payload } = props;
  const rank = payload?.rank;
  const trend: TrendState = payload?.trend ?? "flat";
  if (cx == null || cy == null || rank == null || rank < 1) return null;
  const r = 10;
  const theme = TREND_THEME[trend];
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r + 2}
        fill="none"
        stroke={theme.glow}
        strokeWidth={3}
        opacity={0.65}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={theme.fill}
        stroke={theme.stroke}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy}
        dy="0.32em"
        textAnchor="middle"
        className={resultStatsMetricNumClass}
        fill="rgba(248,250,252,0.95)"
        fontSize={9}
        fontWeight={700}
      >
        {rank}
      </text>
    </g>
  );
}

export default function MyRankRankingProgress({
  points,
  maxSnapshots,
  loading = false,
  language = "ja",
  layout = "mobile",
  embedded = false,
  title: titleOverride,
  /** 順位ドットの変動のみ（タイトル・左右軸ラベルなし） */
  numbersOnly = false,
  dense = false,
}: {
  points: MyRankProgressPoint[];
  maxSnapshots: number;
  loading?: boolean;
  language?: Language;
  layout?: "mobile" | "web";
  embedded?: boolean;
  title?: string;
  numbersOnly?: boolean;
  /** My Rank Pro 下段 — 薄い Progress 帯 */
  dense?: boolean;
}) {
  const msg = t(language);
  const title = titleOverride ?? MY_RANK_RANKING_PROGRESS_TITLE;
  const emptyHint = msg.profile.rankingProgressNoData;
  const chartHeight = dense ? 64 : layout === "web" ? 104 : 92;

  const rows = useMemo(() => {
    const sliced = points.slice(-Math.max(1, maxSnapshots));
    return sliced.map((row, i) => {
      if (i === 0) return { ...row, trend: "flat" as const };
      const prev = sliced[i - 1]!.rank;
      const trend: TrendState =
        row.rank < prev ? "up" : row.rank > prev ? "down" : "flat";
      return { ...row, trend };
    });
  }, [points, maxSnapshots]);

  const yDomain = useMemo((): [number, number] => {
    if (rows.length === 0) return [1, 2];
    let minR = Infinity;
    let maxR = -Infinity;
    for (const r of rows) {
      minR = Math.min(minR, r.rank);
      maxR = Math.max(maxR, r.rank);
    }
    const span = Math.max(1, maxR - minR);
    const pad = Math.max(1, Math.ceil(span * 0.15));
    const lo = Math.max(1, minR - pad);
    const hi = maxR + pad;
    if (lo >= hi) return [Math.max(1, minR - 1), maxR + 1];
    return [lo, hi];
  }, [rows]);

  const yTicks = useMemo(() => {
    const [lo, hi] = yDomain;
    const span = hi - lo;
    const step = Math.max(1, Math.ceil(span / 4));
    const ticks: number[] = [];
    for (let v = lo; v <= hi; v += step) ticks.push(v);
    if (ticks.length === 0) return [lo, hi];
    if (ticks[ticks.length - 1]! < hi) ticks.push(hi);
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [yDomain]);

  const isEmpty = !loading && rows.length === 0;
  const xAxisInterval = rows.length > 6 ? 1 : 0;

  return (
    <section
      className={
        embedded
          ? "relative z-10 px-0 pt-0 pb-1"
          : numbersOnly
            ? "relative z-10 px-1.5 pt-1 pb-1"
            : "relative z-10 border-t border-white/8 px-2.5 pt-2 pb-1"
      }
      aria-label={title}
    >
      {numbersOnly && dense ? null : numbersOnly ? (
        <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
          <p
            className={[
              nameOxanium.className,
              "truncate font-bold uppercase tracking-[0.16em] text-cyan-300/78",
            ].join(" ")}
            style={{ fontSize: layout === "web" ? "9px" : "8px" }}
          >
            {title}
          </p>
        </div>
      ) : (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p
            className={[
              nameOxanium.className,
              "truncate font-bold uppercase tracking-[0.16em] text-cyan-300/78",
            ].join(" ")}
            style={{ fontSize: layout === "web" ? "9px" : "8px" }}
          >
            {title}
          </p>
          <span
            className={[
              nameOxanium.className,
              "shrink-0 font-semibold tabular-nums tracking-[0.12em] text-white/28",
            ].join(" ")}
            style={{ fontSize: "7px" }}
          >
            {rows.length}/{maxSnapshots}
          </span>
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-sm"
        style={{
          height: chartHeight,
          background: PROFILE_CHART_CYBER.rankPlotInnerBg,
          boxShadow: `inset 0 0 0 1px ${PROFILE_CHART_CYBER.glassBorder}`,
        }}
      >
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-[10px] text-white/45">
            …
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 grid place-items-center px-2" role="status">
            <p
              className={[
                nameBebas.className,
                "text-center text-[1rem] leading-none tracking-[0.14em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
            <p className="mt-1 max-w-[220px] text-center text-[9px] leading-snug text-white/40">
              {emptyHint}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={
                numbersOnly
                  ? { top: 14, right: 14, left: 10, bottom: 8 }
                  : { top: 14, right: 12, left: 6, bottom: 4 }
              }
            >
              {numbersOnly ? null : (
                <CartesianGrid
                  stroke={PROFILE_CHART_CYBER.cyanGridStrong}
                  strokeDasharray="0"
                  vertical
                  horizontal
                  syncWithTicks
                />
              )}
              <XAxis
                dataKey="dateKey"
                tickFormatter={(v) => formatAxisDate(String(v), language)}
                tick={
                  numbersOnly
                    ? false
                    : { fontSize: 8, fill: PROFILE_CHART_CYBER.tick }
                }
                tickLine={false}
                axisLine={false}
                interval={xAxisInterval}
                padding={{ left: 10, right: 10 }}
                minTickGap={8}
                tickMargin={4}
                height={numbersOnly ? 0 : 18}
                hide={numbersOnly}
              />
              <YAxis
                dataKey="rank"
                domain={yDomain}
                reversed
                ticks={yTicks}
                padding={{ top: 12, bottom: 0 }}
                allowDecimals={false}
                tick={
                  numbersOnly
                    ? false
                    : { fontSize: 8, fill: PROFILE_CHART_CYBER.tick }
                }
                tickLine={false}
                axisLine={false}
                width={numbersOnly ? 0 : 22}
                hide={numbersOnly}
              />
              <Tooltip cursor={false} content={() => null} wrapperStyle={{ display: "none" }} />
              <Line
                type="linear"
                dataKey="rank"
                stroke="rgba(34,211,238,0)"
                dot={(dotProps) => <RankMarkerDotCompact {...dotProps} />}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke={PROFILE_CHART_CYBER.cyanSoft}
                strokeWidth={3}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke={PROFILE_CHART_CYBER.cyan}
                strokeWidth={1.25}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
