/**
 * Dark wood half-court + synthetic scatter dots from zone aggregates.
 * (BDL has by_zone FG%/FGA, not loc_x/loc_y — dots are mock density.)
 */

import type {
  NbaPlayerShotZone,
  NbaPlayerShotZoneId,
} from "./nbaPlayerDetailPreviewMocks";
import {
  SHOT_ZONE_ARC_R,
  SHOT_ZONE_BASKET,
  SHOT_ZONE_PAINT,
  SHOT_ZONE_RA_R,
  SHOT_ZONE_VB_H,
  SHOT_ZONE_VB_W,
  shotZoneThreePointLine,
} from "./nbaShotZoneCourtGeometry";

export type ShotScatterDot = {
  x: number;
  y: number;
  r: number;
  color: string;
};

const CX = 250;
const BASE = 460;
const CORNER_X_L = 30;
const CORNER_X_R = SHOT_ZONE_VB_W - 30;

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Frequency heat: green → yellow → orange → red */
export function shotFrequencyColor(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  if (u < 0.33) {
    return lerpHex("#7CFF6B", "#FFD700", u / 0.33);
  }
  if (u < 0.66) {
    return lerpHex("#FFD700", "#FF8C00", (u - 0.33) / 0.33);
  }
  return lerpHex("#FF8C00", "#FF2A1A", (u - 0.66) / 0.34);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function cornerArcY(): number {
  const { y: by } = SHOT_ZONE_BASKET;
  const r = SHOT_ZONE_ARC_R;
  const dx = CX - CORNER_X_L;
  const dy = Math.sqrt(Math.max(0, r * r - dx * dx));
  return by - dy;
}

function zoneById(
  zones: NbaPlayerShotZone[],
  id: NbaPlayerShotZoneId
): NbaPlayerShotZone | undefined {
  return zones.find((z) => z.id === id);
}

function addCluster(
  out: ShotScatterDot[],
  rnd: () => number,
  opts: {
    count: number;
    cx: number;
    cy: number;
    spreadX: number;
    spreadY: number;
    heat: number;
    rMin: number;
    rMax: number;
  }
) {
  for (let i = 0; i < opts.count; i += 1) {
    // denser toward center
    const ang = rnd() * Math.PI * 2;
    const rad = Math.pow(rnd(), 0.55);
    const x = opts.cx + Math.cos(ang) * rad * opts.spreadX;
    const y = opts.cy + Math.sin(ang) * rad * opts.spreadY;
    const local = opts.heat * (0.55 + (1 - rad) * 0.45) + (rnd() - 0.5) * 0.12;
    const r =
      opts.rMin +
      (opts.rMax - opts.rMin) * (0.35 + (1 - rad) * 0.65) * (0.7 + rnd() * 0.5);
    out.push({
      x,
      y,
      r: Math.max(1.2, r),
      color: shotFrequencyColor(local),
    });
  }
}

/** Arc band of dots (3PT) */
function addArcBand(
  out: ShotScatterDot[],
  rnd: () => number,
  opts: {
    count: number;
    rInner: number;
    rOuter: number;
    a0: number;
    a1: number;
    heat: number;
    rMin: number;
    rMax: number;
  }
) {
  const { x: bx, y: by } = SHOT_ZONE_BASKET;
  for (let i = 0; i < opts.count; i += 1) {
    const t = rnd();
    const a = opts.a0 + (opts.a1 - opts.a0) * t;
    // denser mid-arc
    const midBias = 1 - Math.abs(t - 0.5) * 1.2;
    const rr =
      opts.rInner + (opts.rOuter - opts.rInner) * Math.pow(rnd(), 0.8);
    const x = bx + Math.cos(a) * rr;
    const y = by - Math.sin(a) * rr; // up toward halfcourt
    const heat = opts.heat * (0.55 + midBias * 0.45) + (rnd() - 0.5) * 0.1;
    const r =
      opts.rMin +
      (opts.rMax - opts.rMin) * (0.4 + midBias * 0.6) * (0.65 + rnd() * 0.5);
    if (x < 12 || x > SHOT_ZONE_VB_W - 12 || y < 16 || y > BASE - 4) continue;
    out.push({ x, y, r: Math.max(1.2, r), color: shotFrequencyColor(heat) });
  }
}

/**
 * Build mock density scatter from zone FGA (volume) — style like density shot charts.
 */
export function buildShotScatterDots(
  zones: NbaPlayerShotZone[],
  seedKey: string
): ShotScatterDot[] {
  const rnd = mulberry32(hashSeed(`scatter:${seedKey}:v2`));
  const dots: ShotScatterDot[] = [];

  const ra = zoneById(zones, "restricted");
  const paint = zoneById(zones, "paint");
  const mid = zoneById(zones, "mid");
  const lc3 = zoneById(zones, "left_corner_3");
  const rc3 = zoneById(zones, "right_corner_3");
  const ab3 = zoneById(zones, "above_break_3");

  const maxFga = Math.max(
    1,
    ...[ra, paint, mid, lc3, rc3, ab3].map((z) => z?.fga ?? 0)
  );
  const heatOf = (z?: NbaPlayerShotZone) =>
    z ? Math.min(1, (z.fga / maxFga) * 0.85 + 0.15) : 0.3;
  const countOf = (z: NbaPlayerShotZone | undefined, lo: number, hi: number) => {
    if (!z) return lo;
    const t = z.fga / maxFga;
    return Math.round(lo + (hi - lo) * t);
  };

  // Rim / RA — densest hot cluster
  addCluster(dots, rnd, {
    count: countOf(ra, 28, 70),
    cx: SHOT_ZONE_BASKET.x,
    cy: SHOT_ZONE_BASKET.y - 4,
    spreadX: SHOT_ZONE_RA_R * 1.15,
    spreadY: SHOT_ZONE_RA_R * 0.95,
    heat: Math.max(0.75, heatOf(ra)),
    rMin: 3.5,
    rMax: 11,
  });

  // Paint non-RA — medium around paint
  addCluster(dots, rnd, {
    count: countOf(paint, 12, 36),
    cx: CX,
    cy: SHOT_ZONE_PAINT.y + SHOT_ZONE_PAINT.h * 0.42,
    spreadX: SHOT_ZONE_PAINT.w * 0.38,
    spreadY: SHOT_ZONE_PAINT.h * 0.28,
    heat: heatOf(paint) * 0.75,
    rMin: 2.2,
    rMax: 7,
  });

  // Mid — sparse
  addCluster(dots, rnd, {
    count: countOf(mid, 6, 18),
    cx: CX - 55,
    cy: 200,
    spreadX: 50,
    spreadY: 40,
    heat: heatOf(mid) * 0.45,
    rMin: 1.6,
    rMax: 4.5,
  });
  addCluster(dots, rnd, {
    count: countOf(mid, 6, 18),
    cx: CX + 55,
    cy: 200,
    spreadX: 50,
    spreadY: 40,
    heat: heatOf(mid) * 0.45,
    rMin: 1.6,
    rMax: 4.5,
  });

  // Above-break 3 — thick band along arc
  const arcY = cornerArcY();
  void arcY;
  addArcBand(dots, rnd, {
    count: countOf(ab3, 40, 95),
    rInner: SHOT_ZONE_ARC_R - 14,
    rOuter: SHOT_ZONE_ARC_R + 18,
    a0: Math.PI * 0.12,
    a1: Math.PI * 0.88,
    heat: Math.max(0.7, heatOf(ab3)),
    rMin: 3,
    rMax: 9.5,
  });

  // Corner 3s
  addCluster(dots, rnd, {
    count: countOf(lc3, 10, 28),
    cx: 22,
    cy: BASE - 55,
    spreadX: 14,
    spreadY: 48,
    heat: Math.max(0.55, heatOf(lc3)),
    rMin: 2.5,
    rMax: 7.5,
  });
  addCluster(dots, rnd, {
    count: countOf(rc3, 10, 28),
    cx: SHOT_ZONE_VB_W - 22,
    cy: BASE - 55,
    spreadX: 14,
    spreadY: 48,
    heat: Math.max(0.55, heatOf(rc3)),
    rMin: 2.5,
    rMax: 7.5,
  });

  // Soft fringe greens
  for (let i = 0; i < 14; i += 1) {
    dots.push({
      x: 40 + rnd() * (SHOT_ZONE_VB_W - 80),
      y: 40 + rnd() * 120,
      r: 1.4 + rnd() * 2.2,
      color: shotFrequencyColor(0.08 + rnd() * 0.18),
    });
  }

  return dots;
}

/** Vertical wood-plank lines for dark court texture */
export function shotCourtWoodGrainLines(
  count = 28
): Array<{ x: number; opacity: number }> {
  const lines: Array<{ x: number; opacity: number }> = [];
  const pad = 10;
  const span = SHOT_ZONE_VB_W - pad * 2;
  for (let i = 0; i < count; i += 1) {
    lines.push({
      x: pad + (span * i) / (count - 1),
      opacity: 0.04 + (i % 3) * 0.02,
    });
  }
  return lines;
}

export function shotCourtFreeThrowCirclePath(): string {
  const p = SHOT_ZONE_PAINT;
  const r = 60; // 6 ft
  const cy = p.y;
  const cx = CX;
  // semicircle above FT line (toward halfcourt)
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
}

export {
  SHOT_ZONE_VB_W,
  SHOT_ZONE_VB_H,
  SHOT_ZONE_BASKET,
  SHOT_ZONE_PAINT,
  SHOT_ZONE_RA_R,
  shotZoneThreePointLine,
};
