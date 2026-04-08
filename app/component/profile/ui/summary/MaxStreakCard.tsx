// app/component/profile/ui/summary/MaxStreakCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";

type Props = {
  maxStreak: number;
  compact?: boolean;
  className?: string;
  language?: Language;
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

  const base = safeInt(maxStreak);
  const cu = useCountUp(base, 1000, inView);

  const shown = useMemo(() => safeInt(cu), [cu]);
  const valueColor = getStreakColor(shown);

  const tooltipMsg = isEn
    ? "All-time maximum win streak. It is not affected by the 7d/30d period switch."
    : MAX_STREAK_TOOLTIP;
  const title = isEn ? "Max Win Streak" : "最高連勝";
  const subtitle = isEn
    ? "All-time Max Win Streak"
    : "全期間での最高連勝";

  return (
    <>
      <div
        ref={ref}
        className={[
          "relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 md:rounded-xl md:border-white/10",
          "p-2 md:p-6",
          summaryCardShadowSmClass,
          summaryCardShadowLgClass,
          "flex h-full flex-col",
          className,
        ].join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.36]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1 flex h-full flex-col">
        <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-tight text-white md:mb-4 md:gap-2 md:text-[18px]">
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black md:h-8 md:w-8">
            <Flame className="h-2.5 w-2.5 text-orange-400 md:h-5 md:w-5" />
          </div>

          <span>{title}</span>

          <button
            type="button"
            className="ml-0.5 text-[9px] text-white/60 hover:text-white/80 md:ml-1 md:text-[16px]"
            onClick={(e) => openTooltip(e, tooltipMsg)}
            aria-label={isEn ? "Max Win Streak description" : "最高連勝の説明"}
          >
            ⓘ
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className={[
              summaryMetricNumClass,
              "text-xl leading-none text-center tabular-nums tracking-tight md:text-3xl",
              valueColor,
            ].join(" ")}
          >
            {cu}
          </div>

          <div className="mt-2 text-[9px] text-white/60 text-center leading-snug tracking-tight md:mt-3 md:text-[15px]">
            {subtitle}
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