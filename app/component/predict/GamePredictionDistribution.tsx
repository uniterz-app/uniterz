"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  fetchGamePredictionCounts,
  isSoccerMarketLeague,
} from "@/lib/predict/gameMarketDistribution";
import DonutChart from "./DonutChart";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n/t";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

type Props = {
  gameId: string;
  league: "nba" | "bj" | "j1" | "pl" | "wc";
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  variant?: "default" | "predictForm";
  chartReplayKey?: number;
  fallbackMarketBias?: { homePct: number; awayPct: number };
};

type Seg = { label: string; value: number; color: string };

function buildSegments(
  total: number,
  homeCount: number,
  awayCount: number,
  drawCount: number,
  isSoccer: boolean,
  homeName: string,
  awayName: string,
  homeColor: string,
  awayColor: string,
  drawLabel: string
): Seg[] {
  if (total <= 0) return [];
  if (isSoccer) {
    return [
      { label: homeName, value: homeCount / total, color: homeColor },
      {
        label: drawLabel,
        value: drawCount / total,
        color: "#9ca3af",
      },
      { label: awayName, value: awayCount / total, color: awayColor },
    ];
  }
  return [
    { label: homeName, value: homeCount / total, color: homeColor },
    { label: awayName, value: awayCount / total, color: awayColor },
  ];
}

function buildFallbackSegments(
  bias: { homePct: number; awayPct: number },
  isSoccer: boolean,
  homeName: string,
  awayName: string,
  homeColor: string,
  awayColor: string,
  drawLabel: string
): Seg[] {
  const h = Math.max(0, bias.homePct);
  const a = Math.max(0, bias.awayPct);
  const s = Math.max(1e-6, h + a);
  if (isSoccer) {
    return [
      { label: homeName, value: h / s, color: homeColor },
      {
        label: drawLabel,
        value: 0,
        color: "#9ca3af",
      },
      { label: awayName, value: a / s, color: awayColor },
    ].filter((x) => x.value > 0.001);
  }
  return [
    { label: homeName, value: h / s, color: homeColor },
    { label: awayName, value: a / s, color: awayColor },
  ];
}

export default function GamePredictionDistribution({
  gameId,
  league,
  homeName,
  awayName,
  homeColor,
  awayColor,
  variant = "default",
  chartReplayKey = 0,
  fallbackMarketBias,
}: Props) {
  const pathname = usePathname() ?? "";
  const layoutMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const teamNameTy = bracketMarketTeamTypography(layoutMobile);
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const [homeCount, setHomeCount] = useState(0);
  const [awayCount, setAwayCount] = useState(0);
  const [drawCount, setDrawCount] = useState(0);

  useEffect(() => {
    let alive = true;

    fetchGamePredictionCounts(gameId)
      .then(({ homeCount, awayCount, drawCount }) => {
        if (!alive) return;
        setHomeCount(homeCount);
        setAwayCount(awayCount);
        setDrawCount(drawCount);
      })
      .catch(() => {
        if (!alive) return;
        setHomeCount(0);
        setAwayCount(0);
        setDrawCount(0);
      });

    return () => {
      alive = false;
    };
  }, [gameId]);

  const isSoccer = isSoccerMarketLeague(league);
  const total = homeCount + awayCount + (isSoccer ? drawCount : 0);
  const sumFb =
    (fallbackMarketBias?.homePct ?? 0) + (fallbackMarketBias?.awayPct ?? 0);
  const hasFallback = sumFb > 0;

  const fromFallback = total === 0 && hasFallback;
  const segments: Seg[] =
    total > 0
      ? buildSegments(
          total,
          homeCount,
          awayCount,
          drawCount,
          isSoccer,
          homeName,
          awayName,
          homeColor,
          awayColor,
          m.predict.draw
        )
      : hasFallback && fallbackMarketBias
        ? buildFallbackSegments(
            fallbackMarketBias,
            isSoccer,
            homeName,
            awayName,
            homeColor,
            awayColor,
            m.predict.draw
          )
        : [];

  if (total === 0 && !hasFallback) {
    const emptyCls =
      variant === "predictForm"
        ? layoutMobile
          ? "py-3 text-center text-xs text-white/60"
          : "py-4 text-center text-sm text-white/60"
        : "rounded-xl border border-white/10 p-4 text-white/70";
    return (
      <div className={emptyCls}>
        {m.common.noData}
      </div>
    );
  }

  if (variant === "predictForm") {
    const web = !layoutMobile;
    const chartSize = web ? 240 : 176;
    const chartThickness = web ? 72 : 56;

    return (
      <div className="text-white">
        <div
          className={[
            "flex items-center justify-center",
            web ? "mb-4" : "mb-3 md:mb-4",
          ].join(" ")}
        >
          <span
            className={[
              "font-semibold",
              web ? "text-base" : "text-sm md:text-base",
            ].join(" ")}
          >
            {m.predict.marketBias}
          </span>
        </div>

        <div
          className={[
            "flex flex-col items-center",
            web ? "gap-6" : "gap-5",
          ].join(" ")}
        >
          <div className="shrink-0">
            <DonutChart
              key={`pf-${chartReplayKey}`}
              segments={segments}
              size={chartSize}
              thickness={chartThickness}
              ariaLabel={m.predict.predictionMarketShare}
            />
          </div>

          <div
            className={[
              "w-full space-y-3",
              web ? "max-w-[360px] space-y-4 text-base" : "max-w-[280px] text-sm",
            ].join(" ")}
          >
            {!fromFallback ? (
              <div
                className={[
                  "mb-1 text-center text-white/70",
                  web ? "text-sm" : "text-[11px]",
                ].join(" ")}
              >
                {m.predict.totalPredictions}
                <span
                  className={[
                    resultStatsMetricNumClass,
                    web ? "text-base font-bold text-white/90" : "",
                  ].join(" ")}
                >
                  {total}
                </span>
              </div>
            ) : (
              <div
                className={[
                  "text-center leading-snug text-white/55",
                  web ? "text-xs" : "text-[10px]",
                ].join(" ")}
              >
                {m.predict.marketBias}
              </div>
            )}
            {segments.map((seg, i) => (
              <div
                key={i}
                className={[
                  "flex items-center justify-center",
                  web ? "gap-4" : "gap-3",
                ].join(" ")}
              >
                <span
                  className={[
                    "rounded-sm",
                    web ? "h-4 w-4" : "h-3 w-3",
                  ].join(" ")}
                  style={{ backgroundColor: seg.color }}
                />
                <span
                  className={[
                    "max-w-[58%] truncate font-bold text-white/85",
                    web ? "text-sm" : "text-xs",
                  ].join(" ")}
                  style={teamNameTy}
                >
                  {seg.label}
                </span>
                <span
                  className={[
                    resultStatsMetricNumClass,
                    web ? "text-base font-bold text-white/85" : "text-white/70",
                  ].join(" ")}
                >
                  {(seg.value * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 text-white">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-10">
        <div className="shrink-0">
          <div className="md:hidden">
            <DonutChart segments={segments} size={140} thickness={50} />
          </div>
          <div className="hidden md:block">
            <DonutChart segments={segments} size={260} thickness={80} />
          </div>
        </div>

        <div className="space-y-3 text-sm md:space-y-4 md:text-base">
          <div className="mb-2 text-center text-xs text-white/70 md:text-left md:text-sm">
            {m.predict.totalAnalyses}
            <span className={resultStatsMetricNumClass}>{total}</span>
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: homeColor }}
            />
            <span
              className="whitespace-nowrap font-bold"
              style={teamNameTy}
            >
              {homeName}
            </span>
            <span className={resultStatsMetricNumClass}>
              {((homeCount / total) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: awayColor }}
            />
            <span
              className="whitespace-nowrap font-bold"
              style={teamNameTy}
            >
              {awayName}
            </span>
            <span className={resultStatsMetricNumClass}>
              {((awayCount / total) * 100).toFixed(1)}%
            </span>
          </div>

          {isSoccer && (
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="h-3 w-3 rounded-sm bg-gray-400" />
              <span
                className="whitespace-nowrap font-bold"
                style={teamNameTy}
              >
                {m.predict.draw}
              </span>
              <span className={resultStatsMetricNumClass}>
                {((drawCount / total) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
