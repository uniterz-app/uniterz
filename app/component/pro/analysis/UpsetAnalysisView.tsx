"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useEffect, useRef, useState } from "react";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  month: string;
  nba: {
    totalGames: number;
    upsetGames: number;
  };
  user: {
    analyzedGames: number;
    upsetGames: number;
    upsetHitRate: number;
    shareOfAllUpsets: number;
  };
};

/* =========================
 * SVG 円弧
 * ========================= */
function ArcProgress({
  size = 144,
  stroke = 10,
  value01,
  color = "#f43f5e",
  enabled,
}: {
  size?: number;
  stroke?: number;
  value01: number;
  color?: string;
  enabled: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value01));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={enabled ? { strokeDashoffset: c * (1 - v) } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* =========================
 * Bar（上から順に描画）
 * ========================= */
function StatBar({
  label,
  value,
  percent01,
  barClass,
  enabled,
  index,
}: {
  label: string;
  value: string | number;
  percent01: number;
  barClass: string;
  enabled: boolean;
  index: number;
}) {
  const p = Math.max(0, Math.min(1, percent01));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={enabled ? { width: `${p * 100}%` } : {}}
          transition={{
            duration: 1.8,
            ease: "easeOut",
            delay: enabled ? index * 0.26 : 0,
          }}
        />
      </div>
    </div>
  );
}

export default function UpsetAnalysisView({ month, nba, user }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const upsetRate = nba.totalGames > 0 ? nba.upsetGames / nba.totalGames : 0;

  /* count up（遅め） */
  const COUNT_DURATION = 1400;

  const cuUpsetGames = useCountUp(nba.upsetGames, COUNT_DURATION, isInView);
  const cuTotalGames = useCountUp(nba.totalGames, COUNT_DURATION, isInView);
  const cuUpsetPct = useCountUp(
    Math.round(upsetRate * 100),
    COUNT_DURATION,
    isInView
  );
  const cuUserAnalyzed = useCountUp(
    user.analyzedGames,
    COUNT_DURATION,
    isInView
  );
  const cuUserUpset = useCountUp(user.upsetGames, COUNT_DURATION, isInView);
  const cuUserHitPct = useCountUp(
    Math.round(user.upsetHitRate * 100),
    COUNT_DURATION,
    isInView
  );
  const cuSharePct = useCountUp(
    Math.round(user.shareOfAllUpsets * 100),
    COUNT_DURATION,
    isInView
  );

  return (
    <div ref={ref} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upset サマリー（カード表示アニメーションなし） */}
        <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
              <AlertTriangle className="h-3 w-3 text-orange-400" />
            </div>
            <span>Upset サマリー</span>
          </div>

          <div className="flex items-center justify-between gap-8">
            <div className="flex flex-col items-center">
              <div className="mb-1 text-xs text-white/60">
                アップセット試合数
              </div>
              <div
                className={`${alfa.className} text-xl sm:text-4xl lg:text-5xl font-bold text-rose-400 leading-none`}
              >
                {cuUpsetGames}
              </div>
              <div className="my-2 h-px w-12 bg-white/20" />
              <div
                className={`${alfa.className} text-xl sm:text-4xl lg:text-5xl font-bold text-white/50 leading-none`}
              >
                {cuTotalGames}
              </div>
              <div className="mt-1 text-xs text-white/40">NBA総試合数</div>
            </div>

            <div className="relative flex h-28 w-28 items-center justify-center scale-[0.78] sm:h-36 sm:w-36 sm:scale-100">
              <ArcProgress value01={upsetRate} enabled={isInView} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`${alfa.className} text-xl sm:text-2xl md:text-3xl font-bold text-white`}
                >
                  {cuUpsetPct}%
                </div>
                <div className="text-[10px] text-white/50 sm:text-xs">
                  Upset率
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-[11px] text-white/60 sm:text-sm">
            {month} は{" "}
            <span className="font-semibold text-white">
              {upsetRate > 0 ? Math.round(1 / upsetRate) : "-"}
            </span>
            試合に1回 アップセットが発生
          </div>
        </div>

        {/* あなたの Upset 関与（影 + スタイル統一） */}
        <div className="space-y-4 rounded-2xl border border-white/15 bg-[#050814]/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
          <div className="text-sm font-semibold text-white">
            あなたの Upset 関与
          </div>

          <StatBar
            index={0}
            label="分析"
            value={cuUserAnalyzed}
            percent01={nba.totalGames > 0 ? user.analyzedGames / nba.totalGames : 0}
            barClass="bg-white"
            enabled={isInView}
          />

          <StatBar
            index={1}
            label="Upset"
            value={cuUserUpset}
            percent01={
              user.analyzedGames > 0 ? user.upsetGames / user.analyzedGames : 0
            }
            barClass="bg-rose-400"
            enabled={isInView}
          />

          <StatBar
            index={2}
            label="Hit%"
            value={`${cuUserHitPct}%`}
            percent01={user.upsetHitRate}
            barClass="bg-purple-400"
            enabled={isInView}
          />

          <div className="space-y-0.5 pt-1 text-left text-[11px] text-white/50">
            <div>全Upset試合の {cuSharePct}% に参加</div>
            <div>
              分析した {cuUserAnalyzed} 試合中 {cuUserUpset} 試合で Upset
              発生（的中率 {cuUserHitPct}%）
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
