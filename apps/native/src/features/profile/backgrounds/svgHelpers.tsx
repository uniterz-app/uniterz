/**
 * futuristic 背景向けの再利用 SVG ヘルパー。
 * stars / HUD / glow line / grid / rings / particles
 */
import { Fragment } from "react";
import { Circle, Line, Path } from "react-native-svg";
import { FUTURISTIC_BG_THEME } from "./theme";

/* —— 型 —— */

export type StarSpec = {
  x: number;
  y: number;
  r?: number;
  opacity?: number;
  color?: string;
};

export type ParticleSpec = {
  x: number;
  y: number;
  r?: number;
  opacity?: number;
  color?: string;
};

export type GridLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
};

export type HorizonLine = {
  y: number;
  opacity: number;
};

export type PerspectiveGrid = {
  verticals: GridLine[];
  horizontals: HorizonLine[];
  vanishX: number;
  vanishY: number;
};

/* —— 幾何ユーティリティ —— */

/** 円弧 Path（SVG A コマンド） */
export function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/** 決定的 PRNG（星・粒子の再現用） */
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* —— stars —— */

export function generateStars(opts: {
  width: number;
  height: number;
  count?: number;
  seed?: number;
  /** 中央帯を避ける */
  avoidCenter?: boolean;
  colors?: string[];
}): StarSpec[] {
  const {
    width: w,
    height: h,
    count = 24,
    seed = 42,
    avoidCenter = true,
    colors = [FUTURISTIC_BG_THEME.white.soft, FUTURISTIC_BG_THEME.cyan, FUTURISTIC_BG_THEME.purple],
  } = opts;
  const rand = mulberry32(seed);
  const out: StarSpec[] = [];
  for (let i = 0; i < count; i++) {
    let x = rand() * w;
    let y = rand() * h;
    if (
      avoidCenter &&
      x > w * 0.22 &&
      x < w * 0.78 &&
      y > h * 0.28 &&
      y < h * 0.62 &&
      rand() > 0.2
    ) {
      y = rand() > 0.5 ? rand() * h * 0.24 : h * 0.72 + rand() * h * 0.26;
    }
    out.push({
      x,
      y,
      r: 0.45 + rand() * 1.35,
      opacity: 0.22 + rand() * 0.5,
      color: colors[Math.floor(rand() * colors.length)],
    });
  }
  return out;
}

export function StarsLayer({
  stars,
  keyPrefix = "star",
}: {
  stars: StarSpec[];
  keyPrefix?: string;
}) {
  return (
    <Fragment>
      {stars.map((s, i) => (
        <Circle
          key={`${keyPrefix}-${i}`}
          cx={s.x}
          cy={s.y}
          r={s.r ?? 1}
          fill={s.color ?? FUTURISTIC_BG_THEME.white.soft}
          fillOpacity={s.opacity ?? 0.4}
        />
      ))}
    </Fragment>
  );
}

/* —— corner HUD —— */

export function CornerHudMarks({
  width: w,
  height: h,
  inset = 10,
  arm = 16,
  strokeWidth = 0.8,
  opacity = 0.28,
  color = FUTURISTIC_BG_THEME.cyan,
  altColor = FUTURISTIC_BG_THEME.purple,
}: {
  width: number;
  height: number;
  inset?: number;
  arm?: number;
  strokeWidth?: number;
  opacity?: number;
  color?: string;
  altColor?: string;
}) {
  const i = inset;
  const a = arm;
  return (
    <Fragment>
      <Path
        d={`M ${i} ${i} H ${i + a} M ${i} ${i} V ${i + a}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        fill="none"
      />
      <Path
        d={`M ${w - i} ${i} H ${w - i - a} M ${w - i} ${i} V ${i + a}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity * 0.85}
        fill="none"
      />
      <Path
        d={`M ${i} ${h - i} H ${i + a} M ${i} ${h - i} V ${h - i - a}`}
        stroke={altColor}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity * 0.85}
        fill="none"
      />
      <Path
        d={`M ${w - i} ${h - i} H ${w - i - a} M ${w - i} ${h - i} V ${h - i - a}`}
        stroke={altColor}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        fill="none"
      />
    </Fragment>
  );
}

/* —— glowing lines —— */

/** グロー風: 太い半透明 + 細い本体 */
export function GlowPath({
  d,
  color,
  stroke = 1.2,
  opacity = 0.5,
  glowScale = 4,
  glowOpacityScale = 0.28,
  strokeLinecap = "round",
  dasharray,
}: {
  d: string;
  color: string;
  stroke?: number;
  opacity?: number;
  glowScale?: number;
  glowOpacityScale?: number;
  strokeLinecap?: "round" | "butt" | "square";
  dasharray?: string;
}) {
  return (
    <Fragment>
      <Path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={stroke * glowScale}
        strokeOpacity={opacity * glowOpacityScale}
        strokeLinecap={strokeLinecap}
        strokeDasharray={dasharray}
      />
      <Path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeOpacity={opacity}
        strokeLinecap={strokeLinecap}
        strokeDasharray={dasharray}
      />
    </Fragment>
  );
}

export function GlowLine({
  x1,
  y1,
  x2,
  y2,
  color,
  stroke = 1,
  opacity = 0.45,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  stroke?: number;
  opacity?: number;
}) {
  return (
    <Fragment>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={stroke * 3.5}
        strokeOpacity={opacity * 0.25}
        strokeLinecap="round"
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={stroke}
        strokeOpacity={opacity}
        strokeLinecap="round"
      />
    </Fragment>
  );
}

/* —— grid —— */

export function buildPerspectiveGrid(opts: {
  width: number;
  height: number;
  vanishX?: number;
  vanishY?: number;
  gridTop?: number;
  cols?: number;
  rows?: number;
}): PerspectiveGrid {
  const w = opts.width;
  const h = opts.height;
  const vanishX = opts.vanishX ?? w * 0.5;
  const vanishY = opts.vanishY ?? h * 0.5;
  const gridTop = opts.gridTop ?? h * 0.55;
  const cols = opts.cols ?? 12;
  const rows = opts.rows ?? 9;

  const verticals: GridLine[] = [];
  for (let i = 0; i <= cols; i++) {
    const t = i / cols;
    const xBottom = w * (-0.06 + t * 1.12);
    const xTop = vanishX + (xBottom - vanishX) * 0.14;
    verticals.push({
      x1: xTop,
      y1: vanishY,
      x2: xBottom,
      y2: h + 2,
      opacity: 0.08 + Math.abs(t - 0.5) * 0.14,
    });
  }

  const horizontals: HorizonLine[] = [];
  for (let i = 0; i < rows; i++) {
    const t = i / Math.max(rows - 1, 1);
    const ease = t * t;
    horizontals.push({
      y: gridTop + (h - gridTop) * ease,
      opacity: 0.06 + t * 0.16,
    });
  }

  return { verticals, horizontals, vanishX, vanishY };
}

export function PerspectiveGridLayer({
  grid,
  color = FUTURISTIC_BG_THEME.cyan,
  horizonColor = FUTURISTIC_BG_THEME.blue,
  width,
}: {
  grid: PerspectiveGrid;
  color?: string;
  horizonColor?: string;
  width: number;
}) {
  return (
    <Fragment>
      {grid.verticals.map((v, i) => (
        <Line
          key={`gv-${i}`}
          x1={v.x1}
          y1={v.y1}
          x2={v.x2}
          y2={v.y2}
          stroke={color}
          strokeWidth={0.55}
          strokeOpacity={v.opacity}
        />
      ))}
      {grid.horizontals.map((row, i) => (
        <Line
          key={`gh-${i}`}
          x1={0}
          y1={row.y}
          x2={width}
          y2={row.y}
          stroke={horizonColor}
          strokeWidth={0.5}
          strokeOpacity={row.opacity}
        />
      ))}
    </Fragment>
  );
}

/* —— rings —— */

export type RingSpec = {
  r: number;
  color?: string;
  stroke?: number;
  opacity?: number;
  dasharray?: string;
};

export function ConcentricRings({
  cx,
  cy,
  rings,
}: {
  cx: number;
  cy: number;
  rings: RingSpec[];
}) {
  return (
    <Fragment>
      {rings.map((r, i) => (
        <Circle
          key={`ring-${i}`}
          cx={cx}
          cy={cy}
          r={r.r}
          fill="none"
          stroke={r.color ?? FUTURISTIC_BG_THEME.cyan}
          strokeWidth={r.stroke ?? 0.7}
          strokeOpacity={r.opacity ?? 0.25}
          strokeDasharray={r.dasharray}
        />
      ))}
    </Fragment>
  );
}

export function RadialSpokes({
  cx,
  cy,
  count,
  rInner,
  rOuter,
  color = FUTURISTIC_BG_THEME.cyan,
  baseOpacity = 0.1,
  emphasizeEvery = 4,
}: {
  cx: number;
  cy: number;
  count: number;
  rInner: number;
  rOuter: number;
  color?: string;
  baseOpacity?: number;
  emphasizeEvery?: number;
}) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const strong = emphasizeEvery > 0 && i % emphasizeEvery === 0;
    const ri = strong ? rInner * 0.7 : rInner;
    const ro = strong ? rOuter : rOuter * 0.85;
    lines.push(
      <Line
        key={`spoke-${i}`}
        x1={cx + ri * Math.cos(a)}
        y1={cy + ri * Math.sin(a)}
        x2={cx + ro * Math.cos(a)}
        y2={cy + ro * Math.sin(a)}
        stroke={color}
        strokeWidth={0.55}
        strokeOpacity={strong ? baseOpacity * 1.8 : baseOpacity}
      />,
    );
  }
  return <Fragment>{lines}</Fragment>;
}

/* —— particles —— */

export function generateParticles(opts: {
  width: number;
  height: number;
  count?: number;
  seed?: number;
  /** y をこの帯に寄せる（0–1） */
  yRange?: [number, number];
  colors?: string[];
}): ParticleSpec[] {
  const {
    width: w,
    height: h,
    count = 40,
    seed = 7,
    yRange = [0.4, 0.95],
    colors = [
      FUTURISTIC_BG_THEME.cyan,
      FUTURISTIC_BG_THEME.purple,
      FUTURISTIC_BG_THEME.magenta,
      FUTURISTIC_BG_THEME.blue,
    ],
  } = opts;
  const rand = mulberry32(seed);
  const out: ParticleSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand() * w,
      y: h * (yRange[0] + rand() * (yRange[1] - yRange[0])),
      r: 0.5 + rand() * 1.4,
      opacity: 0.2 + rand() * 0.45,
      color: colors[Math.floor(rand() * colors.length)],
    });
  }
  return out;
}

export function ParticlesLayer({
  particles,
  keyPrefix = "pt",
}: {
  particles: ParticleSpec[];
  keyPrefix?: string;
}) {
  return (
    <Fragment>
      {particles.map((p, i) => (
        <Circle
          key={`${keyPrefix}-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r ?? 1}
          fill={p.color ?? FUTURISTIC_BG_THEME.cyan}
          fillOpacity={p.opacity ?? 0.35}
        />
      ))}
    </Fragment>
  );
}
