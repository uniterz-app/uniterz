// app/component/profile/ui/summary/ProbAccuracyCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Target } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

type Props = {
  avgBrier: number;
  analyses: number;
  compact?: boolean;
  className?: string;
  delayMs?: number;
};

const PROB_ACCURACY_TOOLTIP =
  "自信度（確率）と結果の整合性を評価します。表示は高いほど良い（Brierを反転して%化）です。下のバーは確率精度（0〜100%）を可視化しています。";

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export default function ProbAccuracyCard({
  avgBrier,
  analyses,
  compact = true,
  className = "",
  delayMs = 180,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [start, setStart] = useState(false);

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

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setStart(true), delayMs);
    return () => window.clearTimeout(t);
  }, [inView, delayMs]);

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const probAccuracy = useMemo(() => {
    if (!analyses) return 0;
    const v = (1 - (avgBrier ?? 0)) * 100;
    return Math.max(0, Math.min(100, Math.round(v)));
  }, [avgBrier, analyses]);

  const brierText = useMemo(() => {
    const v = Number.isFinite(avgBrier) ? avgBrier : 0;
    return v.toFixed(2);
  }, [avgBrier]);

  const pctCu = useCountUp(probAccuracy, 1000, inView);

  const bar01 = clamp01(probAccuracy / 100);
  const barPct = `${Math.round(bar01 * 100)}%`;

  const pctColor = probAccuracy >= 80 ? "text-yellow-300" : "text-white";

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
        {/* タイトル */}
        <div className="mb-2 md:mb-4 flex items-center gap-2 text-xs md:text-[18px] font-semibold text-white">
          <div className="flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full bg-black">
            <Target className="h-3 w-3 md:h-5 md:w-5 text-orange-400" />
          </div>

          <span>確率精度</span>

          <button
            type="button"
            className="ml-1 text-[11px] md:text-[16px] text-white/60 hover:text-white/80"
            onClick={(e) => openTooltip(e, PROB_ACCURACY_TOOLTIP)}
            aria-label="確率精度の説明"
          >
            ⓘ
          </button>
        </div>

        {/* % */}
        <div
          className={[
            alfa.className,
            "text-xl md:text-3xl",
            "font-bold leading-none text-center tabular-nums",
            pctColor,
          ].join(" ")}
        >
          {pctCu}%
        </div>

        {/* Brier */}
        <div className="mt-2 md:mt-3 text-[11px] md:text-[16px] text-white/60 tabular-nums">
          Brier {brierText}
        </div>

        {/* バー */}
        <div className="mt-3 w-full">
          <div className="h-2 md:h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-2 md:h-3 rounded-full bg-blue-500 transition-all ease-out"
              style={{
                width: start ? barPct : "0%",
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