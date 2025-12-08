"use client";

import React from "react";

export type DonutSegment = {
  label: string;
  value: number;      // 0〜1
  color: string;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
  ariaLabel?: string;
};

export default function DonutChart({
  segments,
  size = 220,
  thickness = 90,        // ← 太くしたいならここだけで調整
  center,
  ariaLabel = "donut chart",
}: Props) {
  const radius = size / 2;

  // ★ 過去コードと同じ穴サイズロジックに戻す（ここが最重要）
  const R = radius - thickness / 2;     // ← 円弧の描画半径（過去コードと同じ）
  const innerR = radius - thickness;    // ← 過去コードと同じ穴半径

  // ★ アニメーション
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // 座標
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const a = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, end);
    const e = polarToCartesian(cx, cy, r, start);
    const largeArcFlag = end - start <= 180 ? "0" : "1";
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${e.x} ${e.y}`;
  };

  // 円弧描画
  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const ratio = Math.max(0, Math.min(1, seg.value));
    const deg = ratio * 360;

    const start = acc;
    const end = acc + deg;
    acc = end;

    return (
      <path
        key={i}
        d={describeArc(radius, radius, R, start, end)} // ← ★ 過去コードと完全一致
        stroke={seg.color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="butt"
        style={{
          strokeDasharray: mounted ? `${ratio * 2 * Math.PI * R} ${2 * Math.PI * R}` : `0 ${2 * Math.PI * R}`,
          transition: "stroke-dasharray 1.1s ease",
        }}
      />
    );
  });

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景リング：過去コードと同じ */}
        <circle
          cx={radius}
          cy={radius}
          r={R}                        // ← ★ 過去コードと完全一致
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={thickness}
          fill="none"
        />
        {arcs}
      </svg>

      {/* 中央穴 */}
      <div
        className="absolute rounded-full bg-transparent pointer-events-none"
        style={{
          width: innerR * 2,          // ← 過去コードと同じ
          height: innerR * 2,
        }}
      />

      {center && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          {center}
        </div>
      )}
    </div>
  );
}
