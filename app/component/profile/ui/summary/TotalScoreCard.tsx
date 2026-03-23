"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
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
  basePoints?: number;
  upsetBonusPoints?: number;
  streakBonusPoints?: number;
  periodLabel?: string;
  compact?: boolean;
  className?: string;
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
}: Props) {
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

  const total = Math.max(0, Math.round(totalPoints || 0));
  const base = Math.max(0, Math.round(basePoints || 0));
  const upset = Math.max(0, Math.round(upsetBonusPoints || 0));
  const streak = Math.max(0, Math.round(streakBonusPoints || 0));

  const totalCu = useCountUp(total, 1000, inView);
  const baseCu = useCountUp(base, 1000, inView);
  const upsetCu = useCountUp(upset, 1000, inView);
  const streakCu = useCountUp(streak, 1000, inView);

  const avg = analyses > 0 ? (totalPoints / analyses).toFixed(1) : "0";

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
          "rounded-xl border border-white/10 bg-[#050814]/80",
          "p-3 md:p-6",
          "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          "h-full",
          className,
        ].join(" ")}
      >
        <div className="mb-3 md:mb-5 flex items-center gap-2 text-xs md:text-[18px] font-semibold text-white">
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

        <div className="grid grid-cols-[1.15fr_0.85fr_1fr] items-center gap-4 md:gap-8">
          {/* 左：合計得点 */}
          <div className="min-w-0 pl-2 md:pl-4">
            <div
              className={[
                alfa.className,
                "text-2xl md:text-4xl",
                "font-bold text-white leading-none tabular-nums",
              ].join(" ")}
            >
              {totalCu}
              <span className="ml-2 text-sm md:text-xl text-white/70">pts</span>
            </div>

            <div className="mt-3 md:mt-4 text-[11px] md:text-[16px] text-white/60">
              AVG {avg} pts
            </div>
          </div>

          {/* 中央：円グラフ */}
          <div className="flex items-center justify-center">
            <div className="relative h-[110px] w-[110px] md:h-[150px] md:w-[150px]">
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
          <div className="min-w-0 space-y-2.5 md:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] md:text-[14px] text-white/55">
                基本点
              </span>
              <span className="tabular-nums text-[14px] md:text-[22px] font-bold text-white">
                {baseCu}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] md:text-[14px] text-white/55">
                Upset Bonus
              </span>
              <span className="tabular-nums text-[14px] md:text-[22px] font-bold text-orange-300">
                {upsetCu}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] md:text-[14px] text-white/55">
                連勝ボーナス
              </span>
              <span className="tabular-nums text-[14px] md:text-[22px] font-bold text-yellow-300">
                {streakCu}
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