// app/component/profile/ui/summary/ScorePrecisionCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

type Props = {
  scorePrecisionSum: number;
  analyses: number;
  compact?: boolean;
  className?: string;
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
}: Props) {
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

  const sumCu = useCountUp(sum, 1000, visible);
  const avgCu = useCountUp(Number(avg.toFixed(1)), 1000, visible);

  const bar01 = clamp01(avg / 10);
  const barPct = `${Math.round(bar01 * 100)}%`;

  return (
    <>
      <div
        ref={ref}
        className={[
          "rounded-xl border border-white/10 bg-[#050814]/80",
          "p-3 md:p-6",
          "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          "flex flex-col items-center justify-start",
          "h-full",
          className,
        ].join(" ")}
      >
        <div className="mb-2 md:mb-4 flex items-center gap-2 text-xs md:text-[18px] font-semibold text-white">
          <div className="flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full bg-black">
            <Gauge className="h-3 w-3 md:h-5 md:w-5 text-orange-400" />
          </div>

          <span>スコア精度</span>

          <button
            type="button"
            className="ml-1 text-[11px] md:text-[16px] text-white/60 hover:text-white/80"
            onClick={(e) => openTooltip(e, SCORE_PRECISION_TOOLTIP)}
            aria-label="スコア精度の説明"
          >
            ⓘ
          </button>
        </div>

        <div
          className={[
            alfa.className,
            "text-lg md:text-3xl",
            "font-bold text-white leading-none text-center tabular-nums",
          ].join(" ")}
        >
          {sumCu.toFixed(1)}
          <span className="ml-2 text-sm md:text-lg text-white/70">pts</span>
        </div>

        <div className="mt-1 md:mt-4 w-full">
          <div className="flex items-center justify-between text-[11px] md:text-[16px] text-white/60">
            <span>AVG</span>
            <span className="tabular-nums">
              {avgCu.toFixed(1)} <span className="text-white/45">/ 10</span>
            </span>
          </div>

          <div className="mt-2 md:mt-3 h-2 md:h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-2 md:h-3 rounded-full bg-blue-500 transition-all ease-out"
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