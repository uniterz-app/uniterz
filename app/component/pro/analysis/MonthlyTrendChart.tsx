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

export type MonthlyTrendStat = {
  month: string; // "2025-01"
  posts: number;
  winRate: number;   // 0–1
  accuracy: number;  // 0–1（予測精度）
};

type Props = {
  data: MonthlyTrendStat[];
};

export default function MonthlyTrendChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

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

  /* =========================
   * レイアウト確定後にアニメ開始
   * ========================= */
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setAnimate(true), 250);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-3 text-sm font-semibold text-white">
        月別パフォーマンス推移
      </div>

      <div className="h-60 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, left: 6, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(148,163,184,0.15)"
              strokeDasharray="3 3"
              vertical={false}
            />

            {/* ===== X Axis ===== */}
            <XAxis
              dataKey="month"
              interval={0}
              ticks={data.map(d => d.month)}
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
            />

            {/* ===== 左軸：投稿数 ===== */}
            <YAxis
              yAxisId="posts"
              width={32}
              ticks={[0, 25, 50, 75, 100, 125]}
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
              axisLine={false}
            />

            {/* ===== 右軸：率系 ===== */}
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

            {/* ===== Legend ===== */}
            <Legend
              verticalAlign="top"
              height={26}
              iconType="circle"
              formatter={(v) => (
                <span className="text-xs text-white/80">{v}</span>
              )}
            />

            {/* ===== Tooltip ===== */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.3)",
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(248,250,252,0.9)" }}
              formatter={(value: number, name) => {
                if (name === "投稿数") return [`${value}件`, name];
                return [`${Math.round(value * 100)}%`, name];
              }}
            />

            {/* ===== 投稿数 ===== */}
            <Bar
              yAxisId="posts"
              dataKey="posts"
              name="投稿数"
              fill="#fb923c"
              opacity={0.9}
              radius={[4, 4, 0, 0]}
              barSize={20}
              maxBarSize={20}
              isAnimationActive={animate}
              animationDuration={1400}
            />

            {/* ===== 勝率 ===== */}
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="winRate"
              name="勝率"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
              animationDuration={1700}
            />

            {/* ===== 予測精度 ===== */}
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="accuracy"
              name="予測精度"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
              animationDuration={1900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/60">
  投稿数（棒）と勝率・予測精度（線）の推移を月別で表示しています。
</p>
    </div>
  );
}
