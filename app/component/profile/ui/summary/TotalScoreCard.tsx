"use client";

import React, {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { Crown } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";
import DonutChart from "@/app/component/predict/DonutChart";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";

type Props = {
  totalPoints: number;
  analyses: number;
  totalPointsRank?: number | null;
  basePoints?: number;
  upsetBonusPoints?: number;
  streakBonusPoints?: number;
  periodLabel?: string;
  compact?: boolean;
  className?: string;
  language?: Language;
};

function formatOrdinal(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  const mod10 = rank % 10;
  if (mod10 === 1) return `${rank}st`;
  if (mod10 === 2) return `${rank}nd`;
  if (mod10 === 3) return `${rank}rd`;
  return `${rank}th`;
}

const TOTAL_SCORE_TOOLTIP =
  "勝者的中・点差/合計点の近さで決まる基本点に、アップセットボーナスと連勝ボーナスを加えた包括スコア。";

/** DonutChart のグラデ混色を踏まえ、暗背景でも隣接セグメントが判別しやすい色相差 */
const SEG_BASE = "#2dd4bf"; // teal-400
const SEG_UPSET = "#f87171"; // red-400（結果カードの UPSET バッジと揃える）
const SEG_STREAK = "#a78bfa"; // violet-400

function TotalScoreCard({
  totalPoints,
  analyses,
  totalPointsRank = null,
  basePoints = 0,
  upsetBonusPoints = 0,
  streakBonusPoints = 0,
  periodLabel: _periodLabel,
  compact: _compact = true,
  className = "",
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [wide, setWide] = useState(false);

  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const total = Math.max(0, totalPoints ?? 0);
  const base = Math.max(0, basePoints ?? 0);
  const upset = Math.max(0, upsetBonusPoints ?? 0);
  const streak = Math.max(0, streakBonusPoints ?? 0);

  const totalCu = useCountUp(total, 1000, inView, 1, "zero");
  const baseCu = useCountUp(base, 1000, inView, 1, "zero");
  const upsetCu = useCountUp(upset, 1000, inView, 1, "zero");
  const streakCu = useCountUp(streak, 1000, inView, 1, "zero");

  const avg =
    analyses > 0
      ? formatMetricDecimals(totalPoints / analyses, 1)
      : "0";

  const tooltipMsg = isEn
    ? "Total Points within the selected period of pointsV3: winner accuracy, closeness of point difference/total, plus (conditional) upset bonus."
    : TOTAL_SCORE_TOOLTIP;
  const rankText =
    totalPointsRank != null ? ` / ${formatOrdinal(totalPointsRank)}` : "";
  const rankClass =
    totalPointsRank != null && totalPointsRank <= 20
      ? "text-yellow-300"
      : "text-white/55";

  const denom = Math.max(total, 1e-6);
  const segments = [
    { label: "base", value: Math.min(base, total) / denom, color: SEG_BASE },
    {
      label: "upset",
      value: Math.min(upset, total) / denom,
      color: SEG_UPSET,
    },
    {
      label: "streak",
      value: Math.min(streak, total) / denom,
      color: SEG_STREAK,
    },
  ].filter((s) => s.value > 1e-9);

  const chartSize = wide ? 150 : 88;
  const chartThickness = wide ? 48 : 28;

  return (
    <>
      <div
        ref={ref}
        className={[
          "relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 md:rounded-xl md:border-white/10",
          "p-2 md:p-6",
          summaryCardShadowSmClass,
          summaryCardShadowLgClass,
          "h-full",
          className,
        ].join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.36]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1 h-full">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-tight text-white md:mb-5 md:gap-2 md:text-[18px]">
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black md:h-8 md:w-8">
            <Crown className="h-2.5 w-2.5 text-orange-400 md:h-5 md:w-5" />
          </div>

          <span>{isEn ? "Total Points" : "総合得点"}</span>

          <button
            type="button"
            className="ml-0.5 text-[9px] text-white/60 hover:text-white/80 md:ml-1 md:text-[16px]"
            onClick={(e) => openTooltip(e, tooltipMsg)}
            aria-label={isEn ? "Total Points description" : "総合得点の説明"}
          >
            ⓘ
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6">
          {/* 左：合計・AVG（カード中央寄り） */}
          <div className="flex min-w-0 flex-col items-center justify-center text-center md:translate-x-1">
            <div
              className={[
                summaryMetricNumClass,
                "text-xl tabular-nums tracking-tight text-white md:text-4xl",
                "leading-none",
              ].join(" ")}
            >
              {formatMetricDecimals(totalCu, 1)}
              <span className="ml-1 text-xs text-white/70 md:ml-2 md:text-xl">
                pts
              </span>
              {rankText ? (
                <span className={`ml-1 text-[10px] md:text-sm ${rankClass}`}>
                  {rankText}
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-[9px] tracking-tight text-white/60 md:mt-4 md:text-[16px]">
              AVG {avg} pts
            </div>
          </div>

          {/* 中央：内訳ドーナツ */}
          <div className="flex items-center justify-center md:-translate-x-0.5">
            {inView ? (
              <DonutChart
                key={`${total}-${base}-${upset}-${streak}`}
                segments={
                  segments.length > 0
                    ? segments
                    : [
                        {
                          label: "empty",
                          value: 1,
                          color: "rgba(148,163,184,0.35)",
                        },
                      ]
                }
                size={chartSize}
                thickness={chartThickness}
                ariaLabel={
                  isEn
                    ? "Total points breakdown: base, upset bonus, streak bonus"
                    : "総合得点の内訳：基本点・アップセット・連勝ボーナス"
                }
              />
            ) : (
              <div
                className="rounded-full bg-white/6"
                style={{
                  width: chartSize,
                  height: chartSize,
                }}
                aria-hidden
              />
            )}
          </div>

          {/* 右：内訳（色はドーナツと対応） */}
          <div className="min-w-0 space-y-1.5 md:space-y-3 md:-translate-x-0.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-teal-200/80 md:text-[14px]">
                {isEn ? "Base Points" : "基本点"}
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-teal-200 md:text-[22px]",
                ].join(" ")}
              >
                {formatMetricDecimals(baseCu, 1)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-orange-200/80 md:text-[14px]">
                Upset Bonus
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-orange-200 md:text-[22px]",
                ].join(" ")}
              >
                {formatMetricDecimals(upsetCu, 1)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-violet-200/80 md:text-[14px]">
                {isEn ? "Win Streak Bonus" : "連勝ボーナス"}
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-violet-200 md:text-[22px]",
                ].join(" ")}
              >
                {formatMetricDecimals(streakCu, 1)}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {tooltip && (
        <Tooltip
          anchorRect={tooltip.rect}
          message={tooltip.message}
          onClose={() => setTooltip(null)}
        />
      )}
    </>
  );
}

export default memo(TotalScoreCard);
