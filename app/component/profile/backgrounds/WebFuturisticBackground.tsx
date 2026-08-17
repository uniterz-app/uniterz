/**
 * Web 用 futuristic 背景（DOM SVG）。
 * Native Skia（EclipseBackground / DataStreamBackground）に構図を寄せた本番品質版。
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
    <g opacity={0.32} strokeWidth={0.85} fill="none">
      <path d={`M 10 10 H 28 M 10 10 V 28`} stroke={T.cyan} />
      <path d={`M ${w - 10} 10 H ${w - 28} M ${w - 10} 10 V 28`} stroke={T.cyan} />
      <path d={`M 10 ${h - 10} H 28 M 10 ${h - 10} V ${h - 28}`} stroke={T.purple} />
      <path
        d={`M ${w - 10} ${h - 10} H ${w - 28} M ${w - 10} ${h - 10} V ${h - 28}`}
        stroke={T.magenta}
      />
    </g>
  );
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
}

/** Native EclipseBackground と同配置（右下巨大惑星 + 副衛星 + コロナ） */
function Eclipse({ width: w, height: h, fill }: Size) {
  const cx = w * 0.92;
  const cy = h * 0.78;
  const r = w * 0.68;
  const moonCx = w * 0.28;
  const moonCy = h * 0.58;
  const moonR = w * 0.085;
  const rimA0 = (175 * Math.PI) / 180;
  const rimA1 = ((175 + 115) * Math.PI) / 180;

  const stars: [number, number, number][] = [
    [0.1, 0.08, 0.9],
    [0.22, 0.14, 0.7],
    [0.38, 0.06, 1.1],
    [0.55, 0.12, 0.6],
    [0.68, 0.05, 0.85],
    [0.78, 0.18, 0.55],
    [0.15, 0.28, 0.65],
    [0.42, 0.22, 0.5],
    [0.62, 0.3, 0.75],
    [0.08, 0.42, 0.55],
    [0.33, 0.38, 0.45],
    [0.52, 0.45, 0.7],
  ];

  return (
    <Shell width={w} height={h} fill={fill}>
      <defs>
        <radialGradient id="eclBody" cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#121a2c" stopOpacity={0.75} />
          <stop offset="45%" stopColor="#070d18" stopOpacity={0.92} />
          <stop offset="100%" stopColor={T.background} stopOpacity={1} />
        </radialGradient>
        <radialGradient id="eclCorona" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={T.magenta} stopOpacity={0.45} />
          <stop offset="40%" stopColor={T.purple} stopOpacity={0.22} />
          <stop offset="100%" stopColor={T.background} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="eclMoon" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1a2438" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#050810" stopOpacity={1} />
        </radialGradient>
      </defs>

      {/* 斜めグリッド */}
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 1) / 8;
        return (
          <line
            key={`g${i}`}
            x1={0}
            y1={h * t}
            x2={w}
            y2={h * (t - 0.18)}
            stroke={T.cyan}
            strokeWidth={0.4}
            opacity={0.05}
          />
        );
      })}

      {stars.map(([x, y, rr], i) => (
        <circle
          key={i}
          cx={w * x!}
          cy={h * y!}
          r={rr}
          fill={T.white.soft}
          opacity={0.28 + (i % 3) * 0.12}
        />
      ))}

      {/* 軌道 */}
      <ellipse
        cx={cx - r * 0.15}
        cy={cy - r * 0.2}
        rx={r * 1.25}
        ry={r * 0.48}
        fill="none"
        stroke={T.purple}
        strokeWidth={1.1}
        opacity={0.28}
        transform={`rotate(-38 ${cx - r * 0.15} ${cy - r * 0.2})`}
      />
      <ellipse
        cx={cx - r * 0.1}
        cy={cy - r * 0.15}
        rx={r * 1.45}
        ry={r * 0.58}
        fill="none"
        stroke={T.magenta}
        strokeWidth={0.8}
        opacity={0.2}
        transform={`rotate(-22 ${cx - r * 0.1} ${cy - r * 0.15})`}
        strokeDasharray="3 9"
      />

      {/* コロナ */}
      <circle
        cx={cx - r * 0.55}
        cy={cy - r * 0.48}
        r={r * 0.55}
        fill="url(#eclCorona)"
      />

      {/* 主惑星 */}
      <circle cx={cx} cy={cy} r={r} fill="url(#eclBody)" />
      <path
        d={arc(cx, cy, r + 3, rimA0 - 0.08, rimA1 + 0.08)}
        fill="none"
        stroke={T.magenta}
        strokeWidth={5}
        opacity={0.22}
        strokeLinecap="round"
      />
      <path
        d={arc(cx, cy, r + 1.2, rimA0, rimA1)}
        fill="none"
        stroke={T.cyan}
        strokeWidth={2.4}
        opacity={0.65}
        strokeLinecap="round"
      />
      <path
        d={arc(cx, cy, r - 1.5, rimA0 + 0.12, rimA1 - 0.12)}
        fill="none"
        stroke={T.purple}
        strokeWidth={1.2}
        opacity={0.45}
        strokeLinecap="round"
      />

      {/* 副衛星 */}
      <circle cx={moonCx} cy={moonCy} r={moonR} fill="url(#eclMoon)" />
      <path
        d={arc(moonCx, moonCy, moonR, -0.7, 0.95)}
        fill="none"
        stroke={T.cyan}
        strokeWidth={1.4}
        opacity={0.55}
        strokeLinecap="round"
      />

      <CornerHud w={w} h={h} />
    </Shell>
  );
}

type WaveSpec = {
  offset: number;
  amp: number;
  freq: number;
  phase: number;
  dipScale: number;
  riseBias: number;
  width: number;
  opacity: number;
  color: string;
};

/** Native DataStreamBackground と同じ S 字ストリーム */
function streamY(t: number, h: number, s: WaveSpec): number {
  const left = h * 0.44;
  const right = h * 0.38;
  const baseline = left + (right - left) * t;
  const dip = Math.sin(t * Math.PI) * h * (0.072 * s.dipScale);
  const weave =
    Math.sin(t * Math.PI * 2 * s.freq + s.phase) * s.amp +
    Math.sin(t * Math.PI * (2.6 + s.riseBias) * s.freq + s.phase * 1.4) *
      s.amp *
      0.42 +
    Math.sin(t * Math.PI * 1.35 + s.phase * 0.6) * h * 0.01 * s.dipScale;
  const offset = s.offset > 0 ? s.offset * 0.62 : s.offset;
  return baseline + dip + offset + weave;
}

function buildWaveD(w: number, h: number, s: WaveSpec, samples = 56): string {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = t * w;
    const y = streamY(t, h, s);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

function DataStream({ width: w, height: h, fill }: Size) {
  const band = h * 0.18;
  const palette = [T.magenta, T.purple, "#8b5cf6", T.blue, T.cyan] as const;
  const specs: WaveSpec[] = [];
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const layer = i < 7 ? 0 : i < 15 ? 1 : 2;
    specs.push({
      offset: (t - 0.5) * band * (layer === 0 ? 1.15 : layer === 1 ? 0.9 : 0.55),
      amp: h * (0.01 + (i % 4) * 0.004),
      freq: 1.05 + (i % 5) * 0.18,
      phase: i * 0.37,
      dipScale: 0.75 + (i % 3) * 0.18,
      riseBias: (i % 4) * 0.12,
      width: layer === 2 ? 1.35 : layer === 1 ? 0.95 : 0.7,
      opacity: layer === 2 ? 0.55 + t * 0.2 : layer === 1 ? 0.32 + t * 0.15 : 0.16 + t * 0.1,
      color: palette[i % palette.length]!,
    });
  }

  return (
    <Shell width={w} height={h} fill={fill}>
      <defs>
        <linearGradient id="dsVeil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.background} stopOpacity={0.62} />
          <stop offset="1" stopColor={T.background} stopOpacity={0} />
        </linearGradient>
        <filter id="dsGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* グロー帯 */}
      {specs
        .filter((_, i) => i % 3 === 0)
        .map((s, i) => (
          <path
            key={`g${i}`}
            d={buildWaveD(w, h, s)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width * 4.5}
            opacity={s.opacity * 0.22}
            strokeLinecap="round"
            filter="url(#dsGlow)"
          />
        ))}

      {specs.map((s, i) => (
        <path
          key={`m${i}`}
          d={buildWaveD(w, h, s)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          opacity={s.opacity}
          strokeLinecap="round"
        />
      ))}

      {/* 粒子風ドット */}
      {[
        [0.12, 0.48],
        [0.28, 0.52],
        [0.45, 0.55],
        [0.62, 0.5],
        [0.78, 0.46],
        [0.9, 0.42],
        [0.35, 0.4],
        [0.55, 0.58],
      ].map(([x, y], i) => (
        <circle
          key={`p${i}`}
          cx={w * x!}
          cy={h * y!}
          r={i % 2 === 0 ? 1.2 : 0.8}
          fill={palette[i % palette.length]}
          opacity={0.45}
        />
      ))}

      <rect x={0} y={0} width={w} height={h * 0.38} fill="url(#dsVeil)" />
      <CornerHud w={w} h={h} />
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
