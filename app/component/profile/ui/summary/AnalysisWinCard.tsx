"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";

type Props = {
  totalAnalyses?: number;
  hitAnalyses?: number;
  posts?: number;
  wins?: number;
  language?: Language;
};

function ArcProgress({
  size = 80,
  stroke = 8,
  value01,
  enabled,
}: {
  size?: number;
  stroke?: number;
  value01: number;
  enabled: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value01));

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
        fill="none"
      />

      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#f97316"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={enabled ? { strokeDashoffset: c * (1 - v) } : {}}
        transition={{ duration: 1.1, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function AnalysisWinCard({ language = "ja", ...props }: Props) {
  const isEn = language === "en";

  const hitLabel = isEn ? "Correct Picks" : "的中";
  const totalLabel = isEn ? "Total Picks" : "確定";
  const winRateLabel = isEn ? "Win Rate" : "勝率";

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

  const cuHit = useCountUp(hit, 1000, inView);
  const cuTotal = useCountUp(total, 1000, inView);
  const cuRate = useCountUp(Math.round(winRate * 100), 1000, inView);

  const rateColor = winRate >= 0.75 ? "text-yellow-300" : "text-white";

  const gaugeSize = isDesktop ? 120 : 64;
  const gaugeStroke = isDesktop ? 10 : 6;

  return (
    <div
      ref={ref}
      className="rounded-lg border border-white/15 bg-[#050814]/80 p-2 shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:rounded-xl md:border-white/10 md:p-5 md:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >

      <div className="flex items-center justify-between gap-2 md:gap-10">
        <div className="flex flex-col items-center">
          <div className="text-[9px] tracking-tight md:text-[16px] text-white/60">
            {hitLabel}
          </div>

          <div
            className={`${summaryMetricNumClass} text-base tabular-nums tracking-tight text-white md:text-4xl`}
          >
            {cuHit}
          </div>

          <div className="my-0.5 h-px w-8 bg-white/20 md:my-2 md:w-14" />

          <div
            className={`${summaryMetricNumClass} text-base tabular-nums tracking-tight text-white/40 md:text-4xl`}
          >
            {cuTotal}
          </div>

          <div className="text-[9px] tracking-tight md:text-[16px] text-white/40">
            {totalLabel}
          </div>
        </div>

        <div className="relative flex shrink-0 items-center justify-center">
          <ArcProgress
            size={gaugeSize}
            stroke={gaugeStroke}
            value01={winRate}
            enabled={inView}
          />

          <div className="absolute flex flex-col items-center">
            <div
              className={`${summaryMetricNumClass} text-sm tabular-nums tracking-tight md:text-3xl ${rateColor}`}
            >
              {cuRate}%
            </div>

            <div className="text-[8px] tracking-tight text-white/50 md:text-[14px]">
              {winRateLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}