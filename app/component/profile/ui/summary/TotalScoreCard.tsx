// app/component/profile/ui/summary/TotalScoreCard.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Crown } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  totalPoints: number;
  analyses: number;
  periodLabel?: string;
  compact?: boolean;
  className?: string;
};

const TOTAL_SCORE_TOOLTIP =
  "勝者的中・点差/合計点の近さ・（条件付き）アップセット要素まで含めて評価する包括スコア（1試合 0〜10）。スコア精度＋アップセット得点の単純合算ではない。";

export default function TotalScoreCard({
  totalPoints,
  analyses,
  periodLabel,
  compact = true,
  className = "",
}: Props) {
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

  const p = Math.max(0, Math.round(totalPoints || 0));
  const cu = useCountUp(p, 1000, inView);

  const avg = analyses > 0 ? (totalPoints / analyses).toFixed(1) : "0";

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
            <Crown className="h-3 w-3 md:h-5 md:w-5 text-orange-400" />
          </div>

          <span>総合得点</span>

          <button
            type="button"
            className="ml-1 text-[11px] md:text-[16px] text-white/60 hover:text-white/80"
            onClick={(e) => openTooltip(e, TOTAL_SCORE_TOOLTIP)}
            aria-label="総合得点の説明"
          >
            ⓘ
          </button>
        </div>

        {/* 総合得点 */}
        <div
          className={[
            alfa.className,
            "mt-4 md:mt-6",
            "text-2xl md:text-3xl",
            "font-bold text-white leading-none text-center tabular-nums",
          ].join(" ")}
        >
          {cu}
          <span className="ml-2 text-sm md:text-lg text-white/70">pts</span>
        </div>

        {/* AVG */}
        <div className="mt-3 md:mt-4 text-[11px] md:text-[16px] text-white/60">
          AVG {avg} pts
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