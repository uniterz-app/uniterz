/**
 * NBA half-court geometry for BDL `shooting?type=by_zone` style heat.
 * Units ≈ feet × 10. Basket near bottom baseline.
 * Cropped just above the 3PT apex (not the corner height).
 */

export const SHOT_ZONE_VB_W = 500;

const CX = 250;
const BASE = 460;

/** Basket center (~5.25 ft from baseline) */
export const SHOT_ZONE_BASKET = { x: CX, y: BASE - 52.5 } as const;

const PAINT_HALF = 80; // 8 ft
const PAINT_DEPTH = 190; // 19 ft
export const SHOT_ZONE_PAINT = {
  x: CX - PAINT_HALF,
  y: BASE - PAINT_DEPTH,
  w: PAINT_HALF * 2,
  h: PAINT_DEPTH,
} as const;

/** Restricted area radius ≈ 4 ft */
export const SHOT_ZONE_RA_R = 40;

/** 3PT arc radius ≈ 23.75 ft */
export const SHOT_ZONE_ARC_R = 237.5;

const CORNER_X_L = 30;
const CORNER_X_R = SHOT_ZONE_VB_W - 30;

/** Slim band above 3PT apex only */
const ABOVE_BREAK_DEPTH = 48;

/** Y of 3PT arc at center (apex) */
export function threePointApexY(): number {
  return SHOT_ZONE_BASKET.y - SHOT_ZONE_ARC_R;
}

/** Y where corner 3 vertical meets the arc */
function cornerArcY(): number {
  const { y: by } = SHOT_ZONE_BASKET;
  const r = SHOT_ZONE_ARC_R;
  const dx = CX - CORNER_X_L;
  const dy = Math.sqrt(Math.max(0, r * r - dx * dx));
  return by - dy;
}

/** Top of drawable court (just above 3PT apex) */
export function shotCourtTop(): number {
  return threePointApexY() - ABOVE_BREAK_DEPTH;
}

export const SHOT_ZONE_VB_MIN_Y = shotCourtTop() - 6;
export const SHOT_ZONE_VB_H = BASE + 8 - SHOT_ZONE_VB_MIN_Y;

export function shotZoneViewBox(): string {
  return `0 ${SHOT_ZONE_VB_MIN_Y} ${SHOT_ZONE_VB_W} ${SHOT_ZONE_VB_H}`;
}

/**
 * Above-the-break 3: band from court top down to the 3PT arc
 * (arc goes through the apex, not a flat cut at corner height).
 */
export function shotZonePathAboveBreak3Fill(): string {
  const r = SHOT_ZONE_ARC_R;
  const cornerY = cornerArcY();
  const top = shotCourtTop();
  return [
    `M 8 ${top}`,
    `L ${SHOT_ZONE_VB_W - 8} ${top}`,
    `L ${SHOT_ZONE_VB_W - 8} ${cornerY}`,
    `L ${CORNER_X_R} ${cornerY}`,
    // right → left along upper arc (through apex)
    `A ${r} ${r} 0 0 0 ${CORNER_X_L} ${cornerY}`,
    `L 8 ${cornerY}`,
    `Z`,
  ].join(" ");
}

export function shotZonePathLeftCorner3(): string {
  const cornerY = cornerArcY();
  return [
    `M 8 ${BASE}`,
    `L ${CORNER_X_L} ${BASE}`,
    `L ${CORNER_X_L} ${cornerY}`,
    `L 8 ${cornerY}`,
    `Z`,
  ].join(" ");
}

export function shotZonePathRightCorner3(): string {
  const cornerY = cornerArcY();
  return [
    `M ${CORNER_X_R} ${BASE}`,
    `L ${SHOT_ZONE_VB_W - 8} ${BASE}`,
    `L ${SHOT_ZONE_VB_W - 8} ${cornerY}`,
    `L ${CORNER_X_R} ${cornerY}`,
    `Z`,
  ].join(" ");
}

/** Mid-range: inside 3PT arc, outside paint */
export function shotZonePathMidRange(): string {
  const r = SHOT_ZONE_ARC_R;
  const cornerY = cornerArcY();
  const p = SHOT_ZONE_PAINT;
  return [
    `M ${CORNER_X_L} ${cornerY}`,
    `A ${r} ${r} 0 0 1 ${CORNER_X_R} ${cornerY}`,
    `L ${CORNER_X_R} ${BASE}`,
    `L ${p.x + p.w} ${BASE}`,
    `L ${p.x + p.w} ${p.y}`,
    `L ${p.x} ${p.y}`,
    `L ${p.x} ${BASE}`,
    `L ${CORNER_X_L} ${BASE}`,
    `Z`,
  ].join(" ");
}

export function shotZonePathPaint(): string {
  const p = SHOT_ZONE_PAINT;
  return `M ${p.x} ${p.y} H ${p.x + p.w} V ${BASE} H ${p.x} Z`;
}

export function shotZoneThreePointLine(): string {
  const r = SHOT_ZONE_ARC_R;
  const cornerY = cornerArcY();
  return [
    `M ${CORNER_X_L} ${BASE}`,
    `L ${CORNER_X_L} ${cornerY}`,
    `A ${r} ${r} 0 0 1 ${CORNER_X_R} ${cornerY}`,
    `L ${CORNER_X_R} ${BASE}`,
  ].join(" ");
}

/**
 * Label anchors — must NOT overlap.
 * apex≈170, paint.top≈270, basket≈407.5
 */
export const SHOT_ZONE_LABEL_POS = {
  above_break_3: { x: CX, y: shotCourtTop() + 22 },
  mid: { x: CX, y: (threePointApexY() + SHOT_ZONE_PAINT.y) / 2 },
  left_corner_3: { x: 52, y: BASE - 70 },
  right_corner_3: { x: SHOT_ZONE_VB_W - 52, y: BASE - 70 },
  paint: { x: CX, y: SHOT_ZONE_PAINT.y + 58 },
  restricted: { x: CX, y: SHOT_ZONE_BASKET.y + 2 },
} as const;

export const SHOT_ZONE_FG_BASELINE: Record<
  keyof typeof SHOT_ZONE_LABEL_POS,
  number
> = {
  restricted: 0.66,
  paint: 0.42,
  mid: 0.41,
  left_corner_3: 0.39,
  right_corner_3: 0.39,
  above_break_3: 0.35,
};

export function zoneFgPctColor(fgPct: number): string {
  const t = Math.max(0, Math.min(1, (fgPct - 0.2) / 0.6));
  return zoneEfficiencyColor(t);
}

export function shotZoneHotColdColor(
  fgPct: number,
  zoneId: keyof typeof SHOT_ZONE_FG_BASELINE
): string {
  const base = SHOT_ZONE_FG_BASELINE[zoneId];
  const t = Math.max(0, Math.min(1, (fgPct - base + 0.12) / 0.24));
  return zoneEfficiencyColor(t);
}

export function zoneEfficiencyColor(t: number): string {
  const stops: Array<[number, string]> = [
    [0, "#3b1a6e"],
    [0.22, "#5c2d9e"],
    [0.45, "#7a45b8"],
    [0.62, "#4a8fd4"],
    [0.8, "#2ec4d6"],
    [1, "#00f5ff"],
  ];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [t0, c0] = stops[i]!;
    const [t1, c1] = stops[i + 1]!;
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return lerpHex(c0, c1, u);
    }
  }
  return stops[stops.length - 1]![1];
}

export function cyberHeatColor(t: number): string {
  return zoneEfficiencyColor(t);
}

export function shotZoneFgm(zone: { fgPct: number; fga: number }): number {
  return Math.round(zone.fgPct * zone.fga);
}

export function formatShotZoneMakes(zone: {
  fgPct: number;
  fga: number;
}): string {
  return `${shotZoneFgm(zone)} \u2215 ${zone.fga}`;
}

export const SHOT_ZONE_GLOW_R: Record<keyof typeof SHOT_ZONE_LABEL_POS, number> =
  {
    above_break_3: 58,
    left_corner_3: 58,
    right_corner_3: 58,
    mid: 95,
    paint: 72,
    restricted: 48,
  };

export function shotCourtFreeThrowCirclePath(): string {
  const p = SHOT_ZONE_PAINT;
  const r = 60;
  const cy = p.y;
  const cx = CX;
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
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
