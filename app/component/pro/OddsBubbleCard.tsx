// app/component/pro/OddsBubbleCard.tsx
"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import type { RangeValue } from "./ProShared";

type OddsBubble = {
  band: string;
  centerOdds: number;
  winRate: number;
  roi: number;
  count: number;
};

const MOCK_ODDS_BUBBLES: Record<RangeValue, OddsBubble[]> = {
  "7d": [
    { band: "2.0–4.0", centerOdds: 3, winRate: 68, roi: 1.24, count: 18 },
    { band: "4.0–7.0", centerOdds: 5.5, winRate: 52, roi: 1.12, count: 9 },
    { band: "7.0–10.0", centerOdds: 8.5, winRate: 38, roi: 0.96, count: 6 },
    { band: "10.0–15.0", centerOdds: 12.5, winRate: 31, roi: 0.92, count: 4 },
    { band: "15.0–30.0", centerOdds: 20, winRate: 18, roi: 0.81, count: 3 },
    { band: "30.0+", centerOdds: 35, winRate: 7, roi: 0.55, count: 2 },
  ],
  "30d": [
    { band: "2.0–4.0", centerOdds: 3, winRate: 62, roi: 1.18, count: 64 },
    { band: "4.0–7.0", centerOdds: 5.5, winRate: 48, roi: 1.05, count: 37 },
    { band: "7.0–10.0", centerOdds: 8.5, winRate: 35, roi: 0.97, count: 22 },
    { band: "10.0–15.0", centerOdds: 12.5, winRate: 29, roi: 0.91, count: 16 },
    { band: "15.0–30.0", centerOdds: 20, winRate: 19, roi: 0.84, count: 11 },
    { band: "30.0+", centerOdds: 35, winRate: 9, roi: 0.61, count: 6 },
  ],
  all: [
    { band: "2.0–4.0", centerOdds: 3, winRate: 58, roi: 1.12, count: 210 },
    { band: "4.0–7.0", centerOdds: 5.5, winRate: 46, roi: 1.02, count: 135 },
    { band: "7.0–10.0", centerOdds: 8.5, winRate: 33, roi: 0.95, count: 82 },
    { band: "10.0–15.0", centerOdds: 12.5, winRate: 27, roi: 0.90, count: 54 },
    { band: "15.0–30.0", centerOdds: 20, winRate: 18, roi: 0.86, count: 38 },
    { band: "30.0+", centerOdds: 35, winRate: 8, roi: 0.63, count: 21 },
  ],
};

export default function OddsBubbleCard() {
  const [range, setRange] = useState<RangeValue>("30d");
  const data = MOCK_ODDS_BUBBLES[range];

  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/5 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] sm:p-4">
      <div className="mb-2.5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15">
          <Target className="h-4 w-4 text-yellow-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug sm:text-[15px]">
              オッズ帯ごとの勝率を自動集計
            </h3>
            <span className="hidden items-center rounded-full border border-white/20 bg-white/10 px-2 py-[2px] text-[10px] text-white/80 sm:inline-flex">
              得意レンジ
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/80 sm:text-xs">
            どの帯が「得意ゾーン」で、どこが「危険ゾーン」かを一目で把握できます。
          </p>
        </div>
      </div>

      {/* レンジタブ */}
      <div className="mb-2 flex justify-end">
        <div className="inline-flex items-center rounded-full bg-white/5 p-[3px] text-[11px]">
          {(["7d", "30d", "all"] as RangeValue[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-[4px] rounded-full transition ${
                range === r
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_0_1px_rgba(251,191,36,0.7)]"
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

      {/* バブルチャート */}
      <div className="mb-2 h-40 rounded-xl border border-white/10 bg-[#050814]/90 px-2 py-2 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid
              stroke="rgba(148,163,184,0.25)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              dataKey="centerOdds"
              domain={[2, 36]}
              tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}x`}
            />
            <YAxis
              type="number"
              dataKey="winRate"
              domain={[0, 80]}
              tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{
                stroke: "rgba(148,163,184,0.7)",
                strokeDasharray: "3 3",
              }}
              content={<OddsBubbleTooltip />}
            />
            <Scatter
              data={data}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const p = payload as OddsBubble;
                const r = 4 + Math.sqrt(p.count);
                const color = getBubbleColorByWinRate(p.winRate);
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + 3}
                      fill={color}
                      fillOpacity={0.25}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      fillOpacity={0.9}
                    />
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] leading-relaxed text-white/75 sm:text-xs">
        バブルの位置＝オッズ帯 × 勝率、サイズ＝試行数、色＝勝率の高さ。
        「ここが自分の勝ちパターン」というゾーンが直感的に見えてきます。
      </p>
    </div>
  );
}

function getBubbleColorByWinRate(winRate: number): string {
  if (winRate >= 60) return "#22c55e";
  if (winRate >= 40) return "#38bdf8";
  if (winRate >= 25) return "#eab308";
  return "#f97316";
}

function OddsBubbleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as OddsBubble;

  return (
    <div className="rounded-xl border border-white/20 bg-[#020617]/95 px-3 py-2 text-[11px] text-white">
      <div className="mb-1 font-semibold">{p.band}</div>
      <div>勝率：{p.winRate.toFixed(1)}%</div>
      <div>ROI：{(p.roi * 100).toFixed(0)}%</div>
      <div>試行数：{p.count} 本</div>
    </div>
  );
}
