"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Language } from "@/lib/i18n/language";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";

/**
 * 日別データ
 */
export type DailyTrendStat = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
  upsetPoints: number;
};

type Props = {
  data: DailyTrendStat[];
  range?: "7d" | "30d" | "all";
  allowAll?: boolean;
  language?: Language;
  /**
   * true のとき Intersection 待ちをせずチャートを即マウントし、Recharts の描画アニメを切る。
   * 親の入場（例: motion のフェードアップ）と同期させる用途。
   */
  entranceSync?: boolean;
  /**
   * entranceSync 時のみ有効。false の間は棒・線のアニメを止め、true で再生（親のカード入場後に渡す）。
   */
  rechartsAfterEntrance?: boolean;
};

/* ===== colors ===== */
const COLORS = {
  posts: "#F97316",
  wins: "#A855F7",
  total: "#FACC15",
  score: "#22C55E",
};

function clampNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: any) {
  const n = Math.floor(clampNum(v));
  return n < 0 ? 0 : n;
}

/** 累積計算 */
function buildCumulative(rows: DailyTrendStat[]) {
  let p = 0;
  let sp = 0;

  return rows.map((r) => {
    const pointsDay = clampNum(r.pointsV3);
    const spDay = clampNum(r.scorePrecision);

    p += pointsDay;
    sp += spDay;

    return {
      ...r,
      pointsCum: p,
      scorePrecisionCum: sp,
    };
  });
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return value;
}

/** 正の数を「きりのいい」上限へ切り上げ（軸の上限用） */
function niceCeil(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

/** 0 … max を均等分割した目盛り（右軸の小数も許容） */
function linspaceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const lo = clampNum(min);
  const hi = clampNum(max);
  if (hi <= lo) return [lo];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = lo + ((hi - lo) * i) / (count - 1);
    out.push(Math.round(t * 1e6) / 1e6);
  }
  return out;
}

/** 棒グラフ用：整数上限と 0 始まりの目盛り */
function buildCountAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxBar = 0;
  for (const row of chartRows) {
    maxBar = Math.max(maxBar, clampNum(row.posts), clampNum(row.wins));
  }
  const top = Math.max(1, Math.ceil(maxBar * 1.12));
  const targetSteps = 6;
  const step = Math.max(1, Math.ceil(top / (targetSteps - 1)));
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(top);
  return { domain: [0, top] as [number, number], ticks };
}

/** 累積ライン用：データ最大に合わせた上限と目盛り */
function buildPointsAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxPt = 0;
  for (const row of chartRows) {
    maxPt = Math.max(
      maxPt,
      clampNum(row.pointsCum),
      clampNum(row.scorePrecisionCum)
    );
  }
  const padded = Math.max(maxPt * 1.08, maxPt > 0 ? 0 : 1);
  const top = niceCeil(padded);
  const ticks = linspaceTicks(0, top, 7);
  return { domain: [0, top] as [number, number], ticks, top };
}

export default function DailyTrendCard({
  data,
  range = "7d",
  allowAll = false,
  language = "ja",
  entranceSync = false,
  rechartsAfterEntrance = false,
}: Props) {
  const isEn = language === "en";

  const emptyMsg = isEn ? "No data available" : "データがありません";
  const lockedMsg = isEn
    ? "Pro lets you view monthly trends."
    : "Proでは月ごとの推移が確認できます";

  const postsLabel = isEn ? "Posts" : "投稿数";
  const hitsLabel = isEn ? "Correct Picks" : "的中数";
  const totalLabel = isEn ? "Total Points" : "総合得点";
  const scorePrecisionLabel = isEn ? "Score Precision" : "スコア精度";
  const unitCount = isEn ? "items" : "件";
  const unitPts = "pts";

  const ref = useRef<HTMLDivElement>(null);
  const [ioVisible, setIoVisible] = useState(false);

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
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [entranceSync]);

  const chartVisible = entranceSync || ioVisible;

  const rechartsAnimActive = !entranceSync || rechartsAfterEntrance;

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];

    if (range === "7d") return rows.slice(-7);
    if (range === "30d") return rows.slice(-30);
    if (range === "all" && allowAll) return rows;
    /** 非 Pro の ALL はロック表示の下に直近30日を描画（空画面にならない） */
    if (range === "all" && !allowAll) return rows.slice(-30);

    return [];
  }, [data, range, allowAll]);

  /** range 切り替えで Recharts が内部状態を持ち越さないようキーに含める */
  const composedChartKey = entranceSync
    ? rechartsAfterEntrance
      ? `trend-rc-on-${range}-${limitedData.length}`
      : `trend-rc-hold-${range}-${limitedData.length}`
    : `trend-io-${range}-${limitedData.length}`;

  const chartData = useMemo(() => buildCumulative(limitedData), [limitedData]);

  const isLocked = range === "all" && !allowAll;
  const isEmpty = !isLocked && limitedData.length === 0;

  const { countDomain, countTicks, pointsDomain, pointTicks, pointsTop } =
    useMemo(() => {
      const c = buildCountAxis(chartData);
      const p = buildPointsAxis(chartData);
      return {
        countDomain: c.domain,
        countTicks: c.ticks,
        pointsDomain: p.domain,
        pointTicks: p.ticks,
        pointsTop: p.top,
      };
    }, [chartData]);

  const [detailDate, setDetailDate] = useState<string | null>(null);

  const detailRow = useMemo(
    () => limitedData.find((r) => r.date === detailDate) ?? null,
    [limitedData, detailDate]
  );

  const detailSelectHint = isEn
    ? "Tap the chart to select a day."
    : "グラフをタップで日付を選択";

  const handleComposedChartClick = (
    state: { activeLabel?: string | number },
    _e?: unknown
  ) => {
    const label = state?.activeLabel;
    if (label == null || label === "") return;
    setDetailDate(String(label));
  };

  const handleBarClick = (item: { payload?: { date?: string } }) => {
    const d = item?.payload?.date as string | undefined;
    if (d != null && d !== "") setDetailDate(String(d));
  };

  useEffect(() => {
    if (!detailDate) return;
    if (!limitedData.some((r) => r.date === detailDate)) {
      setDetailDate(null);
    }
  }, [detailDate, limitedData]);

  return (
    <div
      ref={ref}
      className={[
        "relative overflow-hidden rounded-xl border border-white/10 bg-[#050814]/80 p-3",
        "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
      <div className="relative h-48 sm:h-52 cursor-pointer overflow-hidden rounded-2xl">
        {isEmpty ? (
          <div className="absolute inset-0 grid place-items-center border border-white/10 bg-black/20">
            <div className="text-sm font-semibold text-white/80">
              {emptyMsg}
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              {chartVisible && (
                <ComposedChart
                  key={composedChartKey}
                  data={chartData}
                  margin={{ top: 6, right: 10, left: 2, bottom: -6 }}
                  onClick={handleComposedChartClick}
                >
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={14}
                  />

                  <YAxis
                    yAxisId="count"
                    width={30}
                    ticks={countTicks}
                    domain={countDomain}
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <YAxis
                    yAxisId="points"
                    orientation="right"
                    width={38}
                    ticks={pointTicks}
                    domain={pointsDomain}
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const n = clampNum(v);
                      return pointsTop < 20
                        ? formatMetricDecimals(n, 1)
                        : `${toInt(n)}`;
                    }}
                  />

                  <Bar
                    yAxisId="count"
                    dataKey="posts"
                    name={postsLabel}
                    fill={COLORS.posts}
                    opacity={0.85}
                    radius={[3, 3, 0, 0]}
                    barSize={8}
                    isAnimationActive={rechartsAnimActive}
                    onClick={handleBarClick}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="wins"
                    name={hitsLabel}
                    fill={COLORS.wins}
                    opacity={0.85}
                    radius={[3, 3, 0, 0]}
                    barSize={8}
                    isAnimationActive={rechartsAnimActive}
                    onClick={handleBarClick}
                  />

                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="pointsCum"
                    name={totalLabel}
                    stroke={COLORS.total}
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive={rechartsAnimActive}
                  />
                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="scorePrecisionCum"
                    name={scorePrecisionLabel}
                    stroke={COLORS.score}
                    strokeWidth={1.75}
                    dot={false}
                    strokeDasharray="4 2"
                    isAnimationActive={rechartsAnimActive}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>

            {isLocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#050814]/58 backdrop-blur-[3px]" />
                <div className="relative mx-4 rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="text-sm font-semibold text-white">
                    {lockedMsg}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isEmpty && (
        <div
          className="mt-2 rounded-xl border border-white/10 px-3 py-2.5 sm:px-3.5"
          style={{
            backgroundColor: "#020617",
            borderColor: "rgba(148,163,184,0.3)",
          }}
        >
          {detailDate && detailRow ? (
            <div className="space-y-1 text-[11px] font-medium leading-relaxed sm:text-xs">
              <div className="mb-1 font-semibold tabular-nums text-slate-100">
                {formatDateLabel(detailDate)}
              </div>
              <p style={{ color: COLORS.score }}>
                {scorePrecisionLabel} :{" "}
                <span className="tabular-nums">
                  {formatMetricDecimals(detailRow.scorePrecision, 1)} {unitPts}
                </span>
              </p>
              <p style={{ color: COLORS.posts }}>
                {postsLabel} :{" "}
                <span className="tabular-nums">
                  {toInt(detailRow.posts)} {unitCount}
                </span>
              </p>
              <p style={{ color: COLORS.wins }}>
                {hitsLabel} :{" "}
                <span className="tabular-nums">
                  {toInt(detailRow.wins)} {unitCount}
                </span>
              </p>
              <p style={{ color: COLORS.total }}>
                {totalLabel} :{" "}
                <span className="tabular-nums">
                  {formatMetricDecimals(detailRow.pointsV3, 1)} {unitPts}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-[10px] leading-snug text-slate-500 sm:text-[11px]">
              {detailSelectHint}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/80">
        <Chip label={postsLabel} hex={COLORS.posts} />
        <Chip label={hitsLabel} hex={COLORS.wins} />
        <Chip label={totalLabel} hex={COLORS.total} />
        <Chip label={scorePrecisionLabel} hex={COLORS.score} />
      </div>
      </div>
    </div>
  );
}

function Chip({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-white/30"
        style={{ backgroundColor: hex }}
      />
      <span>{label}</span>
    </div>
  );
}