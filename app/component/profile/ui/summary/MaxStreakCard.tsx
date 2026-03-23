// app/component/profile/ui/summary/MaxStreakCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

type Props = {
  maxStreak: number;
  compact?: boolean;
  className?: string;
};

const MAX_STREAK_TOOLTIP =
  "全期間（All-time）の最高連勝数です。期間切替（7日/30日）とは連動しません。";

function safeInt(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function getStreakColor(v: number) {
  if (v >= 15) return "text-amber-400";
  if (v >= 12) return "text-yellow-400";
  if (v >= 7) return "text-yellow-300";
  return "text-white";
}

export default function MaxStreakCard({
  maxStreak,
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

  const base = safeInt(maxStreak);
  const cu = useCountUp(base, 1000, inView);

  const shown = useMemo(() => safeInt(cu), [cu]);
  const valueColor = getStreakColor(shown);

  return (
    <>
      <div
        ref={ref}
        className={[
          "rounded-xl border border-white/10 bg-[#050814]/80",
          "p-3 md:p-6",
          "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          "flex h-full flex-col",
          className,
        ].join(" ")}
      >
        <div className="mb-2 md:mb-4 flex items-center justify-center gap-2 text-xs md:text-[18px] font-semibold text-white">
          <div className="flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full bg-black">
            <Flame className="h-3 w-3 md:h-5 md:w-5 text-orange-400" />
          </div>

          <span>最高連勝</span>

          <button
            type="button"
            className="ml-1 text-[11px] md:text-[16px] text-white/60 hover:text-white/80"
            onClick={(e) => openTooltip(e, MAX_STREAK_TOOLTIP)}
            aria-label="最高連勝の説明"
          >
            ⓘ
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className={[
              alfa.className,
              "text-2xl md:text-3xl",
              "font-bold leading-none text-center tabular-nums",
              valueColor,
            ].join(" ")}
          >
            {cu}
          </div>

<div className="mt-3 text-[11px] md:text-[15px] text-white/60 text-center leading-snug">
  全期間での最高連勝
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