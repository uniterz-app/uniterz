/**
 * ジャージ mark 表示用の明度リフト（Web DotJerseyCanvas / Native jerseyHalftone 共用）。
 * 公式色そのものは変えず、暗い背景上での視認用に白へ混ぜる。
 */

export type JerseyRgb = { r: number; g: number; b: number };

/** 地色ドット向け（0〜1）。大きいほど明るい */
export const JERSEY_BODY_LIFT = 0.32;

/** 斜めライン向け */
export const JERSEY_STRIPE_LIFT = 0.28;

/** lift 上限（washed out 防止） */
export const JERSEY_LIFT_CAP = 0.42;

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

/** 白へ持ち上げ（ほぼ黒はグレー化を避けるためスキップ） */
export function liftRgbForJerseyDisplay(
  c: JerseyRgb,
  amount: number
): JerseyRgb {
  if (c.r <= 14 && c.g <= 14 && c.b <= 14) return c;
  const a = Math.max(0, Math.min(JERSEY_LIFT_CAP, amount));
  return {
    r: Math.min(255, Math.round(c.r + (255 - c.r) * a)),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * a)),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * a)),
  };
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
