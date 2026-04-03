// app/component/profile/ui/summary/ScorePrecisionCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";

type Props = {
  scorePrecisionSum: number;
  analyses: number;
  compact?: boolean;
  className?: string;
  language?: Language;
};

const SCORE_PRECISION_TOOLTIP =
  "予想スコアと実際スコアの近さを0〜10で評価し、期間内で合計した値です。下のバーは1試合あたり平均（0〜10）を可視化しています。";

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export default function ScorePrecisionCard({
  scorePrecisionSum,
  analyses,
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
    () => Number((scorePrecisionSum || 0).toFixed(1)),
    [scorePrecisionSum]
  );

  const avg = useMemo(
    () => (analyses > 0 ? scorePrecisionSum / analyses : 0),
    [scorePrecisionSum, analyses]
  );

  const sumCu = useCountUp(sum, 1000, visible, 1);
  const avgCu = useCountUp(Number(avg.toFixed(1)), 1000, visible, 1);

  const bar01 = clamp01(avg / 10);
  const barPct = `${Math.round(bar01 * 100)}%`;

  const tooltipMsg = isEn
    ? "Evaluate how close your predicted score is to the actual score on a 0–10 scale, summed within the selected period. The bar below visualizes your per-match average (0–10)."
    : SCORE_PRECISION_TOOLTIP;

  return (
    <>
      <div
        ref={ref}
        className={[
          "rounded-lg border border-white/15 bg-[#050814]/80 md:rounded-xl md:border-white/10",
          "p-2 md:p-6",
          "shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          "flex flex-col items-center justify-start",
          "h-full",
          className,
        ].join(" ")}
      >
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
          {sumCu.toFixed(1)}
          <span className="ml-1 text-xs text-white/70 md:ml-2 md:text-lg">
            pts
          </span>
        </div>

        <div className="mt-1 w-full md:mt-4">
          <div className="flex items-center justify-between text-[9px] tracking-tight text-white/60 md:text-[16px]">
            <span>AVG</span>
            <span
              className={[summaryMetricNumClass, "tabular-nums"].join(" ")}
            >
              {avgCu.toFixed(1)}{" "}
              <span className="text-white/45">/ 10</span>
            </span>
          </div>

          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10 md:mt-3 md:h-3">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all ease-out md:h-3"
              style={{
                width: visible ? barPct : "0%",
                transitionDuration: "900ms",
              }}
            />
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