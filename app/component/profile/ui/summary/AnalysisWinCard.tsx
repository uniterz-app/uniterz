"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { metricValueMinWidthCh } from "@/lib/format/metricDecimals";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";
import WinRateOverviewDonut from "@/app/component/profile/ui/summary/WinRateOverviewDonut";

type Props = {
  totalAnalyses?: number;
  hitAnalyses?: number;
  posts?: number;
  wins?: number;
  language?: Language;
};

function AnalysisWinCard({ language = "ja", ...props }: Props) {
  const m = t(language);

  const hitLabel = m.profile.correctPicks;
  const totalLabel = m.profile.totalPicks;

  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

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
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const total = useMemo(() => {
    const v = props.posts ?? props.totalAnalyses ?? 0;
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  }, [props.posts, props.totalAnalyses]);

  const hit = useMemo(() => {
    const v = props.wins ?? props.hitAnalyses ?? 0;
    return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  }, [props.wins, props.hitAnalyses]);

  const winRate = total > 0 ? hit / total : 0;

  const cuHit = useCountUp(hit, 1000, inView, 0, "zero");
  const cuTotal = useCountUp(total, 1000, inView, 0, "zero");
  const cuRate = useCountUp(Math.round(winRate * 100), 1000, inView, 0, "zero");

  return (
    <div
      ref={ref}
      className={[
        "relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 p-2",
        summaryCardShadowSmClass,
        "md:rounded-xl md:border-white/10 md:p-5",
        summaryCardShadowLgClass,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1 flex items-center justify-center gap-5 pl-1 md:gap-10 md:pl-2">
        <div className="flex min-w-0 flex-col items-center md:translate-x-1.5">
          <div className="text-[9px] tracking-tight text-white/60 md:text-[16px]">
            {hitLabel}
          </div>

          <div
            className={`${resultStatsMetricNumClass} text-base tracking-tight text-white md:text-4xl`}
          >
            <span
              className="inline-block text-right tabular-nums"
              style={{ minWidth: metricValueMinWidthCh(hit, 0) }}
            >
              {cuHit}
            </span>
          </div>

          <div className="my-0.5 h-px w-8 bg-white/20 md:my-2 md:w-14" />

          <div
            className={`${resultStatsMetricNumClass} text-base tracking-tight text-white/40 md:text-4xl`}
          >
            <span
              className="inline-block text-right tabular-nums"
              style={{ minWidth: metricValueMinWidthCh(total, 0) }}
            >
              {cuTotal}
            </span>
          </div>

          <div className="text-[9px] tracking-tight text-white/40 md:text-[16px]">
            {totalLabel}
          </div>
        </div>

        <WinRateOverviewDonut
          ratio01={winRate}
          percentDisplay={cuRate}
          language={language}
          compact={!isDesktop}
          animationEnabled={inView}
          className="md:-translate-x-1"
        />
      </div>
    </div>
  );
}

export default memo(AnalysisWinCard);
