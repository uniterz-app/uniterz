/**
 * モバイル Web の MatchCard.tsx 下部 CTA の background（radial-gradient）に相当する
 * 横断カラー。RN は radial を描けないため、`t = 2 * |x - 0.5| で左右対称にサンプルする。
 *
 * - normalStyle: 未予想＆非 predicted（予想をする / 試合中 / 試合終了は同一の青 radial）
 * - predictedStyle: 予想済み帯
 */

type Rgb = { r: number; g: number; b: number; a: number };

function toRgba(c: Rgb): string {
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Number(
    c.a
  ).toFixed(3)})`;
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

function lerpRgbaStops(
  t: number,
  stops: Array<{ pos: number; c: Rgb }>
): string {
  if (t <= stops[0].pos) return toRgba(stops[0].c);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t <= b.pos) {
      const u = (t - a.pos) / (b.pos - a.pos);
      return toRgba({
        r: lerp(a.c.r, b.c.r, u),
        g: lerp(a.c.g, b.c.g, u),
        b: lerp(a.c.b, b.c.b, u),
        a: lerp(a.c.a, b.c.a, u),
      });
    }
  }
  return toRgba(stops[stops.length - 1].c);
}

/** MatchCard normalStyle の radial ストップ */
const MATCH_CARD_BLUE_RADIAL: Array<{ pos: number; c: Rgb }> = [
  { pos: 0, c: { r: 59, g: 130, b: 246, a: 0.92 } },
  { pos: 0.36, c: { r: 37, g: 99, b: 235, a: 0.88 } },
  { pos: 0.58, c: { r: 29, g: 78, b: 216, a: 0.58 } },
  { pos: 0.74, c: { r: 29, g: 78, b: 216, a: 0.2 } },
  { pos: 0.84, c: { r: 29, g: 78, b: 216, a: 0.05 } },
  { pos: 1, c: { r: 29, g: 78, b: 216, a: 0 } },
];

/** MatchCard predictedStyle の radial ストップ */
const MATCH_CARD_GRAY_RADIAL: Array<{ pos: number; c: Rgb }> = [
  { pos: 0, c: { r: 148, g: 163, b: 184, a: 0.22 } },
  { pos: 0.42, c: { r: 100, g: 116, b: 139, a: 0.14 } },
  { pos: 0.66, c: { r: 71, g: 85, b: 105, a: 0.06 } },
  { pos: 1, c: { r: 71, g: 85, b: 105, a: 0 } },
];

function buildSymmetricHorizontal(
  stops: Array<{ pos: number; c: Rgb }>,
  sampleN: number
): { colors: string[]; locations: number[] } {
  const n = Math.max(3, sampleN);
  const colors: string[] = [];
  const locations: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = i / (n - 1);
    const td = 2 * Math.abs(x - 0.5);
    colors.push(lerpRgbaStops(td, stops));
    locations.push(x);
  }
  return { colors, locations };
}

const SAMPLE = 11;

const blueCache = buildSymmetricHorizontal(MATCH_CARD_BLUE_RADIAL, SAMPLE);
const grayCache = buildSymmetricHorizontal(MATCH_CARD_GRAY_RADIAL, SAMPLE);

/**
 * 予想をする / 試合中 など、MatchCard `normalStyle` 相当
 */
export function getMatchCardBlueCtaLinearGradient() {
  return {
    colors: blueCache.colors as [string, string, ...string[]],
    locations: blueCache.locations as [number, number, ...number[]],
  };
}

/**
 * 予想済み、MatchCard `predictedStyle` 相当
 */
export function getMatchCardPredictedCtaLinearGradient() {
  return {
    colors: grayCache.colors as [string, string, ...string[]],
    locations: grayCache.locations as [number, number, ...number[]],
  };
}

/**
 * 縦方向に薄い円形感を足す（楕円 radial の高さ方向を雑に近似）
 */
export const MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY = {
  blue: {
    colors: [
      "rgba(2,4,8,0.4)",
      "rgba(80,150,255,0.1)",
      "rgba(2,4,8,0.4)",
    ] as const,
    locations: [0, 0.5, 1] as const,
  },
  gray: {
    colors: [
      "rgba(2,4,8,0.32)",
      "rgba(200,220,255,0.04)",
      "rgba(2,4,8,0.32)",
    ] as const,
    locations: [0, 0.5, 1] as const,
  },
} as const;
