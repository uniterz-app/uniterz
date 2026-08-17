/**
 * PRO 背景 — 宇宙テーマ 20 案（模様パターン再設計）
 * atmos / scale / beast と同じ配置思想:
 * 疎な図形・中央空け・右下〜端に寄せ・微細 HUD
 */

import type { ProfilePlanProCosmosBgVariant } from "./profilePlanProCosmosBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;

export const PROFILE_PLAN_PRO_COSMOS_OPACITY_SCALE = 2.15;

type CosmosPalette = {
  strokes: readonly string[];
  fills: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProCosmosBgVariant, CosmosPalette> = {
  "cosmos-event-horizon": {
    strokes: ["99,102,241", "67,56,202", "139,92,246", "49,46,129"],
    fills: ["18,16,42", "30,27,75", "10,8,28"],
    accent: ["165,180,252", "129,140,248"],
    hudPrimary: "rgba(129,140,248,",
    hudSecondary: "rgba(67,56,202,",
    opacityMul: 1.95,
  },
  "cosmos-nebula-crown": {
    strokes: ["167,139,250", "96,165,250", "192,132,252", "59,130,246"],
    fills: ["46,16,101", "30,58,138", "24,12,60"],
    accent: ["216,180,254", "147,197,253"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(96,165,250,",
    opacityMul: 2.0,
  },
  "cosmos-stellar-drift": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "226,232,240"],
    fills: ["30,41,59", "51,65,85", "15,23,42"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.9,
  },
  "cosmos-cosmic-rift": {
    strokes: ["129,140,248", "167,139,250", "79,70,229", "192,132,252"],
    fills: ["49,46,129", "76,29,149", "30,27,75"],
    accent: ["199,210,254", "216,180,254"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(99,102,241,",
    opacityMul: 2.05,
  },
  "cosmos-lunar-eclipse": {
    strokes: ["220,38,38", "185,28,28", "248,113,113", "127,29,29"],
    fills: ["69,10,10", "90,20,20", "40,6,6"],
    accent: ["252,165,165", "254,202,202"],
    hudPrimary: "rgba(248,113,113,",
    hudSecondary: "rgba(185,28,28,",
    opacityMul: 1.95,
  },
  "cosmos-solar-flare": {
    strokes: ["251,191,36", "245,158,11", "253,224,71", "217,119,6"],
    fills: ["69,26,3", "120,53,15", "40,20,4"],
    accent: ["254,243,199", "253,230,138"],
    hudPrimary: "rgba(251,191,36,",
    hudSecondary: "rgba(245,158,11,",
    opacityMul: 2.0,
  },
  "cosmos-deep-space-core": {
    strokes: ["125,211,252", "186,230,253", "56,189,248", "14,165,233"],
    fills: ["12,48,72", "8,32,55", "4,20,40"],
    accent: ["224,242,254", "165,243,252"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 2.05,
  },
  "cosmos-galactic-halo": {
    strokes: ["196,181,253", "165,180,252", "167,139,250", "129,140,248"],
    fills: ["40,28,80", "30,27,75", "20,16,50"],
    accent: ["237,233,254", "199,210,254"],
    hudPrimary: "rgba(196,181,253,",
    hudSecondary: "rgba(165,180,252,",
    opacityMul: 1.95,
  },
  "cosmos-void-signal": {
    strokes: ["34,211,238", "103,232,249", "6,182,212", "165,243,252"],
    fills: ["8,40,48", "12,55,60", "4,28,34"],
    accent: ["207,250,254", "153,246,228"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(6,182,212,",
    opacityMul: 2.1,
  },
  "cosmos-starforge": {
    strokes: ["59,130,246", "251,191,36", "96,165,250", "245,158,11"],
    fills: ["20,40,80", "60,35,10", "12,28,60"],
    accent: ["191,219,254", "253,224,71"],
    hudPrimary: "rgba(96,165,250,",
    hudSecondary: "rgba(251,191,36,",
    opacityMul: 2.0,
  },
  "cosmos-nova-pulse": {
    strokes: ["244,114,182", "251,113,133", "232,121,249", "253,164,175"],
    fills: ["60,20,50", "80,25,55", "35,10,35"],
    accent: ["251,207,232", "254,226,226"],
    hudPrimary: "rgba(244,114,182,",
    hudSecondary: "rgba(232,121,249,",
    opacityMul: 1.95,
  },
  "cosmos-aurora-orbit": {
    strokes: ["52,211,153", "129,140,248", "34,211,238", "167,139,250"],
    fills: ["10,45,40", "25,30,70", "8,35,50"],
    accent: ["167,243,208", "199,210,254"],
    hudPrimary: "rgba(52,211,153,",
    hudSecondary: "rgba(129,140,248,",
    opacityMul: 2.0,
  },
  "cosmos-dark-matter": {
    strokes: ["71,85,105", "100,116,139", "51,65,85", "148,163,184"],
    fills: ["20,24,35", "35,40,52", "12,14,22"],
    accent: ["148,163,184", "100,116,139"],
    hudPrimary: "rgba(100,116,139,",
    hudSecondary: "rgba(71,85,105,",
    opacityMul: 1.75,
  },
  "cosmos-comet-trail": {
    strokes: ["56,189,248", "125,211,252", "226,232,240", "14,165,233"],
    fills: ["10,35,60", "20,50,75", "6,22,45"],
    accent: ["240,249,255", "186,230,253"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 2.05,
  },
  "cosmos-celestial-grid": {
    strokes: ["56,189,248", "148,163,184", "103,232,249", "100,116,139"],
    fills: ["15,30,50", "25,40,60", "8,20,35"],
    accent: ["186,230,253", "203,213,225"],
    hudPrimary: "rgba(56,189,248,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.9,
  },
  "cosmos-quantum-nebula": {
    strokes: ["167,139,250", "34,211,238", "236,72,153", "103,232,249"],
    fills: ["40,18,70", "12,45,60", "55,18,50"],
    accent: ["216,180,254", "165,243,252"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(34,211,238,",
    opacityMul: 2.05,
  },
  "cosmos-meteor-veil": {
    strokes: ["203,213,225", "148,163,184", "226,232,240", "100,116,139"],
    fills: ["30,35,48", "45,52,65", "18,22,32"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.9,
  },
  "cosmos-orbital-throne": {
    strokes: ["212,168,40", "180,140,30", "234,179,8", "161,128,40"],
    fills: ["45,35,12", "60,45,16", "28,20,8"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
    opacityMul: 2.0,
  },
  "cosmos-singularity-vein": {
    strokes: ["168,85,247", "192,132,252", "126,34,206", "216,180,254"],
    fills: ["40,12,65", "55,18,85", "24,8,48"],
    accent: ["233,213,255", "196,181,253"],
    hudPrimary: "rgba(192,132,252,",
    hudSecondary: "rgba(168,85,247,",
    opacityMul: 2.05,
  },
  "cosmos-archive": {
    strokes: ["103,232,249", "167,139,250", "125,211,252", "196,181,253"],
    fills: ["14,35,55", "35,22,60", "10,25,45"],
    accent: ["165,243,252", "216,180,254"],
    hudPrimary: "rgba(103,232,249,",
    hudSecondary: "rgba(167,139,250,",
    opacityMul: 1.95,
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function cosmosOp(raw: number): number {
  return Math.min(
    1,
    Math.round(
      raw * PROFILE_PLAN_PRO_COSMOS_OPACITY_SCALE * activeOpacityMul * 1000
    ) / 1000
  );
}

/** 右・下・隅に寄せ、中央（カード内容）は空ける */
function densityAt(nx: number, ny: number): number {
  const right = Math.pow(nx, 1.5);
  const bottom = Math.pow(ny, 1.7);
  const topRight = Math.max(0, 1 - Math.hypot((nx - 1) * 1.15, (ny - 0.02) * 1.15));
  const rightMid = Math.max(0, 1 - Math.hypot((nx - 1) * 1.0, (ny - 0.5) * 1.5));
  const holeDist = ((nx - 0.34) ** 2) / 0.05 + ((ny - 0.42) ** 2) / 0.14;
  const centerFactor = Math.min(1, 0.22 + holeDist);
  return Math.min(
    1.4,
    (right * 0.55 + bottom * 0.5 + topRight * 0.65 + rightMid * 0.42) *
      centerFactor
  );
}

function pick<T>(arr: readonly T[], a: number, b: number): T {
  return arr[Math.floor(hash01(a, b) * arr.length) % arr.length]!;
}

function wrapSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">${body}</svg>`;
}

function toUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const urlCache = new Map<string, string>();
const svgCache = new Map<string, string>();

function cachedUrl(key: string, build: () => string): string {
  const hit = urlCache.get(key);
  if (hit !== undefined) return hit;
  const url = toUrl(build());
  urlCache.set(key, url);
  return url;
}

function cachedSvg(key: string, build: () => string): string {
  const hit = svgCache.get(key);
  if (hit !== undefined) return hit;
  const svg = build();
  svgCache.set(key, svg);
  return svg;
}

function place(
  nx: number,
  ny: number,
  densMul: number,
  seed: number
): boolean {
  return hash01(seed, densMul) <= densityAt(nx, ny) * densMul;
}

/* ─── 模様ユニット ─── */

/** 1. Event Horizon — 歪んだ弧タイル（重力レンズ模様） */
function buildEventHorizon(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    const nx = 0.4 + hash01(i * 1.7, 1.2) * 0.62;
    const ny = hash01(i * 1.9, 3.1);
    if (!place(nx, ny, 0.92, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 8 + hash01(i, 4) * 16;
    const a0 = hash01(i, 5) * Math.PI * 2;
    const sweep = Math.PI * (0.35 + hash01(i, 6) * 0.55);
    const a1 = a0 + sweep;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r * (0.65 + hash01(i, 7) * 0.25);
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r * (0.65 + hash01(i, 8) * 0.25);
    const large = sweep > Math.PI ? 1 : 0;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r.toFixed(1)} ${(r * 0.72).toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.14 + hash01(i, 9) * 0.1).toFixed(3)})" stroke-width="${(0.7 + hash01(i, 10) * 0.7).toFixed(2)}" stroke-linecap="round"/>`
    );
    if (hash01(i, 11) > 0.55) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.2" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.12).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 2. Nebula Crown — 尖った花弁／山形タイル */
function buildNebulaCrown(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 32; i += 1) {
    const nx = 0.38 + hash01(i * 2.0, 1.4) * 0.64;
    const ny = hash01(i * 1.6, 3.4);
    if (!place(nx, ny, 0.88, i + 2)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const w = 10 + hash01(i, 4) * 16;
    const h = 14 + hash01(i, 5) * 18;
    const rot = ((hash01(i, 6) - 0.5) * 40).toFixed(1);
    const d = [
      `M0 ${(-h / 2).toFixed(1)}`,
      `L${(w / 2).toFixed(1)} ${(h * 0.15).toFixed(1)}`,
      `L${(w * 0.18).toFixed(1)} ${(h / 2).toFixed(1)}`,
      `L${(-w * 0.18).toFixed(1)} ${(h / 2).toFixed(1)}`,
      `L${(-w / 2).toFixed(1)} ${(h * 0.15).toFixed(1)}`,
      "Z",
    ].join(" ");
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.08 + hash01(i, 7) * 0.07).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.14 + hash01(i, 8) * 0.08).toFixed(3)})" stroke-width="0.75"/>` +
        `<line x1="0" y1="${(-h * 0.2).toFixed(1)}" x2="0" y2="${(h * 0.25).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.45"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 3. Stellar Drift — 斜めダッシュ織り（星屑の目） */
function buildStellarDrift(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 64; i += 1) {
    const nx = 0.36 + hash01(i * 1.5, 1.1) * 0.66;
    const ny = hash01(i * 2.2, 2.8);
    if (!place(nx, ny, 0.95, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 5 + hash01(i, 3) * 14;
    const ang = -0.4 + (hash01(i, 4) - 0.5) * 0.18;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ang) * len).toFixed(1)}" y2="${(y + Math.sin(ang) * len).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.1 + hash01(i, 5) * 0.12).toFixed(3)})" stroke-width="${(0.45 + hash01(i, 6) * 0.7).toFixed(2)}" stroke-linecap="round"/>`
    );
    if (hash01(i, 7) > 0.7) {
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + hash01(i, 8)).toFixed(1)}" fill="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.16).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 4. Cosmic Rift — ジグザグ亀裂プレート */
function buildCosmicRift(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.9, i + 3)) continue;
    let x = nx * CANVAS_W;
    let y = ny * CANVAS_H;
    let a = Math.PI * (0.35 + hash01(i, 3) * 0.4);
    for (let s = 0; s < 5; s += 1) {
      const len = 8 + hash01(i, s + 4) * 12;
      const nx2 = x + Math.cos(a) * len;
      const ny2 = y + Math.sin(a) * len;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${nx2.toFixed(1)}" y2="${ny2.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, s)},${cosmosOp(0.16 - s * 0.015).toFixed(3)})" stroke-width="${(1.3 - s * 0.12).toFixed(2)}" stroke-linecap="round"/>`
      );
      if (s < 3 && hash01(i, s + 10) > 0.5) {
        const ba = a + (hash01(i, s + 11) > 0.5 ? 0.85 : -0.85);
        parts.push(
          `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ba) * len * 0.4).toFixed(1)}" y2="${(y + Math.sin(ba) * len * 0.4).toFixed(1)}" stroke="rgba(${pick(p.accent, i, s)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.65"/>`
        );
      }
      x = nx2;
      y = ny2;
      a += (hash01(i, s + 12) - 0.5) * 1.1;
    }
  }
  return wrapSvg(parts.join(""));
}

/** 5. Lunar Eclipse — 三日月タイル */
function buildLunarEclipse(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.4 + hash01(i * 1.8, 1.3) * 0.62;
    const ny = hash01(i * 2.0, 3.2);
    if (!place(nx, ny, 0.88, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 7 + hash01(i, 4) * 12;
    const rot = ((hash01(i, 5) - 0.5) * 60).toFixed(1);
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.1).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.16).toFixed(3)})" stroke-width="0.7"/>` +
        `<circle cx="${(r * 0.45).toFixed(1)}" cy="${(-r * 0.12).toFixed(1)}" r="${(r * 0.85).toFixed(1)}" fill="rgba(2,0,0,${cosmosOp(0.35).toFixed(3)})"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 6. Solar Flare — 放射ブレードタイル */
function buildSolarFlare(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 34; i += 1) {
    const nx = 0.42 + hash01(i * 1.6, 1.2) * 0.6;
    const ny = hash01(i * 1.9, 3.0);
    if (!place(nx, ny, 0.9, i + 1)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const len = 12 + hash01(i, 4) * 22;
    const w = 3 + hash01(i, 5) * 4;
    const rot = ((hash01(i, 6) - 0.15) * 100).toFixed(1);
    const d = `M0 ${(-len / 2).toFixed(1)} L${(w / 2).toFixed(1)} ${(len / 2).toFixed(1)} L${(-w / 2).toFixed(1)} ${(len / 2).toFixed(1)} Z`;
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.09).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.15 + hash01(i, 7) * 0.08).toFixed(3)})" stroke-width="0.65"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 7. Deep Space Core — 六角セル模様 */
function buildDeepSpaceCore(p: CosmosPalette): string {
  const parts: string[] = [];
  const R = 11;
  for (let row = 0; row < 14; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const nx = 0.42 + col * 0.08 + (row % 2) * 0.04;
      const ny = 0.06 + row * 0.07;
      if (nx > 1.02 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.85, row * 10 + col)) continue;
      const cx = Math.min(CANVAS_W - 4, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      const pts: string[] = [];
      for (let k = 0; k < 6; k += 1) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        pts.push(
          `${(cx + Math.cos(a) * R).toFixed(1)},${(cy + Math.sin(a) * R).toFixed(1)}`
        );
      }
      parts.push(
        `<polygon points="${pts.join(" ")}" fill="rgba(${pick(p.fills, row, col)},${cosmosOp(0.07).toFixed(3)})" stroke="rgba(${pick(p.strokes, col, row)},${cosmosOp(0.13).toFixed(3)})" stroke-width="0.65"/>`
      );
      if (hash01(row, col + 3) > 0.65) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.4" fill="rgba(${pick(p.accent, row, col)},${cosmosOp(0.18).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 8. Galactic Halo — 弧セグメントの帯模様 */
function buildGalacticHalo(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    const nx = 0.4 + hash01(i * 1.7, 1.1) * 0.62;
    const ny = hash01(i * 2.1, 3.3);
    if (!place(nx, ny, 0.88, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rx = 12 + hash01(i, 4) * 20;
    const ry = 4 + hash01(i, 5) * 7;
    const rot = ((hash01(i, 6) - 0.5) * 50).toFixed(1);
    const a0 = hash01(i, 7) * Math.PI;
    const sweep = Math.PI * (0.4 + hash01(i, 8) * 0.7);
    const a1 = a0 + sweep;
    const x1 = Math.cos(a0) * rx;
    const y1 = Math.sin(a0) * ry;
    const x2 = Math.cos(a1) * rx;
    const y2 = Math.sin(a1) * ry;
    const large = sweep > Math.PI ? 1 : 0;
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.14).toFixed(3)})" stroke-width="0.85" stroke-linecap="round"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 9. Void Signal — ダッシュ＋ノードの通信模様 */
function buildVoidSignal(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 16; row += 1) {
    const ny = 0.08 + row * 0.058;
    let x = CANVAS_W * (0.42 + hash01(row, 1) * 0.08);
    const y = ny * CANVAS_H;
    for (let i = 0; i < 6; i += 1) {
      const nx = x / CANVAS_W;
      if (!place(nx, ny, 0.9, row * 8 + i)) {
        x += 10 + hash01(row, i) * 14;
        continue;
      }
      const isDash = hash01(row, i + 2) > 0.35;
      if (isDash) {
        const len = 6 + hash01(row, i + 3) * 12;
        parts.push(
          `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(${pick(p.strokes, row, i)},${cosmosOp(0.15).toFixed(3)})" stroke-width="1.05" stroke-linecap="round"/>`
        );
        x += len + 4;
      } else {
        parts.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7" fill="rgba(${pick(p.accent, row, i)},${cosmosOp(0.18).toFixed(3)})"/>`
        );
        x += 8;
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 10. Starforge — 菱形プレート＋火花クロス */
function buildStarforge(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.4 + hash01(i * 1.9, 1.3) * 0.62;
    const ny = hash01(i * 1.7, 3.5);
    if (!place(nx, ny, 0.88, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 8 + hash01(i, 4) * 12;
    const rot = ((hash01(i, 5) - 0.5) * 30).toFixed(1);
    const d = `M0 ${(-s).toFixed(1)} L${s.toFixed(1)} 0 L0 ${s.toFixed(1)} L${(-s).toFixed(1)} 0 Z`;
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.09).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.15).toFixed(3)})" stroke-width="0.75"/>` +
        `<line x1="${(-s * 0.35).toFixed(1)}" y1="0" x2="${(s * 0.35).toFixed(1)}" y2="0" stroke="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.5"/>` +
        `<line x1="0" y1="${(-s * 0.35).toFixed(1)}" x2="0" y2="${(s * 0.35).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 2)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.5"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 11. Nova Pulse — 破線弧タイル（脈動リング断片） */
function buildNovaPulse(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 32; i += 1) {
    const nx = 0.4 + hash01(i * 1.8, 1.2) * 0.62;
    const ny = hash01(i * 2.0, 3.1);
    if (!place(nx, ny, 0.9, i + 4)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 7 + hash01(i, 4) * 14;
    const a0 = hash01(i, 5) * Math.PI * 2;
    const sweep = Math.PI * (0.3 + hash01(i, 6) * 0.5);
    const a1 = a0 + sweep;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r;
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r;
    const large = sweep > Math.PI ? 1 : 0;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.14).toFixed(3)})" stroke-width="0.85" stroke-dasharray="${(3 + hash01(i, 7) * 3).toFixed(1)} ${(2 + hash01(i, 8) * 2).toFixed(1)}" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 12. Aurora Orbit — 波状リボン＋小楕円 */
function buildAuroraOrbit(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const ny = 0.1 + i * 0.065;
    if (hash01(i, 0.4) > 0.85) continue;
    const y = ny * CANVAS_H;
    const amp = 5 + hash01(i, 1) * 10;
    let d = `M${CANVAS_W * 0.42} ${y.toFixed(1)}`;
    for (let x = 0; x < 12; x += 1) {
      const px = CANVAS_W * 0.42 + x * 13;
      const py = y + Math.sin(x * 0.9 + i * 0.7) * amp;
      d += ` L${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.8" stroke-linecap="round"/>`
    );
  }
  for (let i = 0; i < 12; i += 1) {
    const nx = 0.55 + hash01(i, 2) * 0.45;
    const ny = 0.15 + hash01(i, 3) * 0.75;
    if (!place(nx, ny, 0.75, i + 20)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    parts.push(
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(8 + hash01(i, 4) * 10).toFixed(1)}" ry="${(3 + hash01(i, 5) * 4).toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.14).toFixed(3)})" stroke-width="0.65" transform="rotate(${((hash01(i, 6) - 0.5) * 40).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 13. Dark Matter — 歪みポリゴンの疎な織り */
function buildDarkMatter(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 26; i += 1) {
    const nx = 0.4 + hash01(i * 2.1, 1.4) * 0.62;
    const ny = hash01(i * 1.8, 3.6);
    if (!place(nx, ny, 0.82, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const n = 4 + Math.floor(hash01(i, 4) * 3);
    const r = 7 + hash01(i, 5) * 14;
    const pts: string[] = [];
    for (let k = 0; k < n; k += 1) {
      const a = (Math.PI * 2 * k) / n + hash01(i, k) * 0.4;
      const rr = r * (0.65 + hash01(i + k, 1) * 0.45);
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    parts.push(
      `<polygon points="${pts.join(" ")}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.06).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.1).toFixed(3)})" stroke-width="0.55"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 14. Comet Trail — 涙滴ストリーク模様 */
function buildCometTrail(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    const nx = 0.4 + hash01(i * 1.7, 1.2) * 0.62;
    const ny = hash01(i * 2.0, 3.0);
    if (!place(nx, ny, 0.9, i + 2)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const len = 14 + hash01(i, 4) * 28;
    const rot = (-35 + hash01(i, 5) * 20).toFixed(1);
    const d = [
      `M${(-2).toFixed(1)} 0`,
      `Q0 ${(-3).toFixed(1)} 2 0`,
      `L${len.toFixed(1)} ${(1.2 + hash01(i, 6)).toFixed(1)}`,
      `L${len.toFixed(1)} ${(-1.2 - hash01(i, 7)).toFixed(1)}`,
      "Z",
    ].join(" ");
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.08).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.14).toFixed(3)})" stroke-width="0.55"/>` +
        `<circle cx="0" cy="0" r="1.8" fill="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.2).toFixed(3)})"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 15. Celestial Grid — 菱形格子＋ノード */
function buildCelestialGrid(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 12; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const nx = 0.44 + col * 0.09 + (row % 2) * 0.045;
      const ny = 0.08 + row * 0.075;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.9, row * 9 + col)) continue;
      const cx = Math.min(CANVAS_W - 6, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      const s = 6 + hash01(row, col) * 4;
      parts.push(
        `<path d="M${cx.toFixed(1)} ${(cy - s).toFixed(1)} L${(cx + s).toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} ${(cy + s).toFixed(1)} L${(cx - s).toFixed(1)} ${cy.toFixed(1)} Z" fill="none" stroke="rgba(${pick(p.strokes, row, col)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.6"/>`
      );
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.3" fill="rgba(${pick(p.accent, col, row)},${cosmosOp(0.16).toFixed(3)})"/>`
      );
      if (col > 0 && hash01(row, col + 5) > 0.4) {
        const px = cx - 0.09 * CANVAS_W;
        parts.push(
          `<line x1="${px.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="rgba(${pick(p.strokes, row, col + 1)},${cosmosOp(0.07).toFixed(3)})" stroke-width="0.4"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 16. Quantum Nebula — 粒子＋短結線の格子模様 */
function buildQuantumNebula(p: CosmosPalette): string {
  const parts: string[] = [];
  const nodes: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < 48; i += 1) {
    const nx = 0.38 + hash01(i * 1.9, 1.3) * 0.64;
    const ny = hash01(i * 2.2, 3.4);
    if (!place(nx, ny, 0.92, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    nodes.push({ x, y, i });
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + hash01(i, 4) * 1.6).toFixed(1)}" fill="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.14 + hash01(i, 5) * 0.1).toFixed(3)})"/>`
    );
  }
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i]!;
    for (let j = i + 1; j < Math.min(i + 4, nodes.length); j += 1) {
      const b = nodes[j]!;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 36 || hash01(i, j) > 0.45) continue;
      parts.push(
        `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(${pick(p.accent, i, j)},${cosmosOp(0.08).toFixed(3)})" stroke-width="0.45"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 17. Meteor Veil — 帳カーテン弧＋斜線 */
function buildMeteorVeil(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const nx = 0.5 + hash01(i, 1) * 0.5;
    const ny = 0.1 + i * 0.09;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rx = 30 + hash01(i, 2) * 35;
    parts.push(
      `<path d="M${(cx - rx).toFixed(1)} ${cy.toFixed(1)} Q${cx.toFixed(1)} ${(cy - 12 - hash01(i, 3) * 10).toFixed(1)} ${(cx + rx).toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="rgba(${pick(p.fills, i, 1)},${cosmosOp(0.08).toFixed(3)})" stroke-width="0.7"/>`
    );
  }
  for (let i = 0; i < 24; i += 1) {
    const nx = 0.42 + hash01(i * 1.6, 1.1) * 0.58;
    const ny = hash01(i * 1.9, 3.2);
    if (!place(nx, ny, 0.85, i + 10)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 10 + hash01(i, 4) * 18;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len * 0.75).toFixed(1)}" y2="${(y + len * 0.35).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.65" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 18. Orbital Throne — V字チェブロン＋弧 */
function buildOrbitalThrone(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.4 + hash01(i * 1.8, 1.2) * 0.62;
    const ny = hash01(i * 2.0, 3.3);
    if (!place(nx, ny, 0.88, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 7 + hash01(i, 4) * 10;
    const rot = ((hash01(i, 5) - 0.5) * 24).toFixed(1);
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M${(-s).toFixed(1)} ${(-s * 0.2).toFixed(1)} L0 ${s.toFixed(1)} L${s.toFixed(1)} ${(-s * 0.2).toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.14).toFixed(3)})" stroke-width="0.85" stroke-linejoin="miter"/>` +
        `<path d="M${(-s * 0.55).toFixed(1)} ${(-s * 0.45).toFixed(1)} Q0 ${(-s * 0.85).toFixed(1)} ${(s * 0.55).toFixed(1)} ${(-s * 0.45).toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.12).toFixed(3)})" stroke-width="0.55"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 19. Singularity Vein — 分岐脈タイル */
function buildSingularityVein(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const nx = 0.48 + hash01(i, 1) * 0.52;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.92, i + 5)) continue;
    let x = nx * CANVAS_W;
    let y = ny * CANVAS_H;
    let a = Math.PI * (0.15 + hash01(i, 3) * 0.7);
    for (let d = 0; d < 6; d += 1) {
      const len = 9 + hash01(i, d + 4) * 11;
      const nx2 = x + Math.cos(a) * len;
      const ny2 = y + Math.sin(a) * len;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${nx2.toFixed(1)}" y2="${ny2.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, d)},${cosmosOp(0.15 - d * 0.015).toFixed(3)})" stroke-width="${(1.1 - d * 0.1).toFixed(2)}" stroke-linecap="round"/>`
      );
      if (d < 4 && hash01(i, d + 20) > 0.4) {
        const ba = a + (hash01(i, d + 21) > 0.5 ? 0.7 : -0.7);
        parts.push(
          `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ba) * len * 0.45).toFixed(1)}" y2="${(y + Math.sin(ba) * len * 0.45).toFixed(1)}" stroke="rgba(${pick(p.accent, i, d)},${cosmosOp(0.11).toFixed(3)})" stroke-width="0.6"/>`
        );
      }
      x = nx2;
      y = ny2;
      a += (hash01(i, d + 8) - 0.5) * 0.75;
    }
  }
  return wrapSvg(parts.join(""));
}

/** 20. Cosmos Archive — 罫線＋星点＋結線 */
function buildArchive(p: CosmosPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const y = 28 + i * 22;
    const x0 = CANVAS_W * (0.42 + hash01(i, 1) * 0.05);
    parts.push(
      `<line x1="${x0.toFixed(1)}" y1="${y}" x2="${CANVAS_W - 12}" y2="${y}" stroke="rgba(${pick(p.strokes, i, 1)},${cosmosOp(0.07).toFixed(3)})" stroke-width="0.4"/>`
    );
  }
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i < 20; i += 1) {
    const nx = 0.45 + hash01(i, 2) * 0.52;
    const ny = 0.1 + hash01(i, 3) * 0.8;
    if (!place(nx, ny, 0.85, i + 30)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    nodes.push({ x, y });
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="rgba(${pick(p.accent, i, 1)},${cosmosOp(0.18).toFixed(3)})"/>`
    );
    parts.push(
      `<rect x="${(x + 4).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="${(10 + hash01(i, 4) * 14).toFixed(1)}" height="4" fill="none" stroke="rgba(${pick(p.strokes, i, 2)},${cosmosOp(0.09).toFixed(3)})" stroke-width="0.35"/>`
    );
  }
  for (let i = 0; i < nodes.length - 1; i += 1) {
    if (hash01(i, 5) > 0.5) continue;
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) > 70) continue;
    parts.push(
      `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 3)},${cosmosOp(0.09).toFixed(3)})" stroke-width="0.5"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildHudSvg(variant: ProfilePlanProCosmosBgVariant): string {
  const { hudPrimary, hudSecondary } = PALETTES[variant];
  const g: string[] = [];
  const op = (n: number) => cosmosOp(n);
  for (let i = 0; i < 5; i += 1) {
    g.push(
      `<circle cx="${220 + i * 11}" cy="${22 + (i % 2) * 7}" r="1" fill="none" stroke="${hudPrimary}${op(0.12)})" stroke-width="0.45"/>`
    );
  }
  g.push(
    `<line x1="200" y1="62" x2="278" y2="62" stroke="${hudSecondary}${op(0.1)})" stroke-width="0.45"/>`
  );
  g.push(
    `<path d="M278 36 h7 v7" fill="none" stroke="${hudPrimary}${op(0.14)})" stroke-width="0.65"/>`
  );
  g.push(
    `<line x1="22" y1="402" x2="78" y2="402" stroke="${hudPrimary}${op(0.09)})" stroke-width="0.4"/>`
  );
  return wrapSvg(g.join(""));
}

function buildSkinSvg(variant: ProfilePlanProCosmosBgVariant): string {
  const p = PALETTES[variant];
  activeOpacityMul = p.opacityMul ?? 1;
  try {
    switch (variant) {
      case "cosmos-event-horizon":
        return buildEventHorizon(p);
      case "cosmos-nebula-crown":
        return buildNebulaCrown(p);
      case "cosmos-stellar-drift":
        return buildStellarDrift(p);
      case "cosmos-cosmic-rift":
        return buildCosmicRift(p);
      case "cosmos-lunar-eclipse":
        return buildLunarEclipse(p);
      case "cosmos-solar-flare":
        return buildSolarFlare(p);
      case "cosmos-deep-space-core":
        return buildDeepSpaceCore(p);
      case "cosmos-galactic-halo":
        return buildGalacticHalo(p);
      case "cosmos-void-signal":
        return buildVoidSignal(p);
      case "cosmos-starforge":
        return buildStarforge(p);
      case "cosmos-nova-pulse":
        return buildNovaPulse(p);
      case "cosmos-aurora-orbit":
        return buildAuroraOrbit(p);
      case "cosmos-dark-matter":
        return buildDarkMatter(p);
      case "cosmos-comet-trail":
        return buildCometTrail(p);
      case "cosmos-celestial-grid":
        return buildCelestialGrid(p);
      case "cosmos-quantum-nebula":
        return buildQuantumNebula(p);
      case "cosmos-meteor-veil":
        return buildMeteorVeil(p);
      case "cosmos-orbital-throne":
        return buildOrbitalThrone(p);
      case "cosmos-singularity-vein":
        return buildSingularityVein(p);
      case "cosmos-archive":
        return buildArchive(p);
      default:
        return wrapSvg("");
    }
  } finally {
    activeOpacityMul = 1;
  }
}

export function getProfilePlanProCosmosSkinSvg(
  variant: ProfilePlanProCosmosBgVariant
): string {
  return cachedSvg(`cosmos:skin:svg:${variant}:v2`, () => buildSkinSvg(variant));
}

export function getProfilePlanProCosmosHudSvg(
  variant: ProfilePlanProCosmosBgVariant
): string {
  return cachedSvg(`cosmos:hud:svg:${variant}:v2`, () => buildHudSvg(variant));
}

export function getProfilePlanProCosmosSkinUrl(
  variant: ProfilePlanProCosmosBgVariant
): string {
  return cachedUrl(`cosmos:skin:${variant}:v2`, () => buildSkinSvg(variant));
}

export function getProfilePlanProCosmosHudUrl(
  variant: ProfilePlanProCosmosBgVariant
): string {
  return cachedUrl(`cosmos:hud:${variant}:v2`, () => buildHudSvg(variant));
}

export const PROFILE_PLAN_PRO_COSMOS_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
