/**
 * ダーク前提で書かれた色リテラルをライト（シアンミスト地）用に写す。
 *
 * - 背景級の黒 → `LIGHT_THEME_BG`（#DCE5E5）
 * - 少し明るい面（カード）→ 背景より一段明るい薄グレー（真っ白にはしない。まぶしさ対策）
 * - 白文字・明るいグレー → 墨（#122022）寄り
 * - 彩度の高いネオン → 同じ色相で暗く（白地で読める濃さ）
 *
 * アルファは保つ。OKLab で明度だけ写し、色相は変えない。
 */

export const LIGHT_THEME_BG = "#DCE5E5";
export const LIGHT_THEME_INK = "#122022";

export type LightThemeColorRole = "shadow" | "glow" | undefined;

type Rgba = { r: number; g: number; b: number; a: number };
type ColorFormat = "hex" | "hex-alpha" | "rgb" | "rgba";

const NAMED: Record<string, Rgba> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  gray: { r: 128, g: 128, b: 128, a: 1 },
  grey: { r: 128, g: 128, b: 128, a: 1 },
};

function parseColor(input: string): { rgba: Rgba; format: ColorFormat } | null {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    const h = s.slice(1);
    if (!/^[0-9a-f]+$/.test(h)) return null;
    if (h.length === 3 || h.length === 4) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
      return { rgba: { r, g, b, a }, format: h.length === 4 ? "hex-alpha" : "hex" };
    }
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return { rgba: { r, g, b, a }, format: h.length === 8 ? "hex-alpha" : "hex" };
    }
    return null;
  }
  const m = s.match(/^rgba?\(\s*([^)]*)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = (p: string) =>
      p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p);
    const r = ch(parts[0]);
    const g = ch(parts[1]);
    const b = ch(parts[2]);
    let a = 1;
    if (parts[3] != null) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    }
    if ([r, g, b, a].some((v) => !Number.isFinite(v))) return null;
    return { rgba: { r, g, b, a }, format: parts.length > 3 ? "rgba" : "rgb" };
  }
  const named = NAMED[s];
  if (named) return { rgba: { ...named }, format: "hex" };
  return null;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  const e = 1e-4;
  return r >= -e && r <= 1 + e && g >= -e && g <= 1 + e && b >= -e && b <= 1 + e;
}

/** 明度と色相を保ったまま彩度を落として sRGB に収める */
function oklchToRgb(L: number, C: number, h: number): { r: number; g: number; b: number } {
  let lo = 0;
  let hi = C;
  let lin = oklabToLinear(L, C * Math.cos(h), C * Math.sin(h));
  if (!inGamut(lin)) {
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      const t = oklabToLinear(L, mid * Math.cos(h), mid * Math.sin(h));
      if (inGamut(t)) lo = mid;
      else hi = mid;
    }
    lin = oklabToLinear(L, lo * Math.cos(h), lo * Math.sin(h));
  }
  const clamp = (v: number) => Math.min(255, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v)))));
  return { r: clamp(lin[0]), g: clamp(lin[1]), b: clamp(lin[2]) };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const [BG_L, BG_A, BG_B] = rgbToOklab(0xdc, 0xe5, 0xe5);
/** カード等の上限。背景 0.915 から +0.04 */
const SURFACE_MAX_L = 0.955;
/** 中間グレー（枠線など）の起点。背景との差を旧配色と同じ 0.085 に保つ */
const MID_SURFACE_L = 0.83;
const [INK_L] = rgbToOklab(0x12, 0x20, 0x22);
const MIST_HUE = Math.atan2(BG_B, BG_A);
const MIST_CHROMA = Math.hypot(BG_A, BG_B);

/** 無彩色・暗い有彩色（面）用の明度写像 */
function mapSurfaceLightness(L: number): number {
  if (L <= 0.3) return lerp(BG_L, SURFACE_MAX_L, smoothstep(0.15, 0.3, L));
  return lerp(MID_SURFACE_L, INK_L, (L - 0.3) / 0.7);
}

/** 明るい有彩色（ネオン文字・アクセント）用 */
function mapAccentLightness(L: number): number {
  return Math.min(0.62, Math.max(0.4, 1.02 - 0.6 * L));
}

function toLightRgba(c: Rgba, role: LightThemeColorRole): Rgba {
  const [L, A, B] = rgbToOklab(c.r, c.g, c.b);
  const C = Math.hypot(A, B);
  const h = Math.atan2(B, A);

  if (role === "shadow" && C < 0.04) return c;

  const accentW = smoothstep(0.04, 0.1, C) * smoothstep(0.4, 0.55, L);
  const surfaceL = mapSurfaceLightness(L);
  const outL = lerp(surfaceL, mapAccentLightness(L), accentW);

  let outC: number;
  let outH: number;
  if (C < 0.02) {
    outH = MIST_HUE;
    outC = outL > 0.8 ? MIST_CHROMA : MIST_CHROMA * 1.2;
  } else {
    outH = h;
    const surfaceC = Math.min(C, outL > 0.85 ? 0.035 : 0.08);
    outC = lerp(surfaceC, C, accentW);
  }

  const rgb = oklchToRgb(outL, outC, outH);
  let a = c.a;
  if (role === "glow" || (role === "shadow" && C >= 0.04)) a *= 0.3;
  return { ...rgb, a };
}

function hex2(n: number): string {
  return Math.round(n).toString(16).padStart(2, "0");
}

function formatColor(c: Rgba, format: ColorFormat): string {
  const r = Math.round(c.r);
  const g = Math.round(c.g);
  const b = Math.round(c.b);
  if (format === "hex") return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  if (format === "hex-alpha") return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(c.a * 255)}`;
  if (format === "rgb") return `rgb(${r},${g},${b})`;
  return `rgba(${r},${g},${b},${Math.round(c.a * 1000) / 1000})`;
}

/** 解釈できない文字列（`transparent` など）はそのまま返す */
export function toLightThemeColor(input: string, role?: LightThemeColorRole): string {
  if (typeof input !== "string") return input;
  const parsed = parseColor(input);
  if (!parsed) return input;
  if (parsed.rgba.a === 0) return input;
  const out = toLightRgba(parsed.rgba, role);
  let format = parsed.format;
  if (out.a !== parsed.rgba.a) {
    if (format === "hex") format = "hex-alpha";
    else if (format === "rgb") format = "rgba";
  }
  return formatColor(out, format);
}
