"use client";

import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HomeAwayBar() {
  // ダミーデータ
  const data = [
    {
      side: "Home",
      count: 120,
      winRate: 62,
    },
    {
      side: "Away",
      count: 80,
      winRate: 55,
    },
  ];

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4">
      <div className="mb-2 text-sm font-semibold text-white">
        Home / Away 分析
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="side"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            />

            <Tooltip />

            {/* 予想数 */}
            <Bar
              yAxisId="left"
              dataKey="count"
              fill="rgba(251,146,60,0.6)"
              radius={[6, 6, 0, 0]}
            />

            {/* 勝率 */}
            <Line
              yAxisId="right"
              dataKey="winRate"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] text-white/60">
        棒：予想数 ／ 線：勝率
      </p>
    </div>
  );
}
