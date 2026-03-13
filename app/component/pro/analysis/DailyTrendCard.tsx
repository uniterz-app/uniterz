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
  Tooltip,
} from "recharts";

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

function toFixed1(v: any) {
  const n = clampNum(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
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

export default function DailyTrendCard({
  data,
  range = "7d",
  allowAll = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];

    if (range === "7d") return rows.slice(-7);
    if (range === "30d") return rows.slice(-30);
    if (range === "all" && allowAll) return rows;

    return [];
  }, [data, range, allowAll]);

  const chartData = useMemo(() => buildCumulative(limitedData), [limitedData]);

  const isLocked = range === "all" && !allowAll;
  const isEmpty = !isLocked && limitedData.length === 0;

  const countTicks = [3, 6, 9, 12, 15];
  const pointTicks = [0, 50, 100, 150, 200, 250, 300];

  return (
    <div
      ref={ref}
      className={[
        "relative rounded-xl border border-white/10 bg-[#050814]/80 p-3",
        "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="relative h-48 sm:h-52 overflow-hidden rounded-2xl">
        {isEmpty ? (
          <div className="absolute inset-0 grid place-items-center border border-white/10 bg-black/20">
            <div className="text-sm font-semibold text-white/80">
              データがありません
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              {visible && (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 6, right: 10, left: 2, bottom: -6 }}
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
                    domain={[3, 15]}
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
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${toInt(v)}`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.3)",
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "rgba(248,250,252,0.9)" }}
                    labelFormatter={(label) => formatDateLabel(String(label))}
                    formatter={(value: any, name: any) => {
                      const n = clampNum(value);
                      const label = String(name);

                      if (label === "投稿数" || label === "的中数") {
                        return [`${toInt(n)}件`, label];
                      }
                      return [`${toFixed1(n)} pts`, label];
                    }}
                  />

                  <Bar
                    yAxisId="count"
                    dataKey="posts"
                    name="投稿数"
                    fill={COLORS.posts}
                    opacity={0.85}
                    radius={[3, 3, 0, 0]}
                    barSize={8}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="wins"
                    name="的中数"
                    fill={COLORS.wins}
                    opacity={0.85}
                    radius={[3, 3, 0, 0]}
                    barSize={8}
                  />

                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="pointsCum"
                    name="総合得点"
                    stroke={COLORS.total}
                    strokeWidth={1.75}
                    dot={false}
                  />
                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="scorePrecisionCum"
                    name="スコア精度"
                    stroke={COLORS.score}
                    strokeWidth={1.75}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>

            {isLocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#050814]/58 backdrop-blur-[3px]" />
                <div className="relative mx-4 rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="text-sm font-semibold text-white">
                    Proでは月ごとの推移が確認できます
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/80">
        <Chip label="投稿数" hex={COLORS.posts} />
        <Chip label="的中数" hex={COLORS.wins} />
        <Chip label="総合得点" hex={COLORS.total} />
        <Chip label="スコア精度" hex={COLORS.score} />
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