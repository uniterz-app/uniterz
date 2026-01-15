"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DailyTrendStat = {
  date: string;
  posts: number;
  winRate: number;
  accuracy: number;
  scorePrecision: number;
};

type Props = {
  data: DailyTrendStat[];
};

export default function DailyTrendCard({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rangeDays, setRangeDays] = useState<7 | 15 | 25>(7);

  /* =========================
   * Intersection Observer
   * ========================= */
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

  const slicedData = data.slice(-rangeDays);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-3 text-sm font-semibold text-white">
        日別パフォーマンス推移
      </div>

      <div className="mb-2 flex gap-2">
  {[7, 15, 25].map(d => (
    <button
      key={d}
      onClick={() => setRangeDays(d as 7 | 15 | 25)}
      className={`px-3 py-1 rounded-full text-[11px]
        ${rangeDays === d ? "bg-white text-black" : "bg-white/10 text-white/60"}
      `}
    >
      過去{d}日
    </button>
  ))}
</div>

      <div className="h-60 sm:h-64">
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          {visible && (
            <ComposedChart
  data={slicedData}
              margin={{ top: 8, right: 12, left: 6, bottom: 0 }}
            >
              <CartesianGrid
                stroke="rgba(148,163,184,0.15)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
                tickLine={false}
              />

              <YAxis
                yAxisId="posts"
                ticks={[0, 4, 8, 12, 16, 20]}
                width={32}
                tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 1]}
                width={36}
                padding={{ top: 20, bottom: 20 }}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
                tickLine={false}
                axisLine={false}
              />

              <Legend
                verticalAlign="top"
                height={26}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-white/80">{value}</span>
                )}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.3)",
                  fontSize: 11,
                }}
                labelStyle={{ color: "rgba(248,250,252,0.9)" }}
                formatter={(value: number, name) => {
                  if (
                    name === "勝率" ||
                    name === "スコア精度" ||
                    name === "予測精度"
                  ) {
                    return [`${Math.round(value * 100)}%`, name];
                  }
                  return [`${value}件`, name];
                }}
              />

              <Bar
                yAxisId="posts"
                dataKey="posts"
                name="投稿数"
                fill="#fb923c"
                opacity={0.9}
                radius={[4, 4, 0, 0]}
                animationDuration={1400}
              />

              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="winRate"
                name="勝率"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                animationDuration={1600}
              />

              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="accuracy"
                name="予測精度"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                animationDuration={1800}
              />

              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="scorePrecision"
                name="スコア精度"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                animationDuration={2000}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/60">
        投稿数（棒）と勝率・スコア精度（線）の推移を日別で表示しています。
      </p>
    </div>
  );
}
