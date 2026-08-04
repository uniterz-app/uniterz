/**
 * PRO 背景 — 幾何フォーム
 * atmos / scale / beast と同じ配置: 疎・中央空け・端寄せ・微細 HUD
 */

import type { ProfilePlanProFormBgVariant } from "./profilePlanProFormBgVariants";

/** モバイル（縦長カード相当） */
const CANVAS_W_MOBILE = 300;
const CANVAS_H_MOBILE = 430;
/** Web（横長 2 カラム相当）— atmos と同寸 */
const CANVAS_W_WEB = 960;
const CANVAS_H_WEB = 380;

/** 生成中のキャンバス寸法（モバイル / Web 切替） */
let canvasW = CANVAS_W_MOBILE;
let canvasH = CANVAS_H_MOBILE;

function withFormCanvas<T>(w: number, h: number, build: () => T): T {
  const prevW = canvasW;
  const prevH = canvasH;
  canvasW = w;
  canvasH = h;
  try {
    return build();
  } finally {
    canvasW = prevW;
    canvasH = prevH;
  }
}

export const PROFILE_PLAN_PRO_FORM_OPACITY_SCALE = 2.35;

type FormPalette = {
  strokes: readonly string[];
  fills: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
};

const PALETTES: Record<ProfilePlanProFormBgVariant, FormPalette> = {
  "form-hexveil": {
    strokes: ["34,211,238", "103,232,249", "6,182,212"],
    fills: ["8,32,48", "12,48,72"],
    accent: ["165,243,252", "67,232,248"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(103,232,249,",
  },
  "form-diamondgrid": {
    strokes: ["212,168,40", "234,179,8", "180,140,30"],
    fills: ["40,32,12", "28,22,10"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "form-chevronedge": {
    strokes: ["203,213,225", "148,163,184", "226,232,240"],
    fills: ["40,48,60", "30,35,45"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
  },
  "form-trimesh": {
    strokes: ["167,139,250", "192,132,252", "34,211,238"],
    fills: ["46,16,101", "30,27,75"],
    accent: ["196,181,253", "165,243,252"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(34,211,238,",
  },
  "form-strata": {
    strokes: ["148,163,184", "203,213,225", "100,116,139"],
    fills: ["36,42,54", "51,58,72"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
  },
  "form-prism": {
    strokes: ["34,211,238", "232,121,249", "167,139,250", "103,232,249"],
    fills: ["8,32,48", "46,16,101"],
    accent: ["165,243,252", "240,171,252"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(232,121,249,",
  },
  "form-constgrid": {
    strokes: ["125,211,252", "186,230,253", "56,189,248"],
    fills: ["8,20,40", "12,30,55"],
    accent: ["224,242,254", "103,232,249"],
    hudPrimary: "rgba(186,230,253,",
    hudSecondary: "rgba(56,189,248,",
  },
  "form-arccircuit": {
    strokes: ["56,189,248", "34,211,238", "103,232,249"],
    fills: ["8,32,48", "12,48,72"],
    accent: ["165,243,252", "125,211,252"],
    hudPrimary: "rgba(56,189,248,",
    hudSecondary: "rgba(34,211,238,",
  },
  "form-monolith": {
    strokes: ["148,163,184", "100,116,139", "203,213,225"],
    fills: ["30,41,59", "51,65,85"],
    accent: ["226,232,240", "148,163,184"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
  },
  "form-lattice": {
    strokes: ["34,211,238", "103,232,249", "165,243,252"],
    fills: ["8,47,73", "12,48,72"],
    accent: ["207,250,254", "67,232,248"],
    hudPrimary: "rgba(103,232,249,",
    hudSecondary: "rgba(34,211,238,",
  },
  "form-radiant": {
    strokes: ["59,130,246", "96,165,250", "147,197,253"],
    fills: ["12,24,48", "20,40,72"],
    accent: ["191,219,254", "147,197,253"],
    hudPrimary: "rgba(96,165,250,",
    hudSecondary: "rgba(59,130,246,",
  },
  "form-shard": {
    strokes: ["244,63,94", "251,113,133", "225,29,72"],
    fills: ["76,5,25", "40,8,20"],
    accent: ["254,205,211", "253,164,175"],
    hudPrimary: "rgba(251,113,133,",
    hudSecondary: "rgba(244,63,94,",
  },
  "form-neodamier": {
    strokes: ["34,211,238", "148,163,184", "103,232,249"],
    fills: ["8,24,40", "30,41,59"],
    accent: ["165,243,252", "125,211,252"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(148,163,184,",
  },
  "form-offsetcheck": {
    strokes: ["148,163,184", "203,213,225", "100,116,139"],
    fills: ["40,48,60", "30,35,45"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
  },
  "form-fractal": {
    strokes: ["167,139,250", "139,92,246", "34,211,238"],
    fills: ["30,16,55", "24,12,48"],
    accent: ["196,181,253", "165,243,252"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(139,92,246,",
  },
  "form-isocubes": {
    strokes: ["56,189,248", "34,211,238", "148,163,184"],
    fills: ["8,32,48", "30,41,59"],
    accent: ["165,243,252", "125,211,252"],
    hudPrimary: "rgba(56,189,248,",
    hudSecondary: "rgba(34,211,238,",
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function formOp(raw: number): number {
  return Math.min(1, Math.round(raw * PROFILE_PLAN_PRO_FORM_OPACITY_SCALE * 1000) / 1000);
}

function densityAt(nx: number, ny: number): number {
  const right = Math.pow(nx, 1.5);
  const bottom = Math.pow(ny, 1.7);
  const topRight = Math.max(0, 1 - Math.hypot((nx - 1) * 1.15, (ny - 0.02) * 1.15));
  const rightMid = Math.max(0, 1 - Math.hypot((nx - 1) * 1.0, (ny - 0.5) * 1.5));
  const holeDist = ((nx - 0.34) ** 2) / 0.05 + ((ny - 0.42) ** 2) / 0.14;
  const centerFactor = Math.min(1, 0.22 + holeDist);
  return Math.min(1.4, (right * 0.55 + bottom * 0.5 + topRight * 0.65 + rightMid * 0.42) * centerFactor);
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

function pick<T>(arr: readonly T[], a: number, b: number): T {
  return arr[Math.floor(hash01(a, b) * arr.length) % arr.length]!;
}

function wrapSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}" preserveAspectRatio="none">${body}</svg>`;
}

function hexPts(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

function buildHexVeil(p: FormPalette): string {
  const parts: string[] = [];
  const r = 11;
  const colStep = r * 1.72;
  const rowStep = r * 1.5;
  for (let row = 0; row < 36; row += 1) {
    for (let col = 0; col < 24; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      const nx = cx / canvasW;
      const ny = cy / canvasH;
      if (hash01(col, row) > densityAt(nx, ny) * 0.88) continue;
      const rr = r * (0.78 + hash01(col, row + 1) * 0.4);
      const op = formOp(0.08 + hash01(col, row) * 0.1);
      parts.push(
        `<polygon points="${hexPts(cx, cy, rr)}" fill="none" stroke="rgba(${pick(p.strokes, col, row)},${op.toFixed(3)})" stroke-width="0.55"/>`
      );
      if (hash01(col + 2, row) > 0.72) {
        parts.push(
          `<polygon points="${hexPts(cx, cy, rr * 0.55)}" fill="none" stroke="rgba(${pick(p.accent, col, row)},${formOp(0.07).toFixed(3)})" stroke-width="0.35"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

function buildDiamondGrid(p: FormPalette): string {
  const parts: string[] = [];
  const step = 16;
  for (let row = 0; row < 32; row += 1) {
    for (let col = 0; col < 22; col += 1) {
      const cx = col * step + (row % 2) * (step / 2);
      const cy = row * step * 0.72;
      if (hash01(col, row) > densityAt(cx / canvasW, cy / canvasH) * 0.85) continue;
      const rx = 6 + hash01(col, row) * 3;
      const ry = 8 + hash01(col + 1, row) * 3.5;
      const d = `M${cx.toFixed(1)} ${(cy - ry).toFixed(1)} L${(cx + rx).toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} ${(cy + ry).toFixed(1)} L${(cx - rx).toFixed(1)} ${cy.toFixed(1)} Z`;
      parts.push(
        `<path d="${d}" fill="rgba(${pick(p.fills, col, row)},${formOp(0.05).toFixed(3)})" stroke="rgba(${pick(p.strokes, col, row)},${formOp(0.1 + hash01(col, row) * 0.1).toFixed(3)})" stroke-width="0.5"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildChevronEdge(p: FormPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 40; row += 1) {
    const y = row * 11;
    for (let col = 0; col < 20; col += 1) {
      const cx = col * 16 + (row % 2) * 8;
      if (hash01(col, row) > densityAt(cx / canvasW, y / canvasH) * 0.9) continue;
      const amp = 6.5 + hash01(col, row) * 2;
      const tip = y + amp;
      parts.push(
        `<path d="M${(cx - amp).toFixed(1)} ${y.toFixed(1)} L${cx.toFixed(1)} ${tip.toFixed(1)} L${(cx + amp).toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, col, row)},${formOp(0.1 + hash01(col, row) * 0.1).toFixed(3)})" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildTriMesh(p: FormPalette): string {
  const parts: string[] = [];
  const step = 18;
  for (let row = 0; row < 28; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      const x = col * step + (row % 2) * (step / 2);
      const y = row * step * 0.86;
      if (hash01(col, row) > densityAt(x / canvasW, y / canvasH) * 0.82) continue;
      const s = 8 + hash01(col, row) * 6;
      const flip = (col + row) % 2 === 0;
      const d = flip
        ? `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + s).toFixed(1)} ${y.toFixed(1)} L${(x + s / 2).toFixed(1)} ${(y + s * 0.9).toFixed(1)} Z`
        : `M${(x + s / 2).toFixed(1)} ${y.toFixed(1)} L${(x + s).toFixed(1)} ${(y + s * 0.9).toFixed(1)} L${x.toFixed(1)} ${(y + s * 0.9).toFixed(1)} Z`;
      parts.push(
        `<path d="${d}" fill="rgba(${pick(p.fills, col, row)},${formOp(0.045).toFixed(3)})" stroke="rgba(${pick(p.strokes, col, row)},${formOp(0.1).toFixed(3)})" stroke-width="0.5"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildStrata(p: FormPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 55; i += 1) {
    const y = (i / 55) * canvasH + hash01(i, 1) * 2;
    const amp = 1.5 + hash01(i, 2) * 3;
    let d = "";
    let kept = false;
    for (let s = 0; s <= 20; s += 1) {
      const t = s / 20;
      const x = t * canvasW;
      const yy = y + Math.sin(t * Math.PI * 2.2 + i * 0.3) * amp;
      if (hash01(i, s) > densityAt(t, Math.min(1, yy / canvasH)) * 1.05) {
        if (kept) {
          parts.push(
            `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, s)},${formOp(0.07 + hash01(i, s) * 0.08).toFixed(3)})" stroke-width="${(0.35 + hash01(i, 3) * 0.4).toFixed(2)}"/>`
          );
          d = "";
          kept = false;
        }
        continue;
      }
      d += kept ? ` L${x.toFixed(1)} ${yy.toFixed(1)}` : `M${x.toFixed(1)} ${yy.toFixed(1)}`;
      kept = true;
    }
    if (kept && d) {
      parts.push(
        `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${formOp(0.08).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildPrism(p: FormPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    const nx = 0.32 + hash01(i * 1.7, 1) * 0.72;
    const ny = hash01(i * 2.1, 3);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.85) continue;
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const r = 9 + hash01(i, 4) * 14;
    const n = 3 + Math.floor(hash01(i, 5) * 3);
    const rot = hash01(i, 6) * Math.PI;
    const pts: string[] = [];
    for (let k = 0; k < n; k += 1) {
      const a = rot + (Math.PI * 2 * k) / n;
      const rr = r * (0.7 + hash01(i + k, 1) * 0.4);
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.85).toFixed(1)}`);
    }
    parts.push(
      `<polygon points="${pts.join(" ")}" fill="rgba(${pick(p.fills, i, 1)},${formOp(0.05).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${formOp(0.11).toFixed(3)})" stroke-width="0.55" stroke-linejoin="round"/>`
    );
    if (hash01(i, 7) > 0.5) {
      const a = rot;
      parts.push(
        `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + Math.cos(a) * r * 0.9).toFixed(1)}" y2="${(cy + Math.sin(a) * r * 0.75).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 1)},${formOp(0.1).toFixed(3)})" stroke-width="0.35"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildConstGrid(p: FormPalette): string {
  const parts: string[] = [];
  const stars: { x: number; y: number }[] = [];
  for (let i = 0; i < 42; i += 1) {
    const nx = 0.3 + hash01(i * 1.8, 1.2) * 0.75;
    const ny = hash01(i * 2.3, 3.1);
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.9) continue;
    stars.push({ x: nx * canvasW, y: ny * canvasH });
  }
  for (let i = 0; i < stars.length; i += 1) {
    const a = stars[i]!;
    let links = 0;
    for (let j = i + 1; j < stars.length && links < 3; j += 1) {
      const b = stars[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 22 || d > 58) continue;
      if (hash01(i + j, 5) > 0.5) continue;
      parts.push(
        `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, j)},${formOp(0.07).toFixed(3)})" stroke-width="0.35"/>`
      );
      links += 1;
    }
  }
  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i]!;
    const r = 0.8 + hash01(i, 4) * 1.3;
    parts.push(
      `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(${pick(p.accent, i, 1)},${formOp(0.16).toFixed(3)})"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildArcCircuit(p: FormPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const nx = 0.4 + hash01(i * 2, 1) * 0.6;
    const ny = hash01(i * 1.7, 3);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.9) continue;
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const r = 12 + hash01(i, 4) * 28;
    const a0 = hash01(i, 5) * Math.PI * 2;
    const sweep = Math.PI * (0.45 + hash01(i, 6) * 0.9);
    const a1 = a0 + sweep;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r;
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r;
    const large = sweep > Math.PI ? 1 : 0;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${formOp(0.11).toFixed(3)})" stroke-width="0.65" stroke-linecap="round"/>`
    );
    // circuit stubs
    for (let k = 0; k < 3; k += 1) {
      const t = a0 + (sweep * (k + 1)) / 4;
      const px = cx + Math.cos(t) * r;
      const py = cy + Math.sin(t) * r;
      const len = 4 + hash01(i, k) * 8;
      parts.push(
        `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px + Math.cos(t) * len).toFixed(1)}" y2="${(py + Math.sin(t) * len).toFixed(1)}" stroke="rgba(${pick(p.accent, i, k)},${formOp(0.1).toFixed(3)})" stroke-width="0.4"/>`
      );
      parts.push(
        `<circle cx="${(px + Math.cos(t) * len).toFixed(1)}" cy="${(py + Math.sin(t) * len).toFixed(1)}" r="1" fill="none" stroke="rgba(${pick(p.strokes, i, k + 2)},${formOp(0.12).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildMonolith(p: FormPalette): string {
  const parts: string[] = [];
  for (let col = 0; col < 8; col += 1) {
    for (let s = 0; s < 10; s += 1) {
      const nx = 0.5 + col * 0.065 + hash01(col, s) * 0.03;
      const ny = 0.05 + s * 0.09 + hash01(s, col) * 0.02;
      if (hash01(col + s, 1) > densityAt(nx, ny) * 0.92) continue;
      const x = nx * canvasW;
      const y = ny * canvasH;
      const w = 14 + col * 1.8 + hash01(col, s) * 8;
      const h = 10 + hash01(s, col) * 7;
      const inset = hash01(col, s + 2) * 3;
      parts.push(
        `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2 + inset).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgba(${pick(p.fills, col, s)},${formOp(0.06).toFixed(3)})" stroke="rgba(${pick(p.strokes, col, s)},${formOp(0.11).toFixed(3)})" stroke-width="0.6"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildLattice(p: FormPalette): string {
  const parts: string[] = [];
  const gap = 14;
  for (let x = 0; x < canvasW + gap; x += gap) {
    for (let seg = 0; seg < 12; seg += 1) {
      const y0 = (seg / 12) * canvasH;
      const y1 = ((seg + 1) / 12) * canvasH;
      const mx = x / canvasW;
      const my = (seg + 0.5) / 12;
      if (hash01(x, seg) > densityAt(mx, my) * 0.95) continue;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(${pick(p.strokes, x, seg)},${formOp(0.07).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  for (let y = 0; y < canvasH + gap; y += gap) {
    for (let seg = 0; seg < 12; seg += 1) {
      const x0 = (seg / 12) * canvasW;
      const x1 = ((seg + 1) / 12) * canvasW;
      const mx = (seg + 0.5) / 12;
      const my = y / canvasH;
      if (hash01(y + 3, seg) > densityAt(mx, my) * 0.95) continue;
      parts.push(
        `<line x1="${x0.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(${pick(p.strokes, y, seg)},${formOp(0.065).toFixed(3)})" stroke-width="0.35"/>`
      );
    }
  }
  // corner frames
  for (let i = 0; i < 16; i += 1) {
    const nx = 0.55 + hash01(i, 1) * 0.45;
    const ny = hash01(i, 2);
    if (hash01(i, 0.3) > densityAt(nx, ny) * 0.7) continue;
    const x = nx * canvasW;
    const y = ny * canvasH;
    const s = 4 + hash01(i, 3) * 5;
    parts.push(
      `<path d="M${(x - s).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y - s).toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${formOp(0.12).toFixed(3)})" stroke-width="0.55"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildRadiant(p: FormPalette): string {
  const parts: string[] = [];
  // anchors toward edges so center stays clearer but rings draw eye
  for (let i = 0; i < 10; i += 1) {
    const nx = 0.55 + hash01(i, 1) * 0.42;
    const ny = 0.2 + hash01(i, 2) * 0.65;
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.95) continue;
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const rings = 3 + Math.floor(hash01(i, 3) * 4);
    for (let r = 1; r <= rings; r += 1) {
      const rr = 8 + r * 7 + hash01(i, r) * 4;
      const a0 = hash01(i, r + 5) * Math.PI * 2;
      const sweep = Math.PI * (0.8 + hash01(i, r + 6) * 0.9);
      const a1 = a0 + sweep;
      const x1 = cx + Math.cos(a0) * rr;
      const y1 = cy + Math.sin(a0) * rr;
      const x2 = cx + Math.cos(a1) * rr;
      const y2 = cy + Math.sin(a1) * rr;
      const large = sweep > Math.PI ? 1 : 0;
      parts.push(
        `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, r)},${formOp(0.1 - r * 0.008).toFixed(3)})" stroke-width="${(0.5 + (1 - r / rings) * 0.4).toFixed(2)}"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildShard(p: FormPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 40; i += 1) {
    const nx = 0.32 + hash01(i * 1.9, 1) * 0.72;
    const ny = hash01(i * 2.2, 3);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.85) continue;
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const ang = hash01(i, 4) * Math.PI * 2;
    const len = 14 + hash01(i, 5) * 28;
    const w = 3 + hash01(i, 6) * 7;
    const tipX = cx + Math.cos(ang) * len;
    const tipY = cy + Math.sin(ang) * len;
    const nx2 = Math.cos(ang + Math.PI / 2);
    const ny2 = Math.sin(ang + Math.PI / 2);
    const d = [
      `M${(cx + nx2 * w * 0.3).toFixed(1)} ${(cy + ny2 * w * 0.3).toFixed(1)}`,
      `L${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
      `L${(cx - nx2 * w).toFixed(1)} ${(cy - ny2 * w).toFixed(1)}`,
      "Z",
    ].join(" ");
    parts.push(
      `<path d="${d}" fill="rgba(${pick(p.fills, i, 1)},${formOp(0.05).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${formOp(0.12).toFixed(3)})" stroke-width="0.5" stroke-linejoin="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildNeoDamier(p: FormPalette): string {
  const parts: string[] = [];
  const n = 12;
  for (let row = 0; row < n + 3; row += 1) {
    for (let col = 0; col < n + 2; col += 1) {
      const u = col / n;
      const v = row / n;
      const warp = 1 + u * 0.3 + v * 0.12;
      const cx = 35 + u * canvasW * 0.95 * warp + Math.sin(v * 3.5) * 5;
      const cy = v * canvasH * 0.95 + Math.sin(u * 3) * 5;
      if (hash01(col, row) > densityAt(Math.min(1, cx / canvasW), Math.min(1, cy / canvasH)) * 0.88) continue;
      const dark = (col + row) % 2 === 0;
      const size = (7 + hash01(col, row) * 3.5) * (0.85 + u * 0.2);
      const rot = ((hash01(col, row) - 0.5) * 10 + u * 6).toFixed(1);
      const half = size / 2;
      parts.push(
        `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
          `<rect x="${(-half).toFixed(1)}" y="${(-half).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="rgba(${dark ? pick(p.fills, col, row) : pick(p.strokes, col, row)},${formOp(dark ? 0.07 : 0.04).toFixed(3)})" stroke="rgba(${pick(p.accent, col, row)},${formOp(0.08).toFixed(3)})" stroke-width="0.35"/>` +
          `</g>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildOffsetCheck(p: FormPalette): string {
  const parts: string[] = [];
  const step = 18;
  for (let row = 0; row < 28; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      const cx = col * step + (row % 2) * (step * 0.42);
      const cy = row * step * 0.78;
      if (hash01(col, row) > densityAt(cx / canvasW, cy / canvasH) * 0.82) continue;
      const s = 9 + hash01(col, row) * 4;
      const on = (col + Math.floor(row / 2)) % 2 === 0;
      parts.push(
        `<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="rgba(${on ? pick(p.fills, col, row) : pick(p.strokes, col, row)},${formOp(on ? 0.06 : 0.035).toFixed(3)})" stroke="rgba(${pick(p.accent, col, row)},${formOp(0.07).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildFractal(p: FormPalette): string {
  const parts: string[] = [];
  // fine nested plus / diamond weave
  for (let i = 0; i < 120; i += 1) {
    const nx = hash01(i * 1.4, 0.8);
    const ny = hash01(i * 2.1, 3.2);
    if (hash01(i, 0.3) > densityAt(nx, ny) * 0.95) continue;
    const x = nx * canvasW;
    const y = ny * canvasH;
    const s = 2.2 + hash01(i, 4) * 3.5;
    const kind = Math.floor(hash01(i, 5) * 3);
    const stroke = pick(p.strokes, i, 1);
    const op = formOp(0.06 + hash01(i, 6) * 0.08);
    if (kind === 0) {
      parts.push(
        `<line x1="${(x - s).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + s).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.35"/>` +
          `<line x1="${x.toFixed(1)}" y1="${(y - s).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + s).toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.35"/>`
      );
    } else if (kind === 1) {
      parts.push(
        `<rect x="${(x - s / 2).toFixed(1)}" y="${(y - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.3" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`
      );
    } else {
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * 0.35).toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, i, 2)},${formOp(0.08).toFixed(3)})" stroke-width="0.3"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/* ─── Isometric Cubes: 全面タイル ─── */

function buildIsoCubes(p: FormPalette): string {
  const parts: string[] = [];
  const w = 13;
  const h = 7.5;
  const colStep = w * 1.48;
  const rowStep = h * 1.62;
  const cols = Math.ceil(canvasW / colStep) + 3;
  const rows = Math.ceil(canvasH / rowStep) + 3;
  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (w * 0.78) - colStep * 0.2;
      const cy = row * rowStep - rowStep * 0.15;
      if (cx < -w || cy < -h || cx > canvasW + w || cy > canvasH + h) continue;
      // 軽く間引き（全面は維持）
      if (hash01(col * 1.2, row * 1.8) < 0.06) continue;
      const top = [
        `M${cx.toFixed(1)} ${(cy - h).toFixed(1)}`,
        `L${(cx + w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)}`,
        `L${cx.toFixed(1)} ${cy.toFixed(1)}`,
        `L${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)}`,
        "Z",
      ].join(" ");
      const left = [
        `M${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)}`,
        `L${cx.toFixed(1)} ${cy.toFixed(1)}`,
        `L${cx.toFixed(1)} ${(cy + h).toFixed(1)}`,
        `L${(cx - w / 2).toFixed(1)} ${(cy + h / 2).toFixed(1)}`,
        "Z",
      ].join(" ");
      const right = [
        `M${(cx + w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)}`,
        `L${cx.toFixed(1)} ${cy.toFixed(1)}`,
        `L${cx.toFixed(1)} ${(cy + h).toFixed(1)}`,
        `L${(cx + w / 2).toFixed(1)} ${(cy + h / 2).toFixed(1)}`,
        "Z",
      ].join(" ");
      const stroke = pick(p.strokes, col, row);
      parts.push(
        `<path d="${top}" fill="rgba(${pick(p.fills, col, row)},${formOp(0.08).toFixed(3)})" stroke="rgba(${stroke},${formOp(0.15).toFixed(3)})" stroke-width="0.5"/>` +
          `<path d="${left}" fill="rgba(${pick(p.fills, col + 1, row)},${formOp(0.06).toFixed(3)})" stroke="rgba(${stroke},${formOp(0.13).toFixed(3)})" stroke-width="0.45"/>` +
          `<path d="${right}" fill="none" stroke="rgba(${pick(p.accent, col, row)},${formOp(0.12).toFixed(3)})" stroke-width="0.45"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function plusMark(cx: number, cy: number, s: number, op: number, strokePrefix: string): string {
  return (
    `<line x1="${(cx - s).toFixed(1)}" y1="${cy}" x2="${(cx + s).toFixed(1)}" y2="${cy}" stroke="${strokePrefix}${op})" stroke-width="0.8"/>` +
    `<line x1="${cx}" y1="${(cy - s).toFixed(1)}" x2="${cx}" y2="${(cy + s).toFixed(1)}" stroke="${strokePrefix}${op})" stroke-width="0.8"/>`
  );
}

function tickRow(
  x: number,
  y: number,
  count: number,
  gap: number,
  len: number,
  op: number,
  strokePrefix: string
): string {
  const t: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const tx = x + i * gap;
    const tl = i % 4 === 0 ? len * 1.8 : len;
    t.push(
      `<line x1="${tx.toFixed(1)}" y1="${y}" x2="${tx.toFixed(1)}" y2="${(y + tl).toFixed(1)}" stroke="${strokePrefix}${op})" stroke-width="0.8"/>`
    );
  }
  return t.join("");
}

function dotGrid(
  x0: number,
  y0: number,
  w: number,
  h: number,
  gap: number,
  op: number,
  fillPrefix: string
): string {
  const dots: string[] = [];
  for (let y = y0; y <= y0 + h; y += gap) {
    for (let x = x0; x <= x0 + w; x += gap) {
      dots.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.7" fill="${fillPrefix}${op})"/>`
      );
    }
  }
  return dots.join("");
}

function buildHudSvg(variant: ProfilePlanProFormBgVariant): string {
  const { hudPrimary, hudSecondary } = PALETTES[variant];
  /** モバイル座標 → 現行キャンバスへスケール */
  const sx = canvasW / CANVAS_W_MOBILE;
  const sy = canvasH / CANVAS_H_MOBILE;
  const x = (v: number) => v * sx;
  const y = (v: number) => v * sy;
  const g: string[] = [];
  g.push(dotGrid(x(210), y(20), x(70), y(34), 8 * Math.min(sx, sy), formOp(0.12), hudPrimary));
  g.push(tickRow(x(196), y(66), 12, 7.5 * sx, 3 * sy, formOp(0.22), hudSecondary));
  g.push(plusMark(x(276), y(40), 3 * Math.min(sx, sy), formOp(0.3), hudPrimary));
  g.push(plusMark(x(288), y(190), 2.6 * Math.min(sx, sy), formOp(0.26), hudPrimary));
  g.push(tickRow(x(286), y(150), 8, 6 * sx, 2.4 * sy, formOp(0.18), hudSecondary));
  g.push(dotGrid(x(24), y(372), x(60), y(40), 9 * Math.min(sx, sy), formOp(0.1), hudPrimary));
  g.push(tickRow(x(150), y(420), 16, 6 * sx, 2.2 * sy, formOp(0.16), hudSecondary));
  g.push(plusMark(x(280), y(400), 3 * Math.min(sx, sy), formOp(0.24), hudPrimary));
  return wrapSvg(g.join(""));
}

function buildSkinSvg(variant: ProfilePlanProFormBgVariant): string {
  const p = PALETTES[variant];
  switch (variant) {
    case "form-hexveil":
      return buildHexVeil(p);
    case "form-diamondgrid":
      return buildDiamondGrid(p);
    case "form-chevronedge":
      return buildChevronEdge(p);
    case "form-trimesh":
      return buildTriMesh(p);
    case "form-strata":
      return buildStrata(p);
    case "form-prism":
      return buildPrism(p);
    case "form-constgrid":
      return buildConstGrid(p);
    case "form-arccircuit":
      return buildArcCircuit(p);
    case "form-monolith":
      return buildMonolith(p);
    case "form-lattice":
      return buildLattice(p);
    case "form-radiant":
      return buildRadiant(p);
    case "form-shard":
      return buildShard(p);
    case "form-neodamier":
      return buildNeoDamier(p);
    case "form-offsetcheck":
      return buildOffsetCheck(p);
    case "form-fractal":
      return buildFractal(p);
    case "form-isocubes":
      return buildIsoCubes(p);
    default:
      return wrapSvg("");
  }
}

/** Native SvgXml 用 — 生 SVG マークアップ */
export function getProfilePlanProFormSkinSvg(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedSvg(`form:skin:svg:${variant}:v4`, () => buildSkinSvg(variant));
}

export function getProfilePlanProFormHudSvg(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedSvg(`form:hud:svg:${variant}:v4`, () => buildHudSvg(variant));
}

export function getProfilePlanProFormSkinUrl(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedUrl(`form:skin:${variant}:v4`, () => buildSkinSvg(variant));
}

export function getProfilePlanProFormHudUrl(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedUrl(`form:hud:${variant}:v4`, () => buildHudSvg(variant));
}

/** Web 横長パネル用 — 960×380（引き伸ばしなし） */
export function getProfilePlanProFormSkinUrlWeb(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedUrl(`form:skin:web:${variant}:v2`, () =>
    withFormCanvas(CANVAS_W_WEB, CANVAS_H_WEB, () => buildSkinSvg(variant))
  );
}

export function getProfilePlanProFormHudUrlWeb(
  variant: ProfilePlanProFormBgVariant
): string {
  return cachedUrl(`form:hud:web:${variant}:v1`, () =>
    withFormCanvas(CANVAS_W_WEB, CANVAS_H_WEB, () => buildHudSvg(variant))
  );
}

export const PROFILE_PLAN_PRO_FORM_CANVAS = {
  width: CANVAS_W_MOBILE,
  height: CANVAS_H_MOBILE,
} as const;

export const PROFILE_PLAN_PRO_FORM_CANVAS_WEB = {
  width: CANVAS_W_WEB,
  height: CANVAS_H_WEB,
} as const;
