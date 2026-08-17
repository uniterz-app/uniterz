"use client";

import React, { useId } from "react";
import { RANK_GAP_CYBER } from "@/lib/rankings/rankGapDonut";

export type RankGapCyberDonutSegment = {
  value: number;
  color: string;
  glow: string;
};

type Props = {
  segments: RankGapCyberDonutSegment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
  ariaLabel?: string;
  drawDelayMs?: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

const SEGMENT_DRAW_TRANSITION =
  "stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)";

/** Gap 専用 — 多色ネオンドーナツ（控えめなセグメントグロー） */
export default function RankGapCyberDonut({
  segments,
  size = 172,
  thickness = 38,
  center,
  ariaLabel = "points breakdown donut",
  drawDelayMs = 100,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const radius = size / 2;
  const R = radius - thickness / 2;
  const innerR = radius - thickness;

  const segmentsKey = React.useMemo(
    () => segments.map((s) => `${s.value}-${s.color}`).join("|"),
    [segments]
  );

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setMounted(true);
      return;
    }

    setMounted(false);
    const ms = 10 + Math.max(0, drawDelayMs);
    const t = window.setTimeout(() => {
      if (!cancelled) setMounted(true);
    }, ms);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [drawDelayMs, segmentsKey]);

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const a = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number
  ) => {
    const s = polarToCartesian(cx, cy, r, end);
    const e = polarToCartesian(cx, cy, r, start);
    const largeArcFlag = end - start <= 180 ? "0" : "1";
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${e.x} ${e.y}`;
  };

  const FULL_RING_THRESHOLD_DEG = 359.5;
  const circ = 2 * Math.PI * R;

  const GLOW_PAD = 10;
  const svgSize = size + GLOW_PAD * 2;
  const cx = svgSize / 2;

  let acc = 0;
  const arcs = segments.flatMap((seg, i) => {
    const ratio = clamp01(seg.value);
    const deg = ratio * 360;
    const start = acc;
    const end = acc + deg;
    acc = end;
    if (ratio <= 0) return [];

    const gradId = `rg-gap-${uid}-${i}`;
    const strokeStyle: React.CSSProperties = {
      strokeDasharray: mounted ? `${ratio * circ} ${circ}` : `0 ${circ}`,
      transition: SEGMENT_DRAW_TRANSITION,
      filter: `drop-shadow(0 0 3px ${seg.glow})`,
    };

    if (deg >= FULL_RING_THRESHOLD_DEG) {
      return [
        <circle
          key={i}
          cx={cx}
          cy={cx}
          r={R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={strokeStyle}
        />,
      ];
    }

    return [
      <path
        key={i}
        d={describeArc(cx, cx, R, start, end)}
        stroke={`url(#${gradId})`}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="butt"
        style={strokeStyle}
      />,
    ];
  });

  return (
    <div
      className="relative grid place-items-center overflow-visible"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="overflow-visible"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <defs>
          {segments.map((seg, i) => {
            const gradId = `rg-gap-${uid}-${i}`;
            return (
              <linearGradient
                key={gradId}
                id={gradId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                <stop offset="100%" stopColor={seg.color} stopOpacity="0.82" />
              </linearGradient>
            );
          })}
        </defs>

        <circle
          cx={cx}
          cy={cx}
          r={R}
          stroke={RANK_GAP_CYBER.trackRing}
          strokeWidth={thickness}
          fill="none"
        />

        {arcs}
      </svg>

      <div
        className="pointer-events-none absolute z-[1] rounded-full"
        style={{
          width: innerR * 2,
          height: innerR * 2,
          backgroundColor: RANK_GAP_CYBER.cardBg,
        }}
      />

      {center ? (
        <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center">
          {center}
        </div>
      ) : null}
    </div>
  );
}
