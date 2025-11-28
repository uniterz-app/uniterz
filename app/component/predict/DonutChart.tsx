// app/component/predict/DonutChart.tsx
"use client";

import React from "react";

export type DonutSegment = {
  label: string;
  value: number;      // 比率（0〜1想定。合計は≦1でOK）
  color: string;      // セグメント色
};

type Props = {
  segments: DonutSegment[];
  size?: number;          // px
  thickness?: number;     // ドーナツの太さ(px)
  center?: React.ReactNode; // 中央に置く任意の要素（ロゴ等）
  ariaLabel?: string;
};

export default function DonutChart({
  segments,
  size = 220,
  thickness = 22,
  center,
  ariaLabel = "donut chart",
}: Props) {
  const radius = size / 2;
  const innerR = radius - thickness;
  const C = 2 * Math.PI * radius;

  // SVG 円弧用のヘルパ
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

  // 角度を累積して円弧を描画
  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const deg = Math.max(0, Math.min(360, seg.value * 360));
    const start = acc;
    const end = acc + deg;
    acc = end;
    return (
      <path
        key={i}
        d={describeArc(radius, radius, radius - thickness / 2, start, end)}
        stroke={seg.color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div
      aria-label={ariaLabel}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景リング */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - thickness / 2}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={thickness}
          fill="none"
        />
        {arcs}
      </svg>
      {/* 中心の空洞をクリック不可にするためのカバー（見た目は center に任せる） */}
      <div
        className="absolute rounded-full bg-transparent pointer-events-none"
        style={{
          width: innerR * 2,
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
