// app/(dev)/pro-upset-preview/page.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const summary = {
  upsetGames: 12,
  upsetPicked: 9,
  upsetHits: 5,
};

const hitRate =
  summary.upsetPicked > 0
    ? Math.round((summary.upsetHits / summary.upsetPicked) * 100)
    : 0;

const chartData = [
  { name: "Upset機会", value: summary.upsetGames },
  { name: "予想したUpset", value: summary.upsetPicked },
  { name: "的中Upset", value: summary.upsetHits },
];

const hitSamples = [
  {
    game: "LAL vs DEN",
    market: "DEN 82%",
    rankDiff: "+11",
    winDiff: "+14",
  },
  {
    game: "GSW vs BOS",
    market: "BOS 76%",
    rankDiff: "+9",
    winDiff: "+12",
  },
  {
    game: "MIL vs PHI",
    market: "PHI 71%",
    rankDiff: "+8",
    winDiff: "+10",
  },
];

export default function ProUpsetPreviewPage() {
  return (
    <div className="min-h-screen bg-[#030712] p-6 text-white space-y-6">
      {/* タイトル */}
      <div>
        <h1 className="text-xl font-bold tracking-wide text-cyan-300">
          Upset Performance
        </h1>
        <p className="text-xs text-white/50">
          市場の逆を突いた予想の成果
        </p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Upset発生試合" value={summary.upsetGames} />
        <StatCard label="Upset予想回数" value={summary.upsetPicked} />
        <StatCard label="Upset的中率" value={`${hitRate}%`} accent />
      </div>

      {/* グラフ */}
      <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-4">
        <div className="mb-2 text-sm font-semibold text-white">
          Upset 成果分布
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,.3)",
                  borderRadius: 10,
                  fontSize: 11,
                }}
              />
              <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upset 試合カード */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-white">
          的中した Upset 試合
        </div>

        {hitSamples.map((g, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-black/60 p-4 flex justify-between items-center"
          >
            <div>
              <div className="text-sm font-semibold">{g.game}</div>
              <div className="text-[11px] text-white/60">
                市場偏り {g.market}
              </div>
            </div>

            <div className="flex gap-4 text-xs text-white/80">
              <span>順位差 {g.rankDiff}</span>
              <span>勝数差 {g.winDiff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        accent
          ? "border-cyan-400/40 bg-cyan-400/10"
          : "border-white/10 bg-black/60",
      ].join(" ")}
    >
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
