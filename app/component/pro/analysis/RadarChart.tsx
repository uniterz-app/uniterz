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
    { key: "precision", label: "スコア精度", value: value.precision },
    { key: "upset", label: "Upset", value: value.upset },
    { key: "volume", label: "投稿量", value: value.volume },
    { key: "streak", label: "耐性", value: value.streak },
    { key: "market", label: "市場志向", value: value.market },
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
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReRadarChart data={data} outerRadius="65%">
            {/* グリッド */}
            <PolarGrid stroke="rgba(251,146,60,0.18)" radialLines />

            {/* 軸ラベル（指標名 + 数値） */}
            <PolarAngleAxis
              dataKey="label"
              tick={(props) => {
                const payloadValue = props.payload?.value;
                const item = data.find((d) => d.label === payloadValue);
                if (!item) return <g />;

                const x = Number(props.x);
                const y = Number(props.y);
                const cx = Number(props.cx);
                const cy = Number(props.cy);

                const dx = x - cx;
                const dy = y - cy;

                const OFFSET = 16;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const nx = (dx / dist) * OFFSET;
                const ny = (dy / dist) * OFFSET;

                return (
                  <g transform={`translate(${x + nx}, ${y + ny})`}>
                    <text
                      y={0}
                      textAnchor="middle"
                      fill="rgba(248,250,252,0.95)"
                      fontSize={12}
                      fontWeight={600}
                    >
                      {item.label}
                    </text>
                    <text
                      y={14}
                      textAnchor="middle"
                      fill="#fb923c"
                      fontSize={11}
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

            {/* ベース */}
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

      {/* 補足説明 */}
      <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-white/65">
        <p>
          <span className="font-semibold text-white/80">市場志向：</span>
          多数派（順当）を選ぶ傾向か、少数派（逆張り）を選ぶ傾向かを示します。
        </p>
        <p>
          <span className="font-semibold text-white/80">耐性：</span>
          連続した結果の中でも判断がブレにくいかを示します。連勝と連敗をもとに判断
        </p>
        <p>
          <span className="font-semibold text-white/80">スコア精度：</span>
          勝敗だけでなく、点差や展開まで含めた読みの正確さを示します。
        </p>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/70">
        今月の分析指標を 0–10 スケールで可視化しています。
        <br />
        外側に広がるほど、その分野が強みです。
      </p>

      {!value.upsetValid && (
        <p className="mt-1 text-[11px] leading-relaxed text-white/50">
          Upset は今月の発生試合数が少ないため評価対象外です（5試合未満）。
        </p>
      )}
    </div>
  );
}
