/**
 * PRO 背景 — デザインラボ（洗練リデザイン）
 * Atmos 準拠: 細い線・疎・中央空け・端寄せ・一系統の色
 */

import type { ProfilePlanProLabBgVariant } from "./profilePlanProLabBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;
export const PROFILE_PLAN_PRO_LAB_OPACITY_SCALE = 1.35;

type LabPalette = {
  strokes: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProLabBgVariant, LabPalette> = {
  "lab-quiet-hex": {
    strokes: ["100,116,139", "148,163,184", "71,85,105", "203,213,225"],
    accent: ["56,189,248", "125,211,252"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-blade-rain": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "125,211,252"],
    accent: ["165,243,252", "186,230,253"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(125,211,252,",
    opacityMul: 1.2,
  },
  "lab-carbon-twill": {
    strokes: ["71,85,105", "100,116,139", "148,163,184", "51,65,85"],
    accent: ["203,213,225", "148,163,184"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(100,116,139,",
    opacityMul: 1.25,
  },
  "lab-soft-contour": {
    strokes: ["56,189,248", "125,211,252", "100,116,139", "14,165,233"],
    accent: ["186,230,253", "224,242,254"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.1,
  },
  "lab-bracket-marks": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "226,232,240"],
    accent: ["56,189,248", "165,243,252"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.2,
  },
  "lab-orbit-rings": {
    strokes: ["125,211,252", "56,189,248", "148,163,184", "103,232,249"],
    accent: ["224,242,254", "165,243,252"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-graphite-mesh": {
    strokes: ["100,116,139", "71,85,105", "148,163,184", "51,65,85"],
    accent: ["203,213,225", "148,163,184"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(100,116,139,",
    opacityMul: 1.2,
  },
  "lab-ivory-vein": {
    strokes: ["180,140,30", "212,168,40", "161,128,40", "146,110,24"],
    accent: ["234,179,8", "253,224,71"],
    hudPrimary: "rgba(212,168,40,",
    hudSecondary: "rgba(180,140,30,",
    opacityMul: 1.15,
  },
  "lab-night-ledger": {
    strokes: ["56,189,248", "100,116,139", "125,211,252", "148,163,184"],
    accent: ["165,243,252", "186,230,253"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-steel-hatch": {
    strokes: ["148,163,184", "100,116,139", "203,213,225", "71,85,105"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.2,
  },
  "lab-void-nodes": {
    strokes: ["100,116,139", "56,189,248", "148,163,184", "125,211,252"],
    accent: ["165,243,252", "203,213,225"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-ridge-fold": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "226,232,240"],
    accent: ["186,198,212", "241,245,249"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.15,
  },
  "lab-signal-bars": {
    strokes: ["56,189,248", "125,211,252", "100,116,139", "14,165,233"],
    accent: ["165,243,252", "186,230,253"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-mirror-facet": {
    strokes: ["125,211,252", "148,163,184", "56,189,248", "203,213,225"],
    accent: ["224,242,254", "186,230,253"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.15,
  },
  "lab-trace-path": {
    strokes: ["100,116,139", "148,163,184", "56,189,248", "203,213,225"],
    accent: ["125,211,252", "186,230,253"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.15,
  },
  "lab-mono-chevron": {
    strokes: ["148,163,184", "100,116,139", "203,213,225", "71,85,105"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.2,
  },
  "lab-brushed-steel": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "226,232,240"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.35,
  },
  "lab-liquid-chrome": {
    strokes: ["226,232,240", "203,213,225", "148,163,184", "56,189,248"],
    accent: ["248,250,252", "125,211,252"],
    hudPrimary: "rgba(241,245,249,",
    hudSecondary: "rgba(56,189,248,",
    opacityMul: 1.4,
  },
  "lab-damascus-wave": {
    strokes: ["148,163,184", "100,116,139", "203,213,225", "71,85,105"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.3,
  },
  "lab-gunmetal-flake": {
    strokes: ["100,116,139", "148,163,184", "71,85,105", "203,213,225"],
    accent: ["226,232,240", "165,180,200"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(100,116,139,",
    opacityMul: 1.35,
  },
  "lab-rose-metal": {
    strokes: ["190,140,110", "212,168,140", "160,110,88", "232,190,160"],
    accent: ["245,210,180", "200,140,110"],
    hudPrimary: "rgba(232,190,160,",
    hudSecondary: "rgba(190,140,110,",
    opacityMul: 1.35,
  },
  "lab-anodized-blue": {
    strokes: ["59,130,246", "96,165,250", "37,99,235", "147,197,253"],
    accent: ["191,219,254", "125,211,252"],
    hudPrimary: "rgba(147,197,253,",
    hudSecondary: "rgba(59,130,246,",
    opacityMul: 1.35,
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function labOp(raw: number): number {
  return Math.min(
    1,
    Math.round(raw * PROFILE_PLAN_PRO_LAB_OPACITY_SCALE * activeOpacityMul * 1000) /
      1000
  );
}

/** Atmos 同系 — 右・下・隅に寄せ、中央空け */
function densityAt(nx: number, ny: number): number {
  const right = Math.pow(nx, 1.5);
  const bottom = Math.pow(ny, 1.7);
  const topRight = Math.max(0, 1 - Math.hypot((nx - 1) * 1.15, (ny - 0.02) * 1.15));
  const rightMid = Math.max(0, 1 - Math.hypot((nx - 1) * 1.0, (ny - 0.5) * 1.5));
  const holeDist = ((nx - 0.34) ** 2) / 0.05 + ((ny - 0.42) ** 2) / 0.14;
  const centerFactor = Math.min(1, 0.22 + holeDist);
  return Math.min(
    1.4,
    (right * 0.55 + bottom * 0.5 + topRight * 0.65 + rightMid * 0.42) * centerFactor
  );
}

function place(nx: number, ny: number, densMul: number, seed: number): boolean {
  return hash01(seed, densMul) <= densityAt(nx, ny) * densMul;
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

function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/* ─── 模様 ─── */

function buildQuietHex(p: LabPalette): string {
  const parts: string[] = [];
  const r = 12;
  const colStep = Math.sqrt(3) * r;
  const rowStep = 1.5 * r;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (!place(nx, ny, 0.7, row * 20 + col)) continue;
      const rr = r * (0.75 + hash01(col, row) * 0.55);
      const op = labOp(0.07 + hash01(col + 1, row + 2) * 0.1);
      parts.push(
        `<path d="${hexPath(cx, cy, rr)}" fill="none" stroke="rgba(${pick(p.strokes, col, row)},${op.toFixed(3)})" stroke-width="${(0.55 + hash01(col, row + 3) * 0.55).toFixed(2)}"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildBladeRain(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 42; i += 1) {
    const nx = 0.38 + hash01(i * 1.7, 1.2) * 0.64;
    const ny = hash01(i * 2.1, 3.3);
    if (!place(nx, ny, 0.85, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 18 + hash01(i, 4) * 36;
    const ang = -0.92 + (hash01(i, 5) - 0.5) * 0.12;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ang) * len).toFixed(1)}" y2="${(y + Math.sin(ang) * len).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.09 + hash01(i, 6) * 0.1).toFixed(3)})" stroke-width="${(0.45 + hash01(i, 7) * 0.55).toFixed(2)}" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildCarbonTwill(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 70; i += 1) {
    const nx = 0.4 + hash01(i * 1.5, 1.1) * 0.62;
    const ny = hash01(i * 1.9, 2.8);
    if (!place(nx, ny, 0.92, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 7 + hash01(i, 3) * 12;
    const flip = hash01(i, 4) > 0.5;
    const ang = flip ? -0.55 : 0.55;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ang) * len).toFixed(1)}" y2="${(y + Math.sin(ang) * len).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.1 + hash01(i, 5) * 0.08).toFixed(3)})" stroke-width="${(0.7 + hash01(i, 6) * 0.5).toFixed(2)}" stroke-linecap="square"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildSoftContour(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 11; i += 1) {
    const cy = 40 + i * 36;
    const amp = 10 + hash01(i, 1) * 18;
    let d = `M${CANVAS_W * 0.4} ${cy.toFixed(1)}`;
    for (let x = 0; x < 14; x += 1) {
      const px = CANVAS_W * 0.4 + x * 12;
      const py = cy + Math.sin(x * 0.55 + i * 0.7) * amp * (0.4 + x / 20);
      d += ` L${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.08 + (i % 3) * 0.02).toFixed(3)})" stroke-width="0.65" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildBracketMarks(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 22; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.8, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const s = 6 + hash01(i, 3) * 10;
    const kind = Math.floor(hash01(i, 4) * 4);
    const op = labOp(0.12 + hash01(i, 5) * 0.08);
    const c = pick(p.strokes, i, 1);
    if (kind === 0) {
      parts.push(
        `<path d="M${(x + s).toFixed(1)} ${y.toFixed(1)} h${(-s).toFixed(1)} v${s.toFixed(1)}" fill="none" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.7"/>`
      );
    } else if (kind === 1) {
      parts.push(
        `<path d="M${x.toFixed(1)} ${(y + s).toFixed(1)} v${(-s).toFixed(1)} h${s.toFixed(1)}" fill="none" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.7"/>`
      );
    } else if (kind === 2) {
      parts.push(
        `<path d="M${x.toFixed(1)} ${y.toFixed(1)} h${s.toFixed(1)} v${s.toFixed(1)}" fill="none" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.7"/>`
      );
    } else {
      parts.push(
        `<path d="M${(x + s).toFixed(1)} ${(y + s).toFixed(1)} h${(-s).toFixed(1)} v${(-s).toFixed(1)}" fill="none" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.7"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildOrbitRings(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const nx = 0.48 + hash01(i, 1) * 0.55;
    const ny = 0.1 + hash01(i, 2) * 0.85;
    if (!place(Math.min(1, nx), Math.min(1, ny), 0.75, i)) continue;
    const cx = Math.min(CANVAS_W - 8, nx * CANVAS_W);
    const cy = ny * CANVAS_H;
    const r = 14 + hash01(i, 3) * 28;
    const a0 = hash01(i, 4) * Math.PI * 2;
    const sweep = Math.PI * (0.35 + hash01(i, 5) * 0.55);
    const a1 = a0 + sweep;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r * 0.72;
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r * 0.72;
    const large = sweep > Math.PI ? 1 : 0;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r.toFixed(1)} ${(r * 0.72).toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.1 + hash01(i, 6) * 0.08).toFixed(3)})" stroke-width="${(0.65 + hash01(i, 7) * 0.5).toFixed(2)}" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildGraphiteMesh(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.82, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const s = 10 + hash01(i, 3) * 16;
    const op = labOp(0.08 + hash01(i, 4) * 0.07);
    const c = pick(p.strokes, i, 1);
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + s).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.5"/>`
    );
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + s * 0.7).toFixed(1)}" stroke="rgba(${c},${op.toFixed(3)})" stroke-width="0.5"/>`
    );
    if (hash01(i, 5) > 0.55) {
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.1" fill="rgba(${pick(p.accent, i, 1)},${labOp(0.14).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildIvoryVein(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const nx = 0.45 + hash01(i, 1) * 0.55;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.88, i + 3)) continue;
    let x = nx * CANVAS_W;
    let y = ny * CANVAS_H;
    let a = Math.PI * (0.15 + hash01(i, 3) * 0.7);
    for (let d = 0; d < 6; d += 1) {
      const len = 12 + hash01(i, d + 4) * 14;
      const nx2 = x + Math.cos(a) * len;
      const ny2 = y + Math.sin(a) * len;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${nx2.toFixed(1)}" y2="${ny2.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, d)},${labOp(0.11 - d * 0.01).toFixed(3)})" stroke-width="${(0.7 - d * 0.06).toFixed(2)}" stroke-linecap="round"/>`
      );
      x = nx2;
      y = ny2;
      a += (hash01(i, d + 10) - 0.5) * 0.55;
    }
  }
  return wrapSvg(parts.join(""));
}

function buildNightLedger(p: LabPalette): string {
  const parts: string[] = [];
  for (let col = 0; col < 10; col += 1) {
    const nx = 0.48 + col * 0.055;
    const x = nx * CANVAS_W;
    for (let i = 0; i < 18; i += 1) {
      const ny = 0.06 + i * 0.052 + hash01(col, i) * 0.01;
      if (!place(nx, ny, 0.78, col * 20 + i)) continue;
      const y = ny * CANVAS_H;
      const h = 3 + hash01(col, i + 2) * 10;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + h).toFixed(1)}" stroke="rgba(${pick(p.strokes, col, i)},${labOp(0.09 + hash01(col, i) * 0.08).toFixed(3)})" stroke-width="0.55" stroke-linecap="round"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildSteelHatch(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 20; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.8, i)) continue;
    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const ang = -0.7 + (hash01(i, 3) - 0.5) * 0.15;
    const count = 4 + Math.floor(hash01(i, 4) * 4);
    for (let k = 0; k < count; k += 1) {
      const ox = Math.cos(ang + Math.PI / 2) * k * 2.2;
      const oy = Math.sin(ang + Math.PI / 2) * k * 2.2;
      const len = 10 + hash01(i, k) * 14;
      parts.push(
        `<line x1="${(x0 + ox).toFixed(1)}" y1="${(y0 + oy).toFixed(1)}" x2="${(x0 + ox + Math.cos(ang) * len).toFixed(1)}" y2="${(y0 + oy + Math.sin(ang) * len).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, k)},${labOp(0.09).toFixed(3)})" stroke-width="0.5"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildVoidNodes(p: LabPalette): string {
  const parts: string[] = [];
  const nodes: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.42 + hash01(i * 1.8, 1.2) * 0.6;
    const ny = hash01(i * 2.0, 3.1);
    if (!place(nx, ny, 0.8, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    nodes.push({ x, y, i });
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.9 + hash01(i, 4) * 0.8).toFixed(1)}" fill="rgba(${pick(p.accent, i, 1)},${labOp(0.16).toFixed(3)})"/>`
    );
  }
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i]!;
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j]!;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 36 || dist < 10) continue;
      if (hash01(i, j) > 0.35) continue;
      parts.push(
        `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, j)},${labOp(0.07).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildRidgeFold(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.78, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 14 + hash01(i, 3) * 22;
    const rot = ((hash01(i, 4) - 0.5) * 24).toFixed(1);
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M${(-s).toFixed(1)} ${(-s * 0.15).toFixed(1)} L0 ${(s * 0.55).toFixed(1)} L${s.toFixed(1)} ${(-s * 0.15).toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.11).toFixed(3)})" stroke-width="0.7" stroke-linejoin="miter"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildSignalBars(p: LabPalette): string {
  const parts: string[] = [];
  for (let col = 0; col < 12; col += 1) {
    const nx = 0.46 + col * 0.048;
    const x = nx * CANVAS_W;
    for (let row = 0; row < 8; row += 1) {
      const ny = 0.12 + row * 0.11 + hash01(col, row) * 0.02;
      if (!place(nx, ny, 0.72, col * 10 + row)) continue;
      const y = ny * CANVAS_H;
      const h = 8 + hash01(col, row + 3) * 22;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + h).toFixed(1)}" stroke="rgba(${pick(p.strokes, col, row)},${labOp(0.1).toFixed(3)})" stroke-width="${(0.8 + hash01(col, row) * 0.7).toFixed(2)}" stroke-linecap="round"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildMirrorFacet(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const nx = 0.44 + hash01(i, 1) * 0.56;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.78, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 10 + hash01(i, 3) * 16;
    const rot = ((hash01(i, 4) - 0.5) * 18).toFixed(1);
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M0 ${(-s).toFixed(1)} L${s.toFixed(1)} 0 L0 ${s.toFixed(1)} L${(-s).toFixed(1)} 0 Z" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.11).toFixed(3)})" stroke-width="0.65"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildTracePath(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 9; i += 1) {
    const y0 = 50 + i * 42 + hash01(i, 1) * 12;
    const c1y = y0 + (hash01(i, 2) - 0.5) * 40;
    const c2y = y0 + (hash01(i, 3) - 0.5) * 40;
    const y1 = y0 + (hash01(i, 4) - 0.5) * 30;
    const d = `M${CANVAS_W * 0.4} ${y0.toFixed(1)} C${CANVAS_W * 0.58} ${c1y.toFixed(1)} ${CANVAS_W * 0.78} ${c2y.toFixed(1)} ${CANVAS_W - 12} ${y1.toFixed(1)}`;
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.09 + hash01(i, 5) * 0.06).toFixed(3)})" stroke-width="${(0.6 + hash01(i, 6) * 0.5).toFixed(2)}" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildMonoChevron(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 24; i += 1) {
    const nx = 0.44 + hash01(i * 1.7, 1.2) * 0.58;
    const ny = hash01(i * 2.0, 3.2);
    if (!place(nx, ny, 0.8, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 7 + hash01(i, 4) * 11;
    const rot = ((hash01(i, 5) - 0.5) * 14).toFixed(1);
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M${(-s).toFixed(1)} ${(-s * 0.2).toFixed(1)} L0 ${s.toFixed(1)} L${s.toFixed(1)} ${(-s * 0.2).toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.11).toFixed(3)})" stroke-width="0.65" stroke-linejoin="miter"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 縦ヘアライン — ブラッシュドスチール */
function buildBrushedSteel(p: LabPalette): string {
  const parts: string[] = [];
  const cols = 64;
  for (let c = 0; c < cols; c += 1) {
    const x = (c / cols) * CANVAS_W + hash01(c, 1) * 1.1;
    const nx = x / CANVAS_W;
    for (let s = 0; s < 9; s += 1) {
      const t0 = s / 9;
      const t1 = (s + 1) / 9;
      const y0 = t0 * CANVAS_H + hash01(c, s) * 2;
      const y1 = t1 * CANVAS_H - hash01(c + 1, s) * 2;
      const my = (t0 + t1) / 2;
      if (!place(nx, my, 0.95, c * 10 + s)) continue;
      const inset = hash01(c, s + 7) * 3;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${(y0 + inset).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y1 - inset).toFixed(1)}" stroke="rgba(${pick(p.strokes, c, s)},${labOp(0.05 + hash01(c, s + 3) * 0.09).toFixed(3)})" stroke-width="${(0.25 + hash01(c, s + 5) * 0.4).toFixed(2)}" stroke-linecap="round"/>`
      );
      if (hash01(c, s + 9) > 0.9) {
        parts.push(
          `<line x1="${(x + 0.55).toFixed(1)}" y1="${(y0 + 5).toFixed(1)}" x2="${(x + 0.55).toFixed(1)}" y2="${(y0 + 16 + hash01(c, s) * 18).toFixed(1)}" stroke="rgba(${pick(p.accent, c, s)},${labOp(0.14).toFixed(3)})" stroke-width="0.28"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 液態クロム — スペキュラーリボン */
function buildLiquidChrome(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const nx = 0.4 + hash01(i * 1.7, 2) * 0.62;
    const ny = hash01(i * 2.3, 3.1);
    if (!place(nx, ny, 0.88, i)) continue;
    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const span = 48 + hash01(i, 4) * 85;
    const amp = 9 + hash01(i, 5) * 24;
    const ang = -0.4 + (hash01(i, 6) - 0.5) * 0.75;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const x1 = x0 + cos * span * 0.33 - sin * amp;
    const y1 = y0 + sin * span * 0.33 + cos * amp;
    const x2 = x0 + cos * span * 0.66 + sin * amp * 0.7;
    const y2 = y0 + sin * span * 0.66 - cos * amp * 0.7;
    const x3 = x0 + cos * span;
    const y3 = y0 + sin * span;
    const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}`;
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.09 + hash01(i, 7) * 0.1).toFixed(3)})" stroke-width="${(1.1 + hash01(i, 8) * 1.4).toFixed(2)}" stroke-linecap="round"/>`
    );
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.accent, i, 2)},${labOp(0.14).toFixed(3)})" stroke-width="0.4" stroke-linecap="round"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** ダマスカス波紋 */
function buildDamascusWave(p: LabPalette): string {
  const parts: string[] = [];
  for (let b = 0; b < 24; b += 1) {
    const baseY = (b / 24) * CANVAS_H + hash01(b, 1) * 4;
    const amp = 4 + hash01(b, 2) * 9;
    const freq = 1.8 + hash01(b, 3) * 2.2;
    const phase = hash01(b, 4) * Math.PI * 2;
    let d = "";
    let kept = false;
    for (let s = 0; s <= 22; s += 1) {
      const t = s / 22;
      const x = t * CANVAS_W;
      const y =
        baseY +
        Math.sin(t * Math.PI * freq + phase) * amp +
        Math.sin(t * Math.PI * freq * 1.7 + phase * 1.3) * amp * 0.35;
      if (!place(t, Math.min(1, Math.max(0, y / CANVAS_H)), 1.0, b * 30 + s)) {
        if (kept && d) {
          parts.push(
            `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, b, s)},${labOp(0.07 + hash01(b, s) * 0.08).toFixed(3)})" stroke-width="${(0.45 + hash01(b, 6) * 0.55).toFixed(2)}" stroke-linecap="round"/>`
          );
          d = "";
          kept = false;
        }
        continue;
      }
      d += kept ? ` L${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`;
      kept = true;
    }
    if (kept && d) {
      parts.push(
        `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, b, 7)},${labOp(0.07 + hash01(b, 8) * 0.08).toFixed(3)})" stroke-width="${(0.45 + hash01(b, 9) * 0.55).toFixed(2)}" stroke-linecap="round"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** ガンメタルフレーク */
function buildGunmetalFlake(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    const nx = 0.4 + hash01(i * 1.8, 1.3) * 0.62;
    const ny = hash01(i * 2.0, 3.4);
    if (!place(nx, ny, 0.85, i)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 5 + hash01(i, 4) * 11;
    const rot = ((hash01(i, 5) - 0.5) * 40).toFixed(1);
    const stretch = 0.55 + hash01(i, 6) * 0.5;
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="M0 ${(-s).toFixed(1)} L${(s * stretch).toFixed(1)} 0 L0 ${(s * 0.7).toFixed(1)} L${(-s * 0.55).toFixed(1)} 0 Z" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.1).toFixed(3)})" stroke-width="0.55"/>` +
        `<line x1="${(-s * 0.2).toFixed(1)}" y1="${(-s * 0.35).toFixed(1)}" x2="${(s * 0.25).toFixed(1)}" y2="${(s * 0.1).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 1)},${labOp(0.12).toFixed(3)})" stroke-width="0.35"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** ローズゴールド刷毛目 */
function buildRoseMetal(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 48; i += 1) {
    const nx = 0.38 + hash01(i * 1.6, 1.2) * 0.64;
    const ny = hash01(i * 2.0, 3.0);
    if (!place(nx, ny, 0.9, i)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 14 + hash01(i, 4) * 28;
    const ang = -0.15 + (hash01(i, 5) - 0.5) * 0.2;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(ang) * len).toFixed(1)}" y2="${(y + Math.sin(ang) * len).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.08 + hash01(i, 6) * 0.09).toFixed(3)})" stroke-width="${(0.4 + hash01(i, 7) * 0.55).toFixed(2)}" stroke-linecap="round"/>`
    );
    if (hash01(i, 8) > 0.82) {
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${(y - 0.8).toFixed(1)}" x2="${(x + Math.cos(ang) * len * 0.45).toFixed(1)}" y2="${(y - 0.8 + Math.sin(ang) * len * 0.45).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 1)},${labOp(0.13).toFixed(3)})" stroke-width="0.3"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 陽極酸化ブルー */
function buildAnodizedBlue(p: LabPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const nx = 0.42 + hash01(i, 1) * 0.58;
    const ny = hash01(i, 2);
    if (!place(nx, ny, 0.85, i)) continue;
    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const span = 40 + hash01(i, 3) * 70;
    const amp = 6 + hash01(i, 4) * 16;
    const ang = -0.55 + (hash01(i, 5) - 0.5) * 0.35;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(x0 + cos * span * 0.35 - sin * amp).toFixed(1)} ${(y0 + sin * span * 0.35 + cos * amp).toFixed(1)} ${(x0 + cos * span * 0.7 + sin * amp * 0.5).toFixed(1)} ${(y0 + sin * span * 0.7 - cos * amp * 0.5).toFixed(1)} ${(x0 + cos * span).toFixed(1)} ${(y0 + sin * span).toFixed(1)}`;
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${labOp(0.1 + hash01(i, 6) * 0.08).toFixed(3)})" stroke-width="${(0.9 + hash01(i, 7) * 1.1).toFixed(2)}" stroke-linecap="round"/>`
    );
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${labOp(0.12).toFixed(3)})" stroke-width="0.35" stroke-linecap="round"/>`
    );
  }
  for (let i = 0; i < 20; i += 1) {
    const nx = 0.5 + hash01(i + 40, 1) * 0.5;
    const ny = hash01(i + 40, 2);
    if (!place(nx, ny, 0.7, i + 40)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 8 + hash01(i, 3) * 14).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 2)},${labOp(0.1).toFixed(3)})" stroke-width="0.35"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildHudSvg(variant: ProfilePlanProLabBgVariant): string {
  const { hudPrimary, hudSecondary } = PALETTES[variant];
  const g: string[] = [];
  const op = (n: number) => labOp(n);
  g.push(
    `<path d="M278 28 h8 v8" fill="none" stroke="${hudPrimary}${op(0.14)})" stroke-width="0.6"/>`
  );
  g.push(
    `<line x1="208" y1="48" x2="268" y2="48" stroke="${hudSecondary}${op(0.08)})" stroke-width="0.4"/>`
  );
  for (let i = 0; i < 4; i += 1) {
    g.push(
      `<circle cx="${230 + i * 10}" cy="36" r="0.8" fill="${hudPrimary}${op(0.12)})"/>`
    );
  }
  g.push(
    `<line x1="18" y1="408" x2="62" y2="408" stroke="${hudPrimary}${op(0.08)})" stroke-width="0.4"/>`
  );
  return wrapSvg(g.join(""));
}

function buildSkinSvg(variant: ProfilePlanProLabBgVariant): string {
  const p = PALETTES[variant];
  activeOpacityMul = p.opacityMul ?? 1;
  try {
    switch (variant) {
      case "lab-quiet-hex":
        return buildQuietHex(p);
      case "lab-blade-rain":
        return buildBladeRain(p);
      case "lab-carbon-twill":
        return buildCarbonTwill(p);
      case "lab-soft-contour":
        return buildSoftContour(p);
      case "lab-bracket-marks":
        return buildBracketMarks(p);
      case "lab-orbit-rings":
        return buildOrbitRings(p);
      case "lab-graphite-mesh":
        return buildGraphiteMesh(p);
      case "lab-ivory-vein":
        return buildIvoryVein(p);
      case "lab-night-ledger":
        return buildNightLedger(p);
      case "lab-steel-hatch":
        return buildSteelHatch(p);
      case "lab-void-nodes":
        return buildVoidNodes(p);
      case "lab-ridge-fold":
        return buildRidgeFold(p);
      case "lab-signal-bars":
        return buildSignalBars(p);
      case "lab-mirror-facet":
        return buildMirrorFacet(p);
      case "lab-trace-path":
        return buildTracePath(p);
      case "lab-mono-chevron":
        return buildMonoChevron(p);
      case "lab-brushed-steel":
        return buildBrushedSteel(p);
      case "lab-liquid-chrome":
        return buildLiquidChrome(p);
      case "lab-damascus-wave":
        return buildDamascusWave(p);
      case "lab-gunmetal-flake":
        return buildGunmetalFlake(p);
      case "lab-rose-metal":
        return buildRoseMetal(p);
      case "lab-anodized-blue":
        return buildAnodizedBlue(p);
      default:
        return wrapSvg("");
    }
  } finally {
    activeOpacityMul = 1;
  }
}

const CACHE_VER = "v3";

export function getProfilePlanProLabSkinSvg(
  variant: ProfilePlanProLabBgVariant
): string {
  return cachedSvg(`lab:skin:svg:${variant}:${CACHE_VER}`, () =>
    buildSkinSvg(variant)
  );
}

export function getProfilePlanProLabHudSvg(
  variant: ProfilePlanProLabBgVariant
): string {
  return cachedSvg(`lab:hud:svg:${variant}:${CACHE_VER}`, () =>
    buildHudSvg(variant)
  );
}

export function getProfilePlanProLabSkinUrl(
  variant: ProfilePlanProLabBgVariant
): string {
  return cachedUrl(`lab:skin:${variant}:${CACHE_VER}`, () =>
    buildSkinSvg(variant)
  );
}

export function getProfilePlanProLabHudUrl(
  variant: ProfilePlanProLabBgVariant
): string {
  return cachedUrl(`lab:hud:${variant}:${CACHE_VER}`, () => buildHudSvg(variant));
}

export const PROFILE_PLAN_PRO_LAB_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
