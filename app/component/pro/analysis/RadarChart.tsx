"use client";

import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import type { RadarChartProps } from "./types";

export default function RadarChart({ value }: RadarChartProps) {
  const data = [
    { key: "winRate", label: "勝率", value: value.winRate },
    { key: "accuracy", label: "精度", value: value.accuracy },
    { key: "precision", label: "スコア", value: value.precision },
    { key: "upset", label: "Upset", value: value.upset },
    { key: "volume", label: "投稿量", value: value.volume },
  ];

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      {/* 見出し */}
      <div className="mb-3">
        <div className="text-xs text-white/60">分析バランス</div>
        <div className="text-sm font-semibold text-white">
          レーダーチャート
        </div>
      </div>

      {/* チャート */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReRadarChart data={data} outerRadius="75%">
            {/* グリッド */}
            <PolarGrid stroke="rgba(251,146,60,0.18)" radialLines />

            {/* 軸ラベル（指標名 + 数値） */}
            <PolarAngleAxis
              dataKey="label"
              tick={(props) => {
                const payloadValue = props.payload?.value;
                const item = data.find(
                  (d) => d.label === payloadValue
                );
                if (!item) return <g />;

                // ★ string | number → number に確定させる
                const x = Number(props.x);
                const y = Number(props.y);
                const cx = Number(props.cx);
                const cy = Number(props.cy);

                const dx = x - cx;
                const dy = y - cy;

                const OFFSET = 18;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const nx = (dx / dist) * OFFSET;
                const ny = (dy / dist) * OFFSET;

                return (
                  <g transform={`translate(${x + nx}, ${y + ny})`}>
                    {/* 指標名 */}
                    <text
                      y={0}
                      textAnchor="middle"
                      fill="rgba(248,250,252,0.95)"
                      fontSize={13}
                      fontWeight={600}
                      letterSpacing={0.3}
                    >
                      {item.label}
                    </text>

                    {/* 数値 */}
                    <text
                      y={15}
                      textAnchor="middle"
                      fill="#fb923c"
                      fontSize={12}
                      fontWeight={700}
                    >
                      {item.value.toFixed(1)}
                    </text>
                  </g>
                );
              }}
            />

            {/* 半径（0–10） */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tickCount={6}
              tick={{
                fill: "rgba(148,163,184,0.7)",
                fontSize: 10,
              }}
              axisLine={false}
            />

            {/* ベース（薄） */}
            <Radar
              dataKey="value"
              stroke="rgba(251,146,60,0.25)"
              fill="rgba(251,146,60,0.15)"
              fillOpacity={0.15}
              strokeWidth={1}
              isAnimationActive={false}
            />

            {/* メイン */}
            <Radar
              dataKey="value"
              stroke="#fb923c"
              fill="#fb923c"
              fillOpacity={0.35}
              strokeWidth={2.5}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </ReRadarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/70">
        今月の分析指標を 0–10 スケールで可視化しています。
        <br />
        外側に広がるほど、その分野が強みです。
      </p>
    </div>
  );
}
