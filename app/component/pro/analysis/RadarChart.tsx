"use client";

import { useEffect, useState } from "react";
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
  const [openInfo, setOpenInfo] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    const update = () => setIsWeb(window.innerWidth >= 960);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const data = [
    { key: "winRate", label: "勝率", value: value.winRate },
    { key: "precision", label: "スコア精度", value: value.precision },
    { key: "upset", label: "Upset", value: value.upset },
    { key: "volume", label: "投稿量", value: value.volume },
    { key: "streak", label: "耐性", value: value.streak },
  ];

  const chartHeight = isWeb ? 280 : 220;
  const outerRadius = isWeb ? "64%" : "62%";
  const labelFontSize = isWeb ? 15 : 11;
  const valueFontSize = isWeb ? 13 : 10;
  const radiusTickFontSize = isWeb ? 11 : 9;
  const valueYOffset = isWeb ? 16 : 13;
  const offset = isWeb ? 18 : 14;

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-white/60 lg:text-sm">分析バランス</div>
          <div className="text-sm font-semibold text-white lg:text-base">
            レーダーチャート
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenInfo((v) => !v)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 lg:text-xs"
        >
          {openInfo ? "説明を閉じる" : "説明を見る"}
        </button>
      </div>

      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReRadarChart
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid stroke="rgba(251,146,60,0.18)" radialLines />

            <PolarAngleAxis
              dataKey="label"
              tick={(props: any) => {
                const payloadValue = props?.payload?.value;
                const item = data.find((d) => d.label === payloadValue);
                if (!item) return <g />;

                const x = Number(props?.x);
                const y = Number(props?.y);
                const cx = Number(props?.cx);
                const cy = Number(props?.cy);

                if (
                  Number.isNaN(x) ||
                  Number.isNaN(y) ||
                  Number.isNaN(cx) ||
                  Number.isNaN(cy)
                ) {
                  return <g />;
                }

                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const nx = (dx / dist) * offset;
                const ny = (dy / dist) * offset;

                return (
                  <g transform={`translate(${x + nx}, ${y + ny})`}>
                    <text
                      y={0}
                      textAnchor="middle"
                      fill="rgba(248,250,252,0.95)"
                      fontSize={labelFontSize}
                      fontWeight={600}
                    >
                      {item.label}
                    </text>
                    <text
                      y={valueYOffset}
                      textAnchor="middle"
                      fill="#fb923c"
                      fontSize={valueFontSize}
                      fontWeight={700}
                    >
                      {item.value.toFixed(1)}
                    </text>
                  </g>
                );
              }}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tickCount={6}
              tick={{
                fill: "rgba(148,163,184,0.7)",
                fontSize: radiusTickFontSize,
              }}
              axisLine={false}
            />

            <Radar
              dataKey="value"
              stroke="#fb923c"
              fill="#fb923c"
              fillOpacity={0.9}
              strokeWidth={2.5}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </ReRadarChart>
        </ResponsiveContainer>
      </div>

      {openInfo && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="space-y-1.5 text-[11px] leading-relaxed text-white/65 lg:text-[13px]">
            <p>
              <span className="font-semibold text-white/80">勝率：</span>
              的中率の高さを示します。高いほど安定して勝敗を当てています。
            </p>
            <p>
              <span className="font-semibold text-white/80">スコア精度：</span>
              予想スコアと実際スコアの近さを示します。
            </p>
            <p>
              <span className="font-semibold text-white/80">Upset：</span>
              波乱が起きる試合で少数派側を正しく当てる力を示します。
            </p>
            <p>
              <span className="font-semibold text-white/80">投稿量：</span>
              主戦場リーグ内での活動量を相対比較した指標です。多く投稿しているほど高くなります。
            </p>
            <p>
              <span className="font-semibold text-white/80">耐性：</span>
              連続した結果の中でも判断がブレにくいかを示します。連勝と連敗をもとに判断します。
            </p>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-white/70 lg:text-[13px]">
            今月の分析指標を 0–10 スケールで可視化しています。
            <br />
            外側に広がるほど、その分野が強みです。
          </p>

          {!value.upsetValid && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/50 lg:text-[13px]">
              Upset は今月の発生試合数が少ないため評価対象外です（5試合未満）。
            </p>
          )}
        </div>
      )}
    </div>
  );
}