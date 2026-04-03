"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { Crown } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";
import Tooltip from "@/app/component/common/Tooltip";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";

type Props = {
  totalPoints: number;
  analyses: number;
  basePoints?: number;
  upsetBonusPoints?: number;
  streakBonusPoints?: number;
  periodLabel?: string;
  compact?: boolean;
  className?: string;
  language?: Language;
};

const TOTAL_SCORE_TOOLTIP =
  "勝者的中・点差/合計点の近さで決まる基本点に、アップセットボーナスと連勝ボーナスを加えた包括スコア。";

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${end.x} ${end.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`,
    "Z",
  ].join(" ");
}

function describeRevealSector(
  cx: number,
  cy: number,
  r: number,
  progress: number
) {
  const clamped = Math.max(0, Math.min(1, progress));
  const endAngle = clamped * 360;

  if (clamped <= 0) return "";
  if (clamped >= 0.999999) {
    return `M ${cx} ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }

  return describeSlice(cx, cy, r, 0, endAngle);
}

export default function TotalScoreCard({
  totalPoints,
  analyses,
  basePoints = 0,
  upsetBonusPoints = 0,
  streakBonusPoints = 0,
  periodLabel,
  compact = true,
  className = "",
  language = "ja",
}: Props) {
  const isEn = language === "en";
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [pieProgress, setPieProgress] = useState(0);
  const maskId = useId();

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

    let rafId = 0;
    let startTime: number | null = null;
    const duration = 1100;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - t, 3);
      setPieProgress(eased);

      if (t < 1) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, [inView]);

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const total = Math.max(0, totalPoints ?? 0);
  const base = Math.max(0, basePoints ?? 0);
  const upset = Math.max(0, upsetBonusPoints ?? 0);
  const streak = Math.max(0, streakBonusPoints ?? 0);

  const totalCu = useCountUp(total, 1000, inView, 1);
  const baseCu = useCountUp(base, 1000, inView, 1);
  const upsetCu = useCountUp(upset, 1000, inView, 1);
  const streakCu = useCountUp(streak, 1000, inView, 1);

  const avg = analyses > 0 ? (totalPoints / analyses).toFixed(1) : "0";

  const tooltipMsg = isEn
    ? "Total Points within the selected period of pointsV3: winner accuracy, closeness of point difference/total, plus (conditional) upset bonus."
    : TOTAL_SCORE_TOOLTIP;

  const slices = useMemo(() => {
    const sum = Math.max(total, 1);

    const items = [
      { key: "base", value: Math.min(base, sum), color: "#f8fafc" },
      { key: "upset", value: Math.min(upset, sum), color: "#fb923c" },
      { key: "streak", value: Math.min(streak, sum), color: "#fde047" },
    ];

    let currentAngle = 0;

    return items.map((item) => {
      const sweep = (item.value / sum) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle;

      return {
        ...item,
        path:
          item.value > 0
            ? describeSlice(50, 50, 36, startAngle, endAngle)
            : null,
      };
    });
  }, [total, base, upset, streak]);

  const revealPath = useMemo(() => {
    return describeRevealSector(50, 50, 36, pieProgress);
  }, [pieProgress]);

  return (
    <>
      <div
        ref={ref}
        className={[
          "rounded-lg border border-white/15 bg-[#050814]/80 md:rounded-xl md:border-white/10",
          "p-2 md:p-6",
          "shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          "h-full",
          className,
        ].join(" ")}
      >
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-tight text-white md:mb-5 md:gap-2 md:text-[18px]">
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black md:h-8 md:w-8">
            <Crown className="h-2.5 w-2.5 text-orange-400 md:h-5 md:w-5" />
          </div>

          <span>{isEn ? "Total Points" : "総合得点"}</span>

          <button
            type="button"
            className="ml-0.5 text-[9px] text-white/60 hover:text-white/80 md:ml-1 md:text-[16px]"
            onClick={(e) => openTooltip(e, tooltipMsg)}
            aria-label={isEn ? "Total Points description" : "総合得点の説明"}
          >
            ⓘ
          </button>
        </div>

        <div className="grid grid-cols-[1.15fr_0.85fr_1fr] items-center gap-2 md:gap-8">
          {/* 左：合計得点 */}
          <div className="min-w-0 pl-1 md:pl-4">
            <div
              className={[
                summaryMetricNumClass,
                "text-xl tabular-nums tracking-tight text-white md:text-4xl",
                "leading-none",
              ].join(" ")}
            >
              {totalCu.toFixed(1)}
              <span className="ml-1 text-xs text-white/70 md:ml-2 md:text-xl">
                pts
              </span>
            </div>

            <div className="mt-2 text-[9px] tracking-tight text-white/60 md:mt-4 md:text-[16px]">
              AVG {avg} pts
            </div>
          </div>

          {/* 中央：円グラフ */}
          <div className="flex items-center justify-center">
            <div className="relative h-[88px] w-[88px] md:h-[150px] md:w-[150px]">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <mask id={maskId}>
                    <rect x="0" y="0" width="100" height="100" fill="black" />
                    {revealPath ? <path d={revealPath} fill="white" /> : null}
                  </mask>
                </defs>

                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="rgba(255,255,255,0.08)"
                />

                <g
                  mask={`url(#${maskId})`}
                  style={{
                    opacity: inView ? 1 : 0,
                    transition: "opacity 180ms linear",
                  }}
                >
                  {slices.map(
                    (item) =>
                      item.path && (
                        <path
                          key={item.key}
                          d={item.path}
                          fill={item.color}
                        />
                      )
                  )}
                </g>
              </svg>
            </div>
          </div>

          {/* 右：内訳 */}
          <div className="min-w-0 space-y-1.5 md:space-y-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-white/55 md:text-[14px]">
                {isEn ? "Base Points" : "基本点"}
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-white md:text-[22px]",
                ].join(" ")}
              >
                {baseCu.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-white/55 md:text-[14px]">
                Upset Bonus
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-orange-300 md:text-[22px]",
                ].join(" ")}
              >
                {upsetCu.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] tracking-tight text-white/55 md:text-[14px]">
                {isEn ? "Win Streak Bonus" : "連勝ボーナス"}
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "tabular-nums text-xs tracking-tight text-yellow-300 md:text-[22px]",
                ].join(" ")}
              >
                {streakCu.toFixed(1)}
              </span>
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