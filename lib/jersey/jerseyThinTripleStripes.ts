/**
 * ジャージ斜めライン案 D（細いレーシング3本）。
 * Web DotJerseyCanvas / Native JerseyMark / DEV preview で共用。
 */

import {
  JERSEY_STRIPE_LIFT,
  liftHexForJerseyDisplay,
} from "./jerseyDisplayLift";
import type { JerseyDotDensity } from "./jerseyDensity";

export type JerseyStripeDot = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

export type JerseyStripeBand = {
  rotateDeg: number;
  cx: number;
  cy: number;
  dots: JerseyStripeDot[];
};

/** 黒地のときだけ薄い白枠 */
export const JERSEY_FRAME_WHITE = "#F5F7FA";

/** ほぼ黒の地かどうか（紺は対象外） */
export function isBlackBodyPrimary(hex: string): boolean {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return false;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return false;
  return r <= 40 && g <= 40 && b <= 40;
}

function pushDotBand(
  out: JerseyStripeDot[],
  opts: {
    y0: number;
    y1: number;
    stepX: number;
    stepY: number;
    r: number;
    fill: string;
    opacityAt?: (t: number) => number;
    radiusAt?: (t: number) => number;
  }
) {
  const { y0, y1, stepX, stepY, r, fill } = opts;
  const span = Math.max(1e-6, y1 - y0);
  let row = 0;
  for (let y = y0; y <= y1 + 1e-6; y += stepY, row += 1) {
    const t = (y - y0) / span;
    const opacity = opts.opacityAt ? opts.opacityAt(t) : 0.95;
    if (opacity < 0.04) continue;
    const rr = r * (opts.radiusAt ? opts.radiusAt(t) : 1);
    const xOff = (row % 2) * stepX * 0.5;
    for (let x = -42; x <= 142; x += stepX) {
      out.push({ cx: x + xOff, cy: y, r: rr, fill, opacity });
    }
  }
}

/** D: 細いレーシング3本（ライン色 = secondary） */
export function buildThinTripleStripeDots(
  secondary: string,
  density: JerseyDotDensity = "coarse"
): JerseyStripeBand {
  const fill = liftHexForJerseyDisplay(secondary, JERSEY_STRIPE_LIFT);
  const dots: JerseyStripeDot[] = [];
  const stepX = density === "coarse" ? 3.6 : 2.8;
  const r = density === "coarse" ? 1.15 : 1.0;
  for (const y of [41.6, 49.6, 57.6]) {
    pushDotBand(dots, {
      y0: y,
      y1: y,
      stepX,
      stepY: 4,
      r,
      fill,
    });
  }
  return { rotateDeg: -32, cx: 44, cy: 52, dots };
}
