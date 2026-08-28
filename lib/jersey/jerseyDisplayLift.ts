/**
 * ジャージ mark 表示用の明度調整（Web / Native 共用）。
 * 白混ぜはくすむので、HSL で明度だけ上げ・赤黄は彩度も保つ。
 */

export type JerseyRgb = { r: number; g: number; b: number };

/** 地色の明度ブースト（0〜1、HSL L への加算比率） */
export const JERSEY_BODY_LIFT = 0.1;

/** 斜めライン向け */
export const JERSEY_STRIPE_LIFT = 0.08;

/** 赤・黄の彩度ブースト（くすみ打ち消し） */
export const JERSEY_WARM_SAT_BOOST = 0.14;

/** 黄色だけ追加の彩度ブースト（赤は触らない） */
export const JERSEY_YELLOW_SAT_BOOST = 0.22;

const DEFAULT_RGB: JerseyRgb = { r: 34, g: 211, b: 238 };

export function parseJerseyHexToRgb(accent: string): JerseyRgb {
  const hex = accent.trim().replace(/^#/, "");
  let r = DEFAULT_RGB.r;
  let g = DEFAULT_RGB.g;
  let b = DEFAULT_RGB.b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_RGB };
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_RGB };
  }
  return { r, g, b };
}

export function jerseyRgbToCss({ r, g, b }: JerseyRgb): string {
  return `rgb(${r},${g},${b})`;
}

export function jerseyRgbToHex({ r, g, b }: JerseyRgb): string {
  const h = (n: number) =>
    Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): JerseyRgb {
  if (s <= 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hh = ((h % 360) + 360) % 360 / 360;
  return {
    r: Math.round(hue2rgb(p, q, hh + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hh) * 255),
    b: Math.round(hue2rgb(p, q, hh - 1 / 3) * 255),
  };
}

/** 赤〜黄（暖色）かどうか */
function isWarmHue(h: number): boolean {
  return h <= 72 || h >= 345;
}

/** ゴールド〜黄（赤・朱色は除外） */
function isYellowHue(h: number): boolean {
  return h >= 32 && h <= 70;
}

/**
 * 明度を上げつつ、暖色は彩度も上げてくすみを抑える。
 * 白混ぜは使わない（赤・黄がグレーに寄るため）。
 */
export function liftRgbForJerseyDisplay(
  c: JerseyRgb,
  amount: number
): JerseyRgb {
  if (c.r <= 14 && c.g <= 14 && c.b <= 14) return c;
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  const warm = isWarmHue(h) && s > 0.25;
  const yellow = isYellowHue(h) && s > 0.25;
  const lift = Math.max(0, Math.min(0.22, amount));
  // すでに明るい黄は明度を上げすぎないが、くすみ対策で黄は赤より少し上げる
  const lBoost = yellow
    ? lift * (l > 0.55 ? 0.7 : 0.95)
    : warm
      ? lift * (l > 0.55 ? 0.45 : 0.75)
      : lift;
  let nextL = Math.min(yellow ? 0.78 : 0.72, l + (1 - l) * lBoost);
  let nextS = s;
  let nextH = h;
  if (warm) {
    nextS = Math.min(1, s + JERSEY_WARM_SAT_BOOST * (1 - s * 0.35));
    // 赤はさらに少し彩度優先（真っ赤寄り）— 現状キープ
    if (h <= 28 || h >= 345) {
      nextS = Math.min(1, nextS + 0.06);
    }
  }
  if (yellow) {
    nextS = Math.min(1, nextS + JERSEY_YELLOW_SAT_BOOST * (1 - nextS * 0.2));
    // オレンジ寄りゴールドを純粋な黄へ少し寄せる
    if (h < 48) nextH = h + Math.min(10, (48 - h) * 0.55);
    else if (h > 56) nextH = h - Math.min(6, (h - 56) * 0.4);
  }
  return hslToRgb(nextH, nextS, nextL);
}

export function liftHexForJerseyDisplay(hex: string, amount: number): string {
  return jerseyRgbToHex(
    liftRgbForJerseyDisplay(parseJerseyHexToRgb(hex), amount)
  );
}

export function blendAccentForJerseyDots(accent: string): string {
  return jerseyRgbToCss(
    liftRgbForJerseyDisplay(parseJerseyHexToRgb(accent), JERSEY_BODY_LIFT)
  );
}
