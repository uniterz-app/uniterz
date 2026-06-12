// app/component/result/mobile/MobileResultMarketCard.tsx
"use client";

import React, { memo, useMemo } from "react";
import DonutChart from "@/app/component/predict/DonutChart";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamAlias } from "@/lib/team-alias";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { Scale } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resultDetailPanelClass } from "@/lib/result/resultGlass";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

function getMobileTeamName(
  league: string,
  rawName: string,
  l1: string,
  l2?: string
) {
  if (league === "nba") return l2 || rawName;
  if (league === "pl") return getTeamAlias(rawName) ?? rawName;
  return [l1, l2].filter(Boolean).join(" ");
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
  donutDrawDelayMs?: number;
  language?: Language;
};

function MobileResultMarketCard({
  post,
  market,
  inOverlay = false,
  donutDrawDelayMs,
  language = "ja",
}: Props) {
  const m = t(language);
  const normalizedLeague = normalizeLeague(post.league);
  const teamNameFont = bracketMarketTeamTypography(true);

  const homeColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#3B82F6";
  const awayColor =
    getTeamJerseyPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#EF4444";

  const isSoccer = post.league === "j1" || post.league === "pl";

  const [homeL1, homeL2] = splitTeamNameByLeague(
    post.league,
    post.home?.name ?? ""
  );
  const [awayL1, awayL2] = splitTeamNameByLeague(
    post.league,
    post.away?.name ?? ""
  );

  const homeLegendName =
    getMobileTeamName(
      post.league,
      post.home?.name ?? "",
      homeL1,
      homeL2
    ) || m.predict.home;
  const awayLegendName =
    getMobileTeamName(
      post.league,
      post.away?.name ?? "",
      awayL1,
      awayL2
    ) || m.predict.away;

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
              label: m.results.drawLabel,
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
      m,
    ]
  );

  const shell = `${resultDetailPanelClass({ padding: "p-4", mobile: true })} text-white`;

  return (
    <div className={shell}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
        <Scale className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
        <span>{m.results.marketBiasTitle}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut（小さめ） */}
        <div className="shrink-0">
          <DonutChart
            segments={segments}
            size={132}
            thickness={42}
            drawDelayMs={donutDrawDelayMs}
          />
        </div>

        {/* 凡例カラム */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Total：凡例の一番上 */}
          {typeof market?.total === "number" && (
            <div
              className={[
                "pl-4 text-[11px] leading-tight text-white/65 md:text-[12px]",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              {m.results.totalPredictionsCount}{market.total}
            </div>
          )}

          {segments.map((seg, i) => {
            const isDraw = seg.label === m.results.drawLabel;
            return (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      isDraw
                        ? "truncate font-semibold leading-tight text-[12px] text-white/80 md:text-[13px]"
                        : "truncate font-bold leading-tight text-[13px] text-white/90 md:text-[17px]"
                    }
                    style={isDraw ? undefined : teamNameFont}
                  >
                    {seg.label}
                  </div>
                  <div
                    className={[
                      "mt-0.5 text-[11px] leading-tight text-white/80 md:text-[12px]",
                      resultStatsMetricNumClass,
                    ].join(" ")}
                  >
                    {(seg.value * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}

export default memo(MobileResultMarketCard);