// app/component/profile/ui/summary/UpsetCard.tsx
"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Zap } from "lucide-react";
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
  upsetPointsSum: number;
  analyses: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  totalUpsetRank?: number | null;
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

const UPSET_TOOLTIP =
  "アップセットが起きた試合で少数派を当てたときだけ加点されます（1試合0〜10）。「発生」は自分が予想した試合のうち、実際にアップセットが起きた試合数です。";

function clampInt(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

function UpsetCard({
  upsetPointsSum,
  analyses,
  upsetChanceCount,
  upsetHitCount,
  totalUpsetRank = null,
  compact = true,
  className = "",
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

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

  const points = useMemo(
    () => Math.max(0, Number((upsetPointsSum || 0).toFixed(1))),
    [upsetPointsSum]
  );
  const analyzed = useMemo(() => clampInt(analyses || 0), [analyses]);
  const chances = useMemo(
    () => clampInt(upsetChanceCount || 0),
    [upsetChanceCount]
  );
  const hits = useMemo(() => clampInt(upsetHitCount || 0), [upsetHitCount]);

  const hitPct = useMemo(() => {
    if (chances <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((hits / chances) * 100)));
  }, [hits, chances]);

  const cuPoints = useCountUp(points, 1000, inView, 1);
  const cuAnalyzed = useCountUp(analyzed, 1000, inView);
  const cuChances = useCountUp(chances, 1000, inView);
  const cuHitPct = useCountUp(hitPct, 1000, inView);

  const tooltipMsg = isEn
    ? "You earn Upset Points only when you correctly predict an upset (0–10 points per match). “Occurred” means how many of your predicted matches actually had an upset."
    : UPSET_TOOLTIP;
  const rankText =
    totalUpsetRank != null ? ` / ${formatOrdinal(totalUpsetRank)}` : "";
  const rankClass =
    totalUpsetRank != null && totalUpsetRank <= 20
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
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-tight text-white md:mb-4 md:gap-2 md:text-[18px]">
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black md:h-8 md:w-8">
            <Zap className="h-2.5 w-2.5 text-orange-400 md:h-5 md:w-5" />
          </div>

          <span className="text-white">{isEn ? "Upset" : "アップセット"}</span>

          <button
            type="button"
            className="ml-0.5 text-[9px] text-white/60 hover:text-white/80 md:ml-1 md:text-[16px]"
            onClick={(e) => openTooltip(e, tooltipMsg)}
            aria-label={isEn ? "Upset description" : "アップセットの説明"}
          >
            ⓘ
          </button>
        </div>

        <div
          className={[
            summaryMetricNumClass,
            "mt-1 text-base tabular-nums tracking-tight text-white md:mt-4 md:text-3xl",
            "leading-none text-center",
          ].join(" ")}
        >
          {formatMetricDecimals(cuPoints, 1)}
          <span className="ml-1 text-xs text-white/70 md:ml-2 md:text-lg">
            pts
          </span>
          {rankText ? (
            <span className={`ml-1 text-[10px] md:text-sm ${rankClass}`}>
              {rankText}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 text-[9px] text-white/60 text-center leading-snug tracking-tight md:mt-4 md:text-[13px] md:leading-relaxed">
          {isEn ? `Upsets ${cuChances} / Analyses ${cuAnalyzed}` : `発生 ${cuChances} / 分析 ${cuAnalyzed}`}
          <br />
          {isEn ? `Hit Rate ${cuHitPct}%` : `的中率 ${cuHitPct}%`}
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

export default memo(UpsetCard);