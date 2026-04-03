// app/component/result/mobile/MobileResultMarketCard.tsx
"use client";

import React from "react";
import DonutChart from "@/app/component/predict/DonutChart";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { PieChart } from "lucide-react";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
  inOverlay?: boolean;
};

export default function MobileResultMarketCard({
  post,
  market,
  inOverlay = false,
}: Props) {
  const normalizedLeague = normalizeLeague(post.league);

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#3B82F6";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#EF4444";

  const isSoccer = post.league === "j1" || post.league === "pl";

  const segments = isSoccer
    ? [
        { label: post.home?.name ?? "Home", value: market?.homeRate ?? 0, color: homeColor },
        { label: "Draw", value: market?.drawRate ?? 0, color: "#9CA3AF" },
        { label: post.away?.name ?? "Away", value: market?.awayRate ?? 0, color: awayColor },
      ]
    : [
        { label: post.home?.name ?? "Home", value: market?.homeRate ?? 0, color: homeColor },
        { label: post.away?.name ?? "Away", value: market?.awayRate ?? 0, color: awayColor },
      ];

  const shell = inOverlay
    ? `${MATCH_OVERLAY_GLASS_PANEL} p-4 text-white`
    : "rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)] text-white";

  return (
    <div className={shell}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center">
          <PieChart className="h-3 w-3 text-orange-400" />
        </div>
        <span className="text-sm font-semibold">Market Bias</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut（小さめ） */}
        <div className="shrink-0">
          <DonutChart segments={segments} size={132} thickness={42} />
        </div>

        {/* 凡例カラム */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Total：凡例の一番上 */}
          {typeof market?.total === "number" && (
<div className="text-[11px] text-white/65 tabular-nums pl-4">
  Total: {market.total}
</div>
          )}

          {segments.map((seg, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="mt-1 w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <div className="min-w-0">
                <div className="text-xs text-white/85 truncate leading-tight">
                  {seg.label}
                </div>
                <div className="text-[11px] tabular-nums text-white/65 mt-0.5 leading-tight">
                  {(seg.value * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}