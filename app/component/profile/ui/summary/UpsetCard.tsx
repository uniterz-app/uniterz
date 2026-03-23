// app/component/profile/ui/summary/UpsetCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

type Props = {
  upsetPointsSum: number;
  analyses: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  compact?: boolean;
  className?: string;
};

const UPSET_TOOLTIP =
  "アップセットが起きた試合で少数派を当てたときだけ加点されます（1試合0〜10）。「発生」は自分が予想した試合のうち、実際にアップセットが起きた試合数です。";

function clampInt(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

export default function UpsetCard({
  upsetPointsSum,
  analyses,
  upsetChanceCount,
  upsetHitCount,
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

  const points = useMemo(() => clampInt(upsetPointsSum || 0), [upsetPointsSum]);
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

  const cuPoints = useCountUp(points, 1000, inView);
  const cuAnalyzed = useCountUp(analyzed, 1000, inView);
  const cuChances = useCountUp(chances, 1000, inView);
  const cuHitPct = useCountUp(hitPct, 1000, inView);

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
        <div className="mb-1 md:mb-4 flex items-center gap-2 text-xs md:text-[18px] font-semibold text-white">
          <div className="flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full bg-black">
            <Zap className="h-3 w-3 md:h-5 md:w-5 text-orange-400" />
          </div>

          <span className="text-white">アップセット</span>

          <button
            type="button"
            className="ml-1 text-[11px] md:text-[16px] text-white/60 hover:text-white/80"
            onClick={(e) => openTooltip(e, UPSET_TOOLTIP)}
            aria-label="アップセットの説明"
          >
            ⓘ
          </button>
        </div>

        <div
          className={[
            alfa.className,
            "mt-1 md:mt-4",
            "text-lg md:text-3xl",
            "font-bold text-white leading-none text-center tabular-nums",
          ].join(" ")}
        >
          {cuPoints}
          <span className="ml-2 text-sm md:text-lg text-white/70">pts</span>
        </div>

        <div className="mt-2 md:mt-4 text-[11px] md:text-[13px] text-white/60 text-center leading-snug md:leading-relaxed">
          発生 {cuChances} / 分析 {cuAnalyzed}
          <br />
          的中率 {cuHitPct}%
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