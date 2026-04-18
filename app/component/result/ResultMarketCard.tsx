// app/component/result/ResultMarketCard.tsx
"use client";

import React, { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import DonutChart from "@/app/component/predict/DonutChart";
import { normalizeLeague, type League } from "@/lib/leagues";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamAlias } from "@/lib/team-alias";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { Scale } from "lucide-react";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

function formatResultMarketTeamLabel(
  league: League,
  raw: string | undefined,
  isMobileRoute: boolean
): string {
  const name = raw ?? "";
  const [l1, l2] = splitTeamNameByLeague(league, name);
  if (isMobileRoute) {
    if (league === "nba") return l2 || name;
    if (league === "pl") return getTeamAlias(name) ?? name;
    return [l1, l2].filter(Boolean).join(" ");
  }
  const desktop = `${l1} ${l2}`.trim();
  return desktop || name;
}

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
  inOverlay?: boolean;
  /** Web で得点分布と横並びのとき、縦の min-height を外して高さを自然に */
  sideBySideLayout?: boolean;
  /** リザルト詳細の入場に合わせてドーナツの円周描画を遅延（ms）。未指定は即時 */
  donutDrawDelayMs?: number;
};

function ResultMarketCard({
  post,
  market,
  inOverlay = false,
  sideBySideLayout = false,
  donutDrawDelayMs,
}: Props) {
  const pathname = usePathname();
  const isMobileRoute = pathname?.startsWith("/mobile") ?? false;
  const teamNameFont = bracketMarketTeamTypography(isMobileRoute);

  const normalizedLeague = normalizeLeague(post.league);

  const homeColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#3B82F6";

  const awayColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#EF4444";

  const isSoccer = post.league === "j1" || post.league === "pl";

  const homeLegendName =
    formatResultMarketTeamLabel(
      normalizedLeague,
      post.home?.name,
      isMobileRoute
    ) || "Home";
  const awayLegendName =
    formatResultMarketTeamLabel(
      normalizedLeague,
      post.away?.name,
      isMobileRoute
    ) || "Away";

  const segments = useMemo(
    () =>
      isSoccer
        ? [
            {
              label: homeLegendName,
              value: market?.homeRate ?? 0,
              color: homeColor,
            },
            {
              label: "Draw",
              value: market?.drawRate ?? 0,
              color: "#9CA3AF",
            },
            {
              label: awayLegendName,
              value: market?.awayRate ?? 0,
              color: awayColor,
            },
          ]
        : [
            {
              label: homeLegendName,
              value: market?.homeRate ?? 0,
              color: homeColor,
            },
            {
              label: awayLegendName,
              value: market?.awayRate ?? 0,
              color: awayColor,
            },
          ],
    [
      isSoccer,
      homeLegendName,
      awayLegendName,
      homeColor,
      awayColor,
      market?.homeRate,
      market?.awayRate,
      market?.drawRate,
    ]
  );

  const minH = sideBySideLayout ? "min-h-0" : "min-h-[480px]";
  const shell = inOverlay
    ? `${MATCH_OVERLAY_GLASS_PANEL} relative overflow-hidden p-6 ${minH} text-white`
    : `relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)] ${minH} text-white`;

  return (
    <div className={shell}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      <div className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        <Scale className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
        <span>Market Bias</span>
      </div>

      <div className="flex flex-col items-center gap-6">
        <DonutChart
          segments={segments}
          size={196}
          thickness={62}
          drawDelayMs={donutDrawDelayMs}
        />

        {/* 凡例 — ResultMatchHeader と同じ表示フォント（チーム名 / 数値） */}
        <div className="mt-4 w-full max-w-md space-y-3">
          {segments.map((seg, i) => {
            const isDraw = seg.label === "Draw";
            return (
              <div
                key={i}
                className="flex min-w-0 items-center gap-3 text-sm md:text-base"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span
                  className={[
                    "min-w-0 flex-1 truncate font-bold leading-tight text-white",
                    isDraw
                      ? "text-white/85"
                      : "text-base md:text-lg lg:text-xl",
                  ].join(" ")}
                  style={isDraw ? undefined : teamNameFont}
                >
                  {seg.label}
                </span>
                <span
                  className={[
                    "shrink-0 text-white/90",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                >
                  {(seg.value * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {typeof market?.total === "number" && (
          <div
            className={[
              "mt-3 text-sm text-white/60 md:text-base",
              resultStatsMetricNumClass,
            ].join(" ")}
          >
            Total Predictions: {market.total}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default memo(ResultMarketCard);