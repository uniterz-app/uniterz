// app/component/pro/MyStatsGraphCard.tsx
"use client";

import { useState } from "react";
import { LineChart as IconLineChart } from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RangeValue } from "./ProShared";

/* ========= ユニット推移：ダミーデータ ========= */

const MOCK_UNITS_DATA: Record<
  RangeValue,
  { label: string; cumulative: number; delta: number }[]
> = {
  "7d": [
    { label: "1", cumulative: -1, delta: -1 },
    { label: "2", cumulative: 0.5, delta: 1.5 },
    { label: "3", cumulative: 2.0, delta: 1.5 },
    { label: "4", cumulative: 1.0, delta: -1.0 },
    { label: "5", cumulative: 3.5, delta: 2.5 },
    { label: "6", cumulative: 4.0, delta: 0.5 },
    { label: "7", cumulative: 5.5, delta: 1.5 },
  ],
  "30d": Array.from({ length: 30 }).map((_, i) => {
    const rawDelta = Math.cos(i / 3) * 2;
    return {
      label: String(i + 1),
      cumulative: Math.sin(i / 4) * 4 + i * 0.2,
      delta: Number(rawDelta.toFixed(1)),
    };
  }),
  all: Array.from({ length: 12 }).map((_, i) => ({
    label: `${i + 1}月`,
    cumulative: i * 3 + (i % 3) * 2,
    delta: (i % 3) - 1,
  })),
};

export default function MyStatsGraphCard() {
  const [range, setRange] = useState<RangeValue>("30d");
  const data = MOCK_UNITS_DATA[range];

  return (
    <div className="relative flex flex-col rounded-2xl border border-white/15 bg-white/5 p-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.55)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20">
            <IconLineChart className="h-4 w-4 text-sky-300" />
          </div>
          <div>
            <div className="text-xs text-white/60">ユニット推移を可視化</div>
            <div className="text-sm font-semibold text-white">
              増減をチャートで確認
            </div>
          </div>
        </div>

        <div className="inline-flex items-center rounded-full bg-white/5 p-[3px] text-[11px]">
          {(["7d", "30d", "all"] as RangeValue[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-[4px] rounded-full transition ${
                range === r
                  ? "bg-sky-500 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.6)]"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {r === "7d" && "7日"}
              {r === "30d" && "30日"}
              {r === "all" && "全期間"}
            </button>
          ))}
        </div>
      </div>

      {/* 累計ユニット */}
      <div className="mb-3 h-32 rounded-xl border border-white/10 bg-[#050814]/80 px-2 py-2 sm:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={data}>
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.18)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.3)",
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(248,250,252,0.9)" }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#fb923c"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ReLineChart>
        </ResponsiveContainer>
      </div>

      {/* 日別増減 */}
      <div className="mb-3 h-20 rounded-xl border border-white/10 bg-[#040712]/90 px-2 py-1.5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.3)",
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(248,250,252,0.9)" }}
            />
            <Bar
              dataKey="delta"
              radius={[4, 4, 4, 4]}
              fill="url(#deltaGradient)"
            />
            <defs>
              <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] leading-relaxed text-white/80 sm:text-xs">
        あなたの Unit 推移を折れ線グラフで表示。
        <br />
        直近7日 / 30日 / 全期間の増減やドローダウンを一目で振り返れます。
      </p>
    </div>
  );
}
