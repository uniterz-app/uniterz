"use client";

import type { Language } from "@/lib/i18n/language";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { useEffect, useId, useMemo, useState } from "react";

const SEGMENT_COUNT = 5;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function segmentFill(
  overallRatio: number,
  index: number,
  segmentCount: number
) {
  const pos = overallRatio * segmentCount;
  return clamp01(pos - index);
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

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
        shadow:
          "0 0 20px rgba(194, 65, 12, 0.75), 0 0 8px rgba(127, 29, 29, 0.35)",
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
      className={compact ? "h-[88px] w-[88px]" : "h-[132px] w-[132px]"}
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

export type WinRateOverviewDonutProps = {
  /** 0–1 */
  ratio01: number;
  /** 中央の % 表示用（整数想定、プロフィールはカウントアップ値でも可） */
  percentDisplay: number;
  language?: Language;
  compact?: boolean;
  animationEnabled?: boolean;
  className?: string;
  percentTextClassName?: string;
  labelTextClassName?: string;
};

/**
 * Pro overview（AnalysisWinCard）と同系のブロック型ドーナツ＋中央 % / 勝率ラベル。
 */
export default function WinRateOverviewDonut({
  ratio01,
  percentDisplay,
  language = "ja",
  compact = true,
  animationEnabled = true,
  className = "",
  percentTextClassName = "",
  labelTextClassName = "",
}: WinRateOverviewDonutProps) {
  const gradientIdPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "_");
  const isEn = language === "en";
  const winRateLabel = isEn ? "Win Rate" : "勝率";
  const winRate = clamp01(ratio01);

  const rateColor =
    winRate >= 0.8
      ? "text-orange-200"
      : winRate >= 0.6
        ? "text-orange-300/95"
        : "text-orange-50/90";

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <WinRateBlockRing
        ratio01={ratio01}
        enabled={animationEnabled}
        compact={compact}
        gradientIdPrefix={gradientIdPrefix}
      />

      <div className="pointer-events-none absolute flex flex-col items-center">
        <div
          className={[
            resultStatsMetricNumClass,
            "text-lg tabular-nums tracking-tight sm:text-xl md:text-3xl",
            rateColor,
            percentTextClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {percentDisplay}%
        </div>

        <div
          className={[
            "text-[9px] tracking-tight text-white/50 sm:text-[10px] md:text-[14px]",
            labelTextClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {winRateLabel}
        </div>
      </div>
    </div>
  );
}
