"use client";

import React from "react";

export type DonutSegment = {
  label: string;
  value: number; // 0〜1
  color: string;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
  ariaLabel?: string;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r} ${g} ${bl})`;
}

// seg.color をベースに「少し明るい→少し暗い」へ
function buildSegmentGradientStops(baseHex: string) {
  const light = mixHex("#ffffff", baseHex, 0.75); // 白寄せ（少し）
  const dark = mixHex("#000000", baseHex, 0.55);  // 黒寄せ（少し）
  return { light, base: baseHex, dark };
}

export default function DonutChart({
  segments,
  size = 220,
  thickness = 90, // ← 太くしたいならここだけで調整
  center,
  ariaLabel = "donut chart",
}: Props) {
  const radius = size / 2;

  // ★ 過去コードと同じ穴サイズロジックに戻す（ここが最重要）
  const R = radius - thickness / 2; // ← 円弧の描画半径（過去コードと同じ）
  const innerR = radius - thickness; // ← 過去コードと同じ穴半径

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
    const ratio = clamp01(seg.value);
    const deg = ratio * 360;

    const start = acc;
    const end = acc + deg;
    acc = end;

    // ① グラデーション（各セグメントごと）
    const gradId = `seg-grad-${i}`;
    const { light, base, dark } = buildSegmentGradientStops(seg.color);

    return (
      <path
        key={i}
        d={describeArc(radius, radius, R, start, end)} // ← ★ 過去コードと完全一致
        stroke={`url(#${gradId})`}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="butt"
        style={{
          strokeDasharray: mounted
            ? `${ratio * 2 * Math.PI * R} ${2 * Math.PI * R}`
            : `0 ${2 * Math.PI * R}`,
          transition: "stroke-dasharray 1.1s ease",
          // ② ガラス風（軽いグロー）
          filter: "drop-shadow(0 0 10px rgba(255,255,255,0.06))",
        }}
      />
    );
  });

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* セグメント用グラデ（①） */}
          {segments.map((seg, i) => {
            const gradId = `seg-grad-${i}`;
            const { light, base, dark } = buildSegmentGradientStops(seg.color);
            return (
              <linearGradient
                key={gradId}
                id={gradId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={light} stopOpacity="0.95" />
                <stop offset="55%" stopColor={base} stopOpacity="0.95" />
                <stop offset="100%" stopColor={dark} stopOpacity="0.95" />
              </linearGradient>
            );
          })}

          {/* ハイライト用（②） */}
          <radialGradient id="donut-highlight" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </radialGradient>
        </defs>

        {/* 背景リング：過去コードと同じ */}
        <circle
          cx={radius}
          cy={radius}
          r={R} // ← ★ 過去コードと完全一致
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={thickness}
          fill="none"
        />

        {arcs}

        {/* ② ガラス風の薄いハイライトを上から重ねる */}
        <circle
          cx={radius}
          cy={radius}
          r={R}
          stroke="url(#donut-highlight)"
          strokeWidth={thickness}
          fill="none"
          pointerEvents="none"
        />
      </svg>

      {/* 中央穴 */}
      <div
        className="absolute rounded-full bg-transparent pointer-events-none"
        style={{
          width: innerR * 2, // ← 過去コードと同じ
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