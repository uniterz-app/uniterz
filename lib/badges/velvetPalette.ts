/**
 * バッジパレット背景 — 黒ベルベットのダイヤキルト + 金のパイピングとスタッド。
 * 模様は細め。パイルは弱く、金は主張しすぎない。
 */

export const VELVET_BASE = "#070707";
export const VELVET_TILE_W = 48;
export const VELVET_TILE_H = 48;
const SQRT2 = Math.SQRT2;
const PI = Math.PI;

function fract(x: number): number {
  return x - Math.floor(x);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function wrapIndex(i: number, period: number): number {
  return ((i % period) + period) % period;
}

function valueNoise(px: number, py: number, cell: number, periodPx: number): number {
  const cells = Math.max(1, Math.round(periodPx / cell));
  const sx = px / cell;
  const sy = py / cell;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(wrapIndex(ix, cells), wrapIndex(iy, cells));
  const b = hash2(wrapIndex(ix + 1, cells), wrapIndex(iy, cells));
  const c = hash2(wrapIndex(ix, cells), wrapIndex(iy + 1, cells));
  const d = hash2(wrapIndex(ix + 1, cells), wrapIndex(iy + 1, cells));
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
}

function lattice(
  rx: number,
  ry: number,
  ox: number,
  oy: number,
  span: number,
): { dx: number; dy: number; dist: number } {
  const fx = fract(rx / span + ox);
  const fy = fract(ry / span + oy);
  const nx = fx > 0.5 ? 1 : 0;
  const ny = fy > 0.5 ? 1 : 0;
  const dx = (fx - nx) * span;
  const dy = (fy - ny) * span;
  return { dx, dy, dist: Math.hypot(dx, dy) };
}

/** 1 ピクセル（0–255 sRGB） */
export function sampleVelvetTuft(px: number, py: number): [number, number, number] {
  const T = VELVET_TILE_W;
  const span = T / SQRT2;
  const rx = (px + py) / SQRT2;
  const ry = (py - px) / SQRT2;
  const fx = fract(rx / span);
  const fy = fract(ry / span);
  const peak = lattice(rx, ry, 0.5, 0.5, span);
  const stud = lattice(rx, ry, 0, 0, span);
  const maxD = 0.5 * span * SQRT2;
  const u = clamp(peak.dist / (maxD * 0.99), 0, 1);
  const h = Math.pow(0.5 + 0.5 * Math.cos(PI * u), 0.78);

  const pileDark = [9, 9, 10];
  const pileHigh = [28, 27, 26];
  let r = mix(pileDark[0], pileHigh[0], h * 0.7);
  let g = mix(pileDark[1], pileHigh[1], h * 0.7);
  let b = mix(pileDark[2], pileHigh[2], h * 0.7);

  const slope = Math.sin(PI * u) * 0.42;
  const inv = 1 / (peak.dist + 1.6);
  const ndotl = clamp(peak.dx * inv * slope * -0.26 + peak.dy * inv * slope * -0.58 + 0.78, 0.52, 1);
  r *= ndotl;
  g *= ndotl;
  b *= ndotl;

  const sheen = Math.pow(ndotl, 1.15) * h * 0.22;
  r += sheen * 14;
  g += sheen * 13;
  b += sheen * 12;

  const n1 = valueNoise(px, py, 1.35, T);
  const n2 = valueNoise(px + 11, py + 5, 0.7, T);
  const nap = 0.94 + n1 * 0.07 + n2 * 0.04;
  r *= nap;
  g *= nap;
  b *= nap * 0.99;

  const edgePx = Math.min(fx, 1 - fx, fy, 1 - fy) * span;
  const line = 1 - smoothstep(0.14, 0.48, edgePx);
  const gold = [186, 144, 52];
  const goldHi = [224, 194, 112];
  const lineMix = line * 0.78;
  r = mix(r, mix(gold[0], goldHi[0], ndotl), lineMix);
  g = mix(g, mix(gold[1], goldHi[1], ndotl), lineMix);
  b = mix(b, mix(gold[2], goldHi[2], ndotl), lineMix);

  const studMask = smoothstep(3.2, 1.5, stud.dist);
  if (studMask > 0.01) {
    const sph = clamp((-stud.dx * 0.38 - stud.dy * 0.72) / 3.2 + 0.58, 0.12, 1);
    const bead = [
      mix(140, 246, Math.pow(sph, 0.75)),
      mix(104, 214, Math.pow(sph, 0.75)),
      mix(34, 152, Math.pow(sph, 0.75)),
    ];
    r = mix(r, bead[0], studMask);
    g = mix(g, bead[1], studMask);
    b = mix(b, bead[2], studMask);
  }

  return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
}

/** Skia RuntimeEffect 用。sampleVelvetTuft と同じ形。 */
export const VELVET_TUFT_SKSL = `
uniform float2 u_tile;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

float wrapIndex(float i, float period) {
  return mod(mod(i, period) + period, period);
}

float vnoise(float2 xy, float cell, float period) {
  float cells = period / cell;
  float2 s = xy / cell;
  float2 i = floor(s);
  float2 f = fract(s);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(float2(wrapIndex(i.x, cells), wrapIndex(i.y, cells)));
  float b = hash(float2(wrapIndex(i.x + 1.0, cells), wrapIndex(i.y, cells)));
  float c = hash(float2(wrapIndex(i.x, cells), wrapIndex(i.y + 1.0, cells)));
  float d = hash(float2(wrapIndex(i.x + 1.0, cells), wrapIndex(i.y + 1.0, cells)));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

half4 main(float2 xy) {
  float T = u_tile.x;
  float SQRT2 = 1.41421356;
  float PI = 3.14159265;
  float span = T / SQRT2;
  float2 rxy = float2(xy.x + xy.y, xy.y - xy.x) / SQRT2;
  float2 f = fract(rxy / span);

  float2 fP = fract(rxy / span + float2(0.5));
  float2 nP = step(float2(0.5), fP);
  float2 vP = (fP - nP) * span;
  float dPeak = length(vP);

  float2 fS = fract(rxy / span);
  float2 nS = step(float2(0.5), fS);
  float2 vS = (fS - nS) * span;
  float dStud = length(vS);

  float maxD = 0.5 * span * SQRT2;
  float u = clamp(dPeak / (maxD * 0.99), 0.0, 1.0);
  float h = pow(0.5 + 0.5 * cos(PI * u), 0.78);

  float3 col = mix(float3(9.0, 9.0, 10.0), float3(28.0, 27.0, 26.0), h * 0.7) / 255.0;

  float slope = sin(PI * u) * 0.42;
  float inv = 1.0 / (dPeak + 1.6);
  float ndotl = clamp(vP.x * inv * slope * -0.26 + vP.y * inv * slope * -0.58 + 0.78, 0.52, 1.0);
  col *= ndotl;

  float sheen = pow(ndotl, 1.15) * h * 0.22;
  col += float3(14.0, 13.0, 12.0) / 255.0 * sheen;

  float nse = 0.94 + vnoise(xy, 1.35, T) * 0.07 + vnoise(xy + float2(11.0, 5.0), 0.7, T) * 0.04;
  col *= float3(nse, nse, nse * 0.99);

  float edgePx = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * span;
  float line = 1.0 - smoothstep(0.14, 0.48, edgePx);
  float3 gold = mix(float3(186.0, 144.0, 52.0), float3(224.0, 194.0, 112.0), ndotl) / 255.0;
  col = mix(col, gold, line * 0.78);

  float studMask = smoothstep(3.2, 1.5, dStud);
  float sph = clamp((-vS.x * 0.38 - vS.y * 0.72) / 3.2 + 0.58, 0.12, 1.0);
  float sp = pow(sph, 0.75);
  float3 bead = mix(float3(140.0, 104.0, 34.0), float3(246.0, 214.0, 152.0), sp) / 255.0;
  col = mix(col, bead, studMask);

  return half4(col, 1.0);
}
`;
