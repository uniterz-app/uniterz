"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* =====================
 * Dummy Data
 * ===================*/

const summary = {
  upsetOpportunity: 12,
  upsetPick: 9,
  upsetHit: 5,
  upsetWinRate: 0.556,
};

const gauge = [
  { name: "hit", value: summary.upsetWinRate },
  { name: "rest", value: 1 - summary.upsetWinRate },
];

const hitGames = [
  {
    gameId: "nba-1",
    label: "LAL @ DEN",
    marketMajorityRatio: 0.82,
    winDiff: 14,
    confidence: 0.78,
  },
  {
    gameId: "nba-2",
    label: "BOS @ MIL",
    marketMajorityRatio: 0.76,
    winDiff: 11,
    confidence: 0.65,
  },
  {
    gameId: "nba-3",
    label: "PHX @ GSW",
    marketMajorityRatio: 0.91,
    winDiff: 18,
    confidence: 0.84,
  },
];

/* =====================
 * Colors
 * ===================*/

const GREEN = "#3cffb0";
const PINK = "#ec4899";

/* =====================
 * View
 * ===================*/

export default function UpsetAnalysisView() {
  return (
    <div className="space-y-6">
      {/* ===== Summary ===== */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Upset Games" value={summary.upsetOpportunity} />
        <Stat label="Upset Picks" value={summary.upsetPick} />
        <Stat label="Upset Hits" value={summary.upsetHit} />
      </div>

      {/* ===== WinRate Gauge ===== */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-2">
          Upset Win Rate
        </div>

        <div className="relative h-44">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={gauge}
                startAngle={180}
                endAngle={0}
                innerRadius="70%"
                outerRadius="100%"
                dataKey="value"
              >
                <Cell fill={GREEN} />
                <Cell fill="rgba(255,255,255,0.08)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold" style={{ color: GREEN }}>
              {(summary.upsetWinRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-white/40">
              {summary.upsetHit}/{summary.upsetOpportunity}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Difficulty Map ===== */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70 mb-2">
          Upset Difficulty
        </div>

        <div className="h-56">
          <ResponsiveContainer>
            <ScatterChart>
              <XAxis
                dataKey="marketMajorityRatio"
                domain={[0.6, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fill: "#aaa", fontSize: 10 }}
              />
              <YAxis
                dataKey="winDiff"
                domain={[0, 25]}
                tick={{ fill: "#aaa", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0b12",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                labelFormatter={(_, p: any) =>
                  p?.[0]?.payload?.label
                }
              />
              <Scatter data={hitGames} fill={PINK} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Hit Cards ===== */}
      <div className="space-y-3">
        {hitGames.map((g) => (
          <div
            key={g.gameId}
            className="rounded-xl border border-white/10 bg-black/40 p-3"
          >
            <div className="text-sm text-white">{g.label}</div>
            <div className="mt-1 text-xs text-white/50">
              Market {Math.round(g.marketMajorityRatio * 100)}% / WinDiff{" "}
              {g.winDiff}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] text-white/50">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
