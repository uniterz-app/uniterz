"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  totalAnalyses?: number;
  hitAnalyses?: number;
  posts?: number;
  wins?: number;
  language?: Language;
};

const SEGMENT_COUNT = 5;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** ResultStatRatingBar と同様：各ブロックが担当する比率のうち埋まる割合 */
function segmentFill(overallRatio: number, index: number, segmentCount: number) {
  const pos = overallRatio * segmentCount;
  return clamp01(pos - index);
}

/**
 * 上（12時）= 0°、時計回りに角度が増える（画面座標・y 下向き）。
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** 勝率ブロック 0→4：オレンジ基調で段々濃く（高%ほど強い） */
function tierPalette(tierIndex: number): {
  fill: string;
  stroke: string;
  shadow: string;
} {
  switch (Math.max(0, Math.min(4, tierIndex))) {
    case 0:
      return {
        fill: "rgba(254, 215, 170, 0.55)",
        stroke: "rgba(251, 146, 60, 0.45)",
        shadow: "0 0 6px rgba(251, 146, 60, 0.25)",
      };
    case 1:
      return {
        fill: "rgba(253, 186, 116, 0.82)",
        stroke: "rgba(249, 115, 22, 0.75)",
        shadow: "0 0 10px rgba(249, 115, 22, 0.4)",
      };
    case 2:
      return {
        fill: "rgba(251, 146, 60, 0.92)",
        stroke: "rgba(234, 88, 12, 0.9)",
        shadow: "0 0 14px rgba(249, 115, 22, 0.55)",
      };
    case 3:
      return {
        fill: "rgba(234, 88, 12, 0.95)",
        stroke: "rgba(194, 65, 12, 0.98)",
        shadow: "0 0 16px rgba(234, 88, 12, 0.6)",
      };
    default:
      return {
        fill: "rgba(154, 52, 18, 0.98)",
        stroke: "rgba(67, 20, 7, 1)",
        shadow: "0 0 20px rgba(194, 65, 12, 0.75), 0 0 8px rgba(127, 29, 29, 0.35)",
      };
  }
}

function describeAnnularSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  sweepDeg: number
) {
  if (sweepDeg <= 0.05) return "";
  const endDeg = startDeg + sweepDeg;
  const largeArc = sweepDeg > 180 ? 1 : 0;
  const pOs = polarToCartesian(cx, cy, rOuter, startDeg);
  const pOe = polarToCartesian(cx, cy, rOuter, endDeg);
  const pIe = polarToCartesian(cx, cy, rInner, endDeg);
  const pIs = polarToCartesian(cx, cy, rInner, startDeg);
  return [
    `M ${pOs.x} ${pOs.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${pOe.x} ${pOe.y}`,
    `L ${pIe.x} ${pIe.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${pIs.x} ${pIs.y}`,
    "Z",
  ].join(" ");
}

function WinRateBlockRing({
  ratio01,
  enabled,
  compact,
  gradientIdPrefix,
}: {
  ratio01: number;
  enabled: boolean;
  compact: boolean;
  gradientIdPrefix: string;
}) {
  const cx = 50;
  const cy = 50;
  /** 細めのリング・中央を広く（viewBox 100 基準） */
  const rOuter = compact ? 47 : 48;
  const rInner = compact ? 41 : 41.5;
  const gapDeg = 2.4;
  const blockSweep = (360 - SEGMENT_COUNT * gapDeg) / SEGMENT_COUNT;

  const [animRatio, setAnimRatio] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setAnimRatio(0);
      return;
    }
    let cancelled = false;
    let raf = 0;
    let start: number | null = null;
    const duration = 1100;
    const target = clamp01(ratio01);

    const tick = (t: number) => {
      if (cancelled) return;
      if (start === null) start = t;
      const u = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - u, 3);
      setAnimRatio(target * eased);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [enabled, ratio01]);

  const segments = useMemo(() => {
    const out: {
      key: string;
      track: string;
      fill: string | null;
      pal: ReturnType<typeof tierPalette>;
    }[] = [];

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      // 上（0°）から時計回り：ブロック0 = 勝率 0–20%、1 = 20–40% …
      const startDeg = i * (blockSweep + gapDeg);
      const track = describeAnnularSector(
        cx,
        cy,
        rInner,
        rOuter,
        startDeg,
        blockSweep
      );
      const f = segmentFill(animRatio, i, SEGMENT_COUNT);
      const fillSweep = blockSweep * f;
      const fill =
        fillSweep > 0.02
          ? describeAnnularSector(cx, cy, rInner, rOuter, startDeg, fillSweep)
          : null;
      out.push({
        key: `seg-${i}`,
        track,
        fill,
        pal: tierPalette(i),
      });
    }
    return out;
  }, [animRatio, blockSweep, gapDeg, rInner, rOuter, cx, cy]);

  const dimTrack = "rgba(255,255,255,0.07)";

  return (
    <svg
      viewBox="0 0 100 100"
      className={compact ? "h-[72px] w-[72px]" : "h-[124px] w-[124px]"}
      aria-hidden
    >
      <defs>
        {segments.map((s, i) => (
          <linearGradient
            key={`g-${s.key}`}
            id={`${gradientIdPrefix}-tier-${i}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={s.pal.stroke} stopOpacity={0.95} />
            <stop offset="48%" stopColor={s.pal.fill} stopOpacity={1} />
            <stop offset="100%" stopColor={s.pal.stroke} stopOpacity={0.9} />
          </linearGradient>
        ))}
      </defs>

      {segments.map((s, i) => (
        <g key={s.key}>
          <path d={s.track} fill={dimTrack} />
          {s.fill ? (
            <path
              d={s.fill}
              fill={`url(#${gradientIdPrefix}-tier-${i})`}
              style={{ filter: `drop-shadow(${s.pal.shadow})` }}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export default function AnalysisWinCard({ language = "ja", ...props }: Props) {
  const ringGradientPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "_");
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

  const rateColor =
    winRate >= 0.8
      ? "text-orange-200"
      : winRate >= 0.6
        ? "text-orange-300/95"
        : "text-orange-50/90";

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 p-2 shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:rounded-xl md:border-white/10 md:p-5 md:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
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

          <div className="text-[9px] tracking-tight text-white/40 md:text-[16px]">
            {totalLabel}
          </div>
        </div>

        <div className="relative flex shrink-0 items-center justify-center md:-translate-x-1">
          <WinRateBlockRing
            ratio01={winRate}
            enabled={inView}
            compact={!isDesktop}
            gradientIdPrefix={ringGradientPrefix}
          />

          <div className="pointer-events-none absolute flex flex-col items-center">
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
