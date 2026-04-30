/**
 * app/component/games/DotJerseyCanvas のドット幾何・色計算を揃えた（マスク内判定は SVG の clipPath に委任）
 */

export const JERSEY_PATH_D =
  "m22.75 0-4.04.87c.38 11.69 1.28 23.92.73 34.59-.58 11.33-2.59 21.12-9.56 26.67v52.75h68V62.13c-6.97-5.55-8.98-15.35-9.56-26.67-.55-10.67.35-22.9.73-34.59L65.01 0c-.32 5.52-1.54 11.51-4.21 16.56-3.14 5.94-8.78 10.82-16.91 10.82S30.12 22.5 26.98 16.56C24.31 11.5 23.09 5.52 22.77 0Zm5.29.83c.41 4.8 1.57 9.87 3.69 13.87 2.67 5.06 6.34 8.18 12.15 8.18s9.47-3.12 12.15-8.18c2.12-4 3.28-9.07 3.69-13.87-6.86 2.92-11.19 4.55-15.84 4.55S34.9 3.75 28.04.83M13.51 1.98l-4.18.9c.12 9.41 1.1 19.73.55 29.35C9.3 42.11 7.03 51.38 0 57.95v56.93h4.65V60.06l.99-.68c5.46-3.8 7.99-12.7 8.57-24.12.52-10.03-.29-21.78-.7-33.28m60.74 0c-.41 11.49-1.22 23.25-.7 33.28.58 11.42 3.11 20.33 8.57 24.12l.99.68v54.82h4.65V57.95c-7.03-6.58-9.3-15.85-9.88-25.72-.55-9.62.44-19.95.55-29.35z";

/** Webの DotJerseyCanvas と同じ */
export const VIEWBOX_W = 87.76;
export const VIEWBOX_H = 114.88;

type Rgb = { r: number; g: number; b: number };

const DEFAULT_ACCENT_RGB: Rgb = { r: 34, g: 211, b: 238 };

/** HalftoneJerseyMark の drop-shadow 用 */
const DEFAULT_GLOW: Rgb = { r: 34, g: 211, b: 238 };

function accentRgbForGlowSingle(accent: string): Rgb {
  const hex = accent.trim().replace(/^#/, "");
  let r = DEFAULT_GLOW.r;
  let g = DEFAULT_GLOW.g;
  let b = DEFAULT_GLOW.b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_GLOW };
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_GLOW };
  }
  return { r, g, b };
}

/** 外枠の光彩（主色＋副色の中間） */
export function accentRgbForJerseyGlow(
  accent: string,
  accentEnd?: string
): Rgb {
  const a = accentRgbForGlowSingle(accent);
  if (!accentEnd) return a;
  const b = accentRgbForGlowSingle(accentEnd);
  if (a.r === b.r && a.g === b.g && a.b === b.b) return a;
  return {
    r: Math.round((a.r + b.r) / 2),
    g: Math.round((a.g + b.g) / 2),
    b: Math.round((a.b + b.b) / 2),
  };
}

function parseHexToRgb(accent: string): Rgb {
  const hex = accent.trim().replace(/^#/, "");
  let r = DEFAULT_ACCENT_RGB.r;
  let g = DEFAULT_ACCENT_RGB.g;
  let b = DEFAULT_ACCENT_RGB.b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_ACCENT_RGB };
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_ACCENT_RGB };
  }
  return { r, g, b };
}

function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${r},${g},${b})`;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const u = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  };
}

function liftRgbForDisplay(c: Rgb, amount: number): Rgb {
  const a = Math.max(0, Math.min(0.28, amount));
  return {
    r: Math.min(255, Math.round(c.r + (255 - c.r) * a)),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * a)),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * a)),
  };
}

function blendAccentForDots(accent: string): string {
  return rgbToCss(liftRgbForDisplay(parseHexToRgb(accent), 0.1));
}

function normalizeHexKey(s: string): string {
  return s.trim().replace(/^#/, "").toLowerCase();
}

function useJerseyGradient(accent: string, accentEnd?: string): boolean {
  if (!accentEnd) return false;
  return normalizeHexKey(accent) !== normalizeHexKey(accentEnd);
}

/** 擬似ライト */
function halftoneShade01(vbx: number, vby: number): number {
  const nx = vbx / VIEWBOX_W - 0.5;
  const ny = vby / VIEWBOX_H - 0.42;
  const d = Math.hypot(nx * 1.15, ny);
  let t = 0.58 + 0.42 * Math.max(0, Math.min(1, 1 - d * 1.55));
  t += 0.07 * Math.sin(vbx * 0.35) * Math.cos(vby * 0.22);
  return Math.max(0.34, Math.min(1, t));
}

export type JerseyHalftoneDot = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
};

/**
 * 正方形 `size` px のコントロール用に、viewBox 座標のドット配列を生成
 */
export function buildJerseyHalftoneDotList(
  cssSize: number,
  accent: string,
  accentEnd?: string
): JerseyHalftoneDot[] {
  const pad = 6;
  const cssW = cssSize;
  const cssH = cssSize;
  if (cssW < 2 || cssH < 2) return [];

  const s = Math.min(
    (cssW - pad * 2) / VIEWBOX_W,
    (cssH - pad * 2) / VIEWBOX_H
  );
  const step = Math.max(2.4, Math.min(3.6, cssW * 0.028));
  const rMin = step * 0.17;
  const rMax = step * 0.46;
  const gradientMode = useJerseyGradient(accent, accentEnd);

  const resolvedSingleDotColor = gradientMode
    ? null
    : blendAccentForDots(accent);

  const gradientRgb =
    gradientMode && accentEnd
      ? { start: parseHexToRgb(accent), end: parseHexToRgb(accentEnd) }
      : null;

  const dots: JerseyHalftoneDot[] = [];
  // Web と同じ：デバイス座標ループ
  const ox = (cssW - VIEWBOX_W * s) / 2;
  const oy = (cssH - VIEWBOX_H * s) / 2;
  for (let gy = oy + step * 0.5; gy < oy + VIEWBOX_H * s; gy += step) {
    for (let gx = ox + step * 0.5; gx < ox + VIEWBOX_W * s; gx += step) {
      const vbx = (gx - ox) / s;
      const vby = (gy - oy) / s;
      if (vbx < 0 || vbx > VIEWBOX_W || vby < 0 || vby > VIEWBOX_H) continue;

      const shade = halftoneShade01(vbx, vby);
      const r = (rMin + shade * (rMax - rMin)) / s;

      let fill: string;
      if (gradientRgb) {
        const tBase = 0.32 * (vbx / VIEWBOX_W) + 0.68 * (vby / VIEWBOX_H);
        const t = Math.max(
          0,
          Math.min(1, tBase * 0.88 + (shade - 0.5) * 0.14)
        );
        const c = liftRgbForDisplay(lerpRgb(gradientRgb.start, gradientRgb.end, t), 0.09);
        fill = rgbToCss(c);
      } else {
        fill = resolvedSingleDotColor ?? blendAccentForDots(accent);
      }
      dots.push({ cx: vbx, cy: vby, r, fill });
    }
  }
  return dots;
}

/** 縁用：Web `Math.max(1.1, 2.1 / (dpr * s))`（viewBox 座標） */
export function jerseyStrokeWidthForSize(cssSize: number): number {
  const pad = 6;
  if (cssSize < 2) return 1.1;
  const s = Math.min(
    (cssSize - pad * 2) / VIEWBOX_W,
    (cssSize - pad * 2) / VIEWBOX_H
  );
  const dpr = 2;
  return Math.max(1.1, 2.1 / (dpr * s));
}
