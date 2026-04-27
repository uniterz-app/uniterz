// app/component/profile/ui/summary/ScorePrecisionCard.tsx
"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";
import { formatMetricDecimals, roundMetricDecimals } from "@/lib/format/metricDecimals";

type Props = {
  scorePrecisionSum: number;
  analyses: number;
  totalPrecisionRank?: number | null;
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

const SCORE_PRECISION_TOOLTIP =
  "予想スコアと実際スコアの近さを0〜10で評価し、期間内で合計した値です。下のバーは1試合あたり平均（0〜10）を可視化しています。";

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function ScorePrecisionCard({
  scorePrecisionSum,
  analyses,
  totalPrecisionRank = null,
  compact = true,
  className = "",
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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

  const sum = useMemo(
    () => roundMetricDecimals(scorePrecisionSum || 0, 1),
    [scorePrecisionSum]
  );

  const avg = useMemo(
    () => (analyses > 0 ? scorePrecisionSum / analyses : 0),
    [scorePrecisionSum, analyses]
  );

  const sumCu = useCountUp(sum, 1000, visible, 1);
  const avgCu = useCountUp(roundMetricDecimals(avg, 1), 1000, visible, 1);

  const bar01 = clamp01(avg / 10);

  const tooltipMsg = isEn
    ? "Evaluate how close your predicted score is to the actual score on a 0–10 scale, summed within the selected period. The bar below visualizes your per-match average (0–10)."
    : SCORE_PRECISION_TOOLTIP;
  const rankText =
    totalPrecisionRank != null ? ` / ${formatOrdinal(totalPrecisionRank)}` : "";
  const rankClass =
    totalPrecisionRank != null && totalPrecisionRank <= 20
      ? "text-yellow-300"
      : "text-white/55";

  return (
    <>
      <div
        ref={ref}
        className={[
          "relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 md:rounded-xl md:border-white/10",
          "p-2 md:p-6",
          summaryCardShadowSmClass,
          summaryCardShadowLgClass,
          "flex flex-col items-center justify-start",
          "h-full",
          className,
        ].join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.36]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1 flex w-full flex-col items-center justify-start">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-tight text-white md:mb-4 md:gap-2 md:text-[18px]">
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black md:h-8 md:w-8">
            <Gauge className="h-2.5 w-2.5 text-orange-400 md:h-5 md:w-5" />
          </div>

          <span>{isEn ? "Score Precision" : "スコア精度"}</span>

          <button
            type="button"
            className="ml-0.5 text-[9px] text-white/60 hover:text-white/80 md:ml-1 md:text-[16px]"
            onClick={(e) => openTooltip(e, tooltipMsg)}
            aria-label={isEn ? "Score Precision description" : "スコア精度の説明"}
          >
            ⓘ
          </button>
        </div>

        <div
          className={[
            summaryMetricNumClass,
            "text-base tabular-nums tracking-tight text-white md:text-3xl",
            "leading-none text-center",
          ].join(" ")}
        >
          {formatMetricDecimals(sumCu, 1)}
          <span className="ml-1 text-xs text-white/70 md:ml-2 md:text-lg">
            pts
          </span>
          {rankText ? (
            <span className={`ml-1 text-[10px] md:text-sm ${rankClass}`}>
              {rankText}
            </span>
          ) : null}
        </div>

        <div className="mt-1 w-full md:mt-4">
          <div className="flex items-center justify-between text-[9px] tracking-tight text-white/60 md:text-[16px]">
            <span>AVG</span>
            <span
              className={[summaryMetricNumClass, "tabular-nums"].join(" ")}
            >
              {formatMetricDecimals(avgCu, 1)}{" "}
              <span className="text-white/45">/ 10</span>
            </span>
          </div>

          <div className="mt-1.5 flex w-full md:mt-3">
            <ResultStatRatingBar
              ratio={bar01}
              animateMs={900}
              delayMs={visible ? 80 : 0}
              size={compact ? "sm" : "md"}
            />
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

export default memo(ScorePrecisionCard);