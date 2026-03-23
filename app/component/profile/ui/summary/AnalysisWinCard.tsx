"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useEffect, useMemo, useRef, useState } from "react";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  totalAnalyses?: number;
  hitAnalyses?: number;
  posts?: number;
  wins?: number;
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

export default function AnalysisWinCard(props: Props) {
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

  const gaugeSize = isDesktop ? 120 : 80;
  const gaugeStroke = isDesktop ? 10 : 8;

  return (
    <div
      ref={ref}
      className="rounded-xl border border-white/10 bg-[#050814]/80 p-3 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    >

      <div className="flex items-center justify-between gap-4 md:gap-10">
        <div className="flex flex-col items-center">
          <div className="text-[10px] md:text-[16px] text-white/60">的中</div>

          <div
            className={`${alfa.className} text-xl md:text-4xl font-bold text-white`}
          >
            {cuHit}
          </div>

          <div className="my-1 md:my-2 h-px w-10 md:w-14 bg-white/20" />

          <div
            className={`${alfa.className} text-xl md:text-4xl font-bold text-white/40`}
          >
            {cuTotal}
          </div>

          <div className="text-[10px] md:text-[16px] text-white/40">確定</div>
        </div>

        <div className="relative flex items-center justify-center">
          <ArcProgress
            size={gaugeSize}
            stroke={gaugeStroke}
            value01={winRate}
            enabled={inView}
          />

          <div className="absolute flex flex-col items-center">
            <div
              className={`${alfa.className} text-lg md:text-3xl font-bold ${rateColor}`}
            >
              {cuRate}%
            </div>

            <div className="text-[10px] md:text-[14px] text-white/50">勝率</div>
          </div>
        </div>
      </div>
    </div>
  );
}