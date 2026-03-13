// app/component/result/ResultMarketCard.tsx
"use client";

import React from "react";
import DonutChart from "@/app/component/predict/DonutChart";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { PieChart } from "lucide-react";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
};

export default function ResultMarketCard({ post, market }: Props) {
  const normalizedLeague = normalizeLeague(post.league);

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#3B82F6";

  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#EF4444";

  const isSoccer = post.league === "j1" || post.league === "pl";

  const segments = isSoccer
    ? [
        {
          label: post.home?.name ?? "Home",
          value: market?.homeRate ?? 0,
          color: homeColor,
        },
        {
          label: "Draw",
          value: market?.drawRate ?? 0,
          color: "#9CA3AF",
        },
        {
          label: post.away?.name ?? "Away",
          value: market?.awayRate ?? 0,
          color: awayColor,
        },
      ]
    : [
        {
          label: post.home?.name ?? "Home",
          value: market?.homeRate ?? 0,
          color: homeColor,
        },
        {
          label: post.away?.name ?? "Away",
          value: market?.awayRate ?? 0,
          color: awayColor,
        },
      ];

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)] min-h-[480px] text-white">
      <div className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center">
          <PieChart className="h-3 w-3 text-orange-400" />
        </div>
        <span>Market Bias</span>
      </div>

      <div className="flex flex-col items-center gap-6">
        <DonutChart segments={segments} size={240} thickness={75} />

        {/* 凡例 */}
        <div className="space-y-3 text-sm mt-4">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-white/85">{seg.label}</span>
              <span className="tabular-nums text-white/70">
                {(seg.value * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {typeof market?.total === "number" && (
          <div className="text-sm text-white/60 mt-3">
            Total Predictions: {market.total}
          </div>
        )}
      </div>
    </div>
  );
}