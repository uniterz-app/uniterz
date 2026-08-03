/**
 * Web 用 futuristic 背景（DOM SVG）。
 * 本番採用は Eclipse。Data Stream は非採用（互換のため残置）。
 */
"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  FUTURISTIC_BG_THEME as T,
  FUTURISTIC_BG_PREVIEW_CARD,
  type FuturisticBgVariantId,
} from "@/lib/profile/futuristicBgTheme";

type Size = { width: number; height: number; fill?: boolean };

function Shell({
  width,
  height,
  fill,
  children,
}: Size & { fill?: boolean; children: ReactNode }) {
  if (fill) {
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${T.background} 0%, ${T.navy} 45%, ${T.deepNavy} 100%)`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${FUTURISTIC_BG_PREVIEW_CARD.width} ${FUTURISTIC_BG_PREVIEW_CARD.height}`}
          preserveAspectRatio="none"
          aria-hidden
          className="absolute inset-0 h-full w-full"
        >
          {children}
        </svg>
      </div>
    );
  }
  const style: CSSProperties = {
    width,
    height,
    position: "relative",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${T.background} 0%, ${T.navy} 45%, ${T.deepNavy} 100%)`,
  };
  return (
    <div style={style}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        {children}
      </svg>
    </div>
  );
}

function CornerHud({ w, h }: { w: number; h: number }) {
  return (
    <g opacity={0.28} strokeWidth={0.8} fill="none">
      <path d={`M 10 10 H 26 M 10 10 V 26`} stroke={T.cyan} />
      <path d={`M ${w - 10} 10 H ${w - 26} M ${w - 10} 10 V 26`} stroke={T.cyan} />
      <path d={`M 10 ${h - 10} H 26 M 10 ${h - 10} V ${h - 26}`} stroke={T.purple} />
      <path
        d={`M ${w - 10} ${h - 10} H ${w - 26} M ${w - 10} ${h - 10} V ${h - 26}`}
        stroke={T.purple}
      />
    </g>
  );
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function Eclipse({ width: w, height: h, fill }: Size) {
  const cx = w * 1.08;
  const cy = h * 1.05;
  const r = Math.min(w, h) * 0.92;
  return (
    <Shell width={w} height={h} fill={fill}>
      <defs>
        <radialGradient id="eclBody" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#0a1220" stopOpacity={0.55} />
          <stop offset="100%" stopColor={T.background} stopOpacity={0.95} />
        </radialGradient>
      </defs>
      {[
        [0.12, 0.1],
        [0.28, 0.06],
        [0.72, 0.08],
        [0.88, 0.18],
        [0.08, 0.88],
      ].map(([x, y], i) => (
        <circle key={i} cx={w * x!} cy={h * y!} r={0.9} fill={T.white.soft} opacity={0.35} />
      ))}
      <path
        d={arc(w * 0.35, h * 0.55, Math.min(w, h) * 0.85, -2.6, -0.4)}
        fill="none"
        stroke={T.purple}
        strokeWidth={0.6}
        opacity={0.12}
      />
      <circle cx={cx} cy={cy} r={r} fill="url(#eclBody)" />
      <path
        d={arc(cx, cy, r, -Math.PI * 0.98, -Math.PI * 0.22)}
        fill="none"
        stroke={T.cyan}
        strokeWidth={2}
        opacity={0.55}
        strokeLinecap="round"
      />
      <path
        d={arc(cx, cy, r + 2.5, -Math.PI * 0.94, -Math.PI * 0.26)}
        fill="none"
        stroke={T.purple}
        strokeWidth={1.1}
        opacity={0.35}
        strokeLinecap="round"
      />
      <CornerHud w={w} h={h} />
    </Shell>
  );
}

function DataStream({ width: w, height: h, fill }: Size) {
  const colors = [T.purple, T.magenta, T.cyan, T.blue];
  const bands = Array.from({ length: 6 }, (_, i) => {
    const t = i / 5;
    const baseY = h * (0.46 + t * 0.38);
    const amp = h * 0.025;
    const freq = 1.1 + (i % 3) * 0.35;
    const phase = i * 0.17;
    let d = "";
    for (let s = 0; s <= 48; s++) {
      const x = (s / 48) * w;
      const u = x / w;
      const y =
        baseY + Math.sin((u * Math.PI * 2 * freq + phase) * Math.PI * 2) * amp;
      d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return {
      d,
      color: colors[i % 4]!,
      opacity: 0.22 + t * 0.35,
      stroke: 0.7 + (i % 3) * 0.25,
    };
  });
  return (
    <Shell width={w} height={h} fill={fill}>
      <defs>
        <linearGradient id="dsVeil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.background} stopOpacity={0.55} />
          <stop offset="1" stopColor={T.background} stopOpacity={0} />
        </linearGradient>
      </defs>
      {bands.map((b, i) => (
        <path
          key={`g${i}`}
          d={b.d}
          fill="none"
          stroke={b.color}
          strokeWidth={b.stroke * 5}
          opacity={b.opacity * 0.22}
          strokeLinecap="round"
        />
      ))}
      {bands.map((b, i) => (
        <path
          key={`m${i}`}
          d={b.d}
          fill="none"
          stroke={b.color}
          strokeWidth={b.stroke}
          opacity={b.opacity}
          strokeLinecap="round"
        />
      ))}
      <rect x={0} y={0} width={w} height={h * 0.42} fill="url(#dsVeil)" />
    </Shell>
  );
}

const MAP: Record<FuturisticBgVariantId, (p: Size) => ReactNode> = {
  eclipse: Eclipse,
  "data-stream": DataStream,
};

function withCanvasSize(p: Size): Size {
  if (!p.fill) return p;
  return {
    width: FUTURISTIC_BG_PREVIEW_CARD.width,
    height: FUTURISTIC_BG_PREVIEW_CARD.height,
    fill: true,
  };
}

export function WebFuturisticBackground({
  id,
  width = FUTURISTIC_BG_PREVIEW_CARD.width,
  height = FUTURISTIC_BG_PREVIEW_CARD.height,
  fill = false,
}: {
  id: FuturisticBgVariantId;
  width?: number;
  height?: number;
  /** 親を埋め尽くす（プロフィールカード当てはめ用） */
  fill?: boolean;
}) {
  const Comp = MAP[id];
  const size = withCanvasSize({ width, height, fill });
  return <>{Comp(size)}</>;
}
