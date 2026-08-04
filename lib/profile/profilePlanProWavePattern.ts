/**
 * PRO 背景 — Wave9（テーマ参考パターン）
 * PNG 直貼り禁止。参考画像の「密度・コントラスト・立体感」を優先。
 * UI 可読のため中央は少し弱めるが、端寄せだけで薄くはしない。
 */
import type { ProfilePlanProWaveBgVariant } from "./profilePlanProWaveBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;
export const PROFILE_PLAN_PRO_WAVE_OPACITY_SCALE = 1.85;

type WavePalette = {
  strokes: readonly string[];
  fills: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProWaveBgVariant, WavePalette> = {
  "wave-royal-plum": {
    strokes: ["180,120,110", "210,155,130", "140,85,100", "230,180,150"],
    fills: ["60,25,50", "40,15,35", "80,35,60"],
    accent: ["230,185,150", "190,130,110"],
    hudPrimary: "rgba(210,155,130,",
    hudSecondary: "rgba(180,120,110,",
    opacityMul: 1.35,
  },
  "wave-obsidian-warp": {
    strokes: ["90,95,105", "140,148,160", "55,58,65", "170,178,190"],
    fills: ["22,24,28", "38,42,48", "12,13,15", "55,60,68"],
    accent: ["190,198,210", "110,118,130"],
    hudPrimary: "rgba(160,168,180,",
    hudSecondary: "rgba(120,128,140,",
    opacityMul: 1.4,
  },
  "wave-cyan-grid": {
    strokes: ["0,200,230", "80,240,255", "0,140,170", "140,250,255"],
    fills: ["0,40,55", "0,60,80"],
    accent: ["200,255,255", "60,220,255"],
    hudPrimary: "rgba(80,240,255,",
    hudSecondary: "rgba(0,200,230,",
    opacityMul: 0.88,
  },
  "wave-ember-hex": {
    strokes: ["32,8,4", "58,16,8", "16,4,2"],
    fills: ["140,24,8", "210,70,24", "95,16,6", "210,110,30"],
    accent: ["220,140,48", "210,80,32"],
    hudPrimary: "rgba(220,100,36,",
    hudSecondary: "rgba(180,40,16,",
    opacityMul: 0.72,
  },
  "wave-neon-ridge": {
    strokes: ["255,40,160", "40,230,255", "200,60,255", "255,90,180"],
    fills: ["18,8,22", "8,18,28", "12,6,18"],
    accent: ["120,250,255", "255,120,200"],
    hudPrimary: "rgba(255,80,180,",
    hudSecondary: "rgba(60,230,255,",
    opacityMul: 1.45,
  },
  "wave-chem-ink": {
    strokes: ["245,245,250", "255,60,60", "160,165,175", "220,40,40"],
    fills: ["20,0,0", "0,0,0"],
    accent: ["255,90,90", "255,255,255"],
    hudPrimary: "rgba(255,80,80,",
    hudSecondary: "rgba(230,230,240,",
    opacityMul: 1.05,
  },
  "wave-gold-monogram": {
    strokes: ["170,130,32", "200,160,50", "130,95,20", "210,175,70"],
    fills: ["32,24,6", "16,12,3"],
    accent: ["210,175,70", "185,145,40"],
    hudPrimary: "rgba(200,160,50,",
    hudSecondary: "rgba(170,130,32,",
    opacityMul: 0.74,
  },
  "wave-stealth-facet": {
    strokes: ["70,75,85", "110,118,130", "40,44,50"],
    fills: ["18,20,24", "32,36,42", "10,11,13", "48,54,62", "28,30,36"],
    accent: ["150,158,170", "90,96,108"],
    hudPrimary: "rgba(140,148,160,",
    hudSecondary: "rgba(100,108,120,",
    opacityMul: 1.4,
  },
  "wave-parchment-crest": {
    strokes: ["18,12,8", "28,20,12", "12,8,5"],
    fills: ["225,200,165", "210,185,150", "195,170,135"],
    accent: ["245,230,200", "90,70,45"],
    hudPrimary: "rgba(220,195,155,",
    hudSecondary: "rgba(160,135,100,",
    opacityMul: 1.55,
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function waveOp(raw: number): number {
  return Math.min(
    1,
    Math.round(
      raw * PROFILE_PLAN_PRO_WAVE_OPACITY_SCALE * activeOpacityMul * 1000
    ) / 1000
  );
}

/** 中央は少し弱めるが、薄くならないようベース密度を高く保つ */
function densityAt(nx: number, ny: number): number {
  const edge =
    Math.pow(nx, 1.15) * 0.35 +
    Math.pow(ny, 1.2) * 0.3 +
    Math.max(0, 1 - Math.hypot((nx - 1) * 1.05, (ny - 0.05) * 1.05)) * 0.4;
  const holeDist =
    ((nx - 0.36) ** 2) / 0.1 + ((ny - 0.4) ** 2) / 0.2;
  const centerFactor = Math.min(1, 0.72 + holeDist * 0.55);
  return Math.min(1.7, (0.55 + edge) * centerFactor);
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
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
    );
  }
  return `M${pts.join(" L")} Z`;
}

function warpPoint(
  x: number,
  y: number
): { x: number; y: number } {
  const nx = x / CANVAS_W - 0.5;
  const ny = y / CANVAS_H - 0.42;
  // 左に強い pinch、右に強い bulge
  const pinch = Math.exp(-((nx + 0.3) ** 2) / 0.055 - (ny ** 2) / 0.09);
  const bulge = Math.exp(-((nx - 0.24) ** 2) / 0.07 - ((ny + 0.04) ** 2) / 0.11);
  const ang = Math.atan2(ny, nx + 0.0001);
  const pull = -28 * pinch + 34 * bulge;
  return {
    x: x + Math.cos(ang) * pull,
    y: y + Math.sin(ang) * pull * 0.9,
  };
}

/* ─── skins ─── */

function buildRoyalPlum(p: WavePalette): string {
  const parts: string[] = [];
  const step = 20;
  for (let row = -1; row < Math.ceil(CANVAS_H / step) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / step) + 2; col += 1) {
      const cx = col * step + 8;
      const cy = row * step + 8;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (!place(nx, ny, 1.2, row * 40 + col)) continue;
      const s = 16 + hash01(col, row) * 5;
      const half = s / 2;
      const stroke = pick(p.strokes, col, row);
      const fill = pick(p.fills, col + 1, row);
      const op = waveOp(0.32 + hash01(col, row) * 0.22);
      const fop = waveOp(0.18 + hash01(col + 2, row) * 0.12);
      parts.push(
        `<rect x="${(cx - half).toFixed(1)}" y="${(cy - half).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="rgba(${fill},${fop.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="1.55"/>`
      );
      parts.push(
        `<rect x="${(cx - half + 2).toFixed(1)}" y="${(cy - half + 2).toFixed(1)}" width="${(s - 4).toFixed(1)}" height="${(s - 4).toFixed(1)}" fill="none" stroke="rgba(${stroke},${(op * 0.8).toFixed(3)})" stroke-width="0.9"/>`
      );
      const ir = s * 0.24;
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${ir.toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, col, row)},${(op * 0.95).toFixed(3)})" stroke-width="1.15"/>`
      );
      parts.push(
        `<path d="M${cx.toFixed(1)} ${(cy - ir * 0.75).toFixed(1)} L${(cx + ir * 0.5).toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} ${(cy + ir * 0.75).toFixed(1)} L${(cx - ir * 0.5).toFixed(1)} ${cy.toFixed(1)} Z" fill="rgba(${pick(p.accent, row, col)},${(op * 0.45).toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.95"/>`
      );
      if (col % 2 === 0 && row % 2 === 0 && hash01(col, row + 7) > 0.4) {
        const big = step * 2 - 4;
        parts.push(
          `<rect x="${(cx - half).toFixed(1)}" y="${(cy - half).toFixed(1)}" width="${big.toFixed(1)}" height="${big.toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, col + 1, row)},${(op * 0.7).toFixed(3)})" stroke-width="1.7"/>`
        );
      }
    }
  }
  parts.push(
    `<radialGradient id="rpV" cx="50%" cy="38%" r="65%"><stop offset="0%" stop-color="rgba(180,100,120,0.16)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient><rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#rpV)"/>`
  );
  return wrapSvg(parts.join(""));
}

function buildObsidianWarp(p: WavePalette): string {
  const parts: string[] = [];
  const stepX = 13;
  const stepY = 15;
  // 面の明暗をはっきり（上面明るめ / 右暗め）
  const faceTop = ["70,76,86", "95,102,114", "55,60,70"];
  const faceLeft = ["32,36,42", "42,46,54", "24,26,32"];
  const faceRight = ["14,15,18", "20,22,26", "10,11,13"];
  for (let row = -2; row < Math.ceil(CANVAS_H / stepY) + 3; row += 1) {
    for (let col = -2; col < Math.ceil(CANVAS_W / stepX) + 3; col += 1) {
      const bx = col * stepX + (row % 2) * (stepX / 2);
      const by = row * stepY;
      const w = warpPoint(bx, by);
      const nx = w.x / CANVAS_W;
      const ny = w.y / CANVAS_H;
      if (nx < -0.08 || nx > 1.08 || ny < -0.08 || ny > 1.08) continue;
      const densNx = Math.max(0, Math.min(1, nx));
      const densNy = Math.max(0, Math.min(1, ny));
      if (!place(densNx, densNy, 1.35, row * 50 + col)) continue;
      const scale = 0.85 + densityAt(densNx, densNy) * 0.65;
      const rx = (6.2 + hash01(col, row) * 3.2) * scale;
      const ry = (7.2 + hash01(col + 1, row) * 3.8) * scale;
      const top = pick(faceTop, col, row);
      const left = pick(faceLeft, col + 2, row);
      const right = pick(faceRight, col, row + 2);
      const stroke = pick(p.strokes, col, row);
      const op = waveOp(0.55 + hash01(col, row) * 0.3);
      const cx = w.x;
      const cy = w.y;
      const topPts = `${cx.toFixed(1)},${(cy - ry).toFixed(1)} ${(cx + rx).toFixed(1)},${(cy - ry * 0.15).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.35).toFixed(1)} ${(cx - rx).toFixed(1)},${(cy - ry * 0.15).toFixed(1)}`;
      const leftPts = `${(cx - rx).toFixed(1)},${(cy - ry * 0.15).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.35).toFixed(1)} ${cx.toFixed(1)},${(cy + ry).toFixed(1)} ${(cx - rx).toFixed(1)},${(cy + ry * 0.5).toFixed(1)}`;
      const rightPts = `${(cx + rx).toFixed(1)},${(cy - ry * 0.15).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.35).toFixed(1)} ${cx.toFixed(1)},${(cy + ry).toFixed(1)} ${(cx + rx).toFixed(1)},${(cy + ry * 0.5).toFixed(1)}`;
      parts.push(
        `<polygon points="${topPts}" fill="rgba(${top},${op.toFixed(3)})" stroke="rgba(${stroke},${(op * 0.55).toFixed(3)})" stroke-width="0.5"/>`
      );
      parts.push(
        `<polygon points="${leftPts}" fill="rgba(${left},${(op * 0.95).toFixed(3)})" stroke="rgba(${stroke},${(op * 0.4).toFixed(3)})" stroke-width="0.4"/>`
      );
      parts.push(
        `<polygon points="${rightPts}" fill="rgba(${right},${op.toFixed(3)})" stroke="rgba(${stroke},${(op * 0.35).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildCyanGrid(p: WavePalette): string {
  const parts: string[] = [];
  // Layer: 背景矩形
  for (let i = 0; i < 32; i += 1) {
    const nx = 0.05 + hash01(i, 1) * 0.92;
    const ny = 0.04 + hash01(i, 2) * 0.94;
    if (!place(nx, ny, 0.95, i + 3)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const w = 28 + hash01(i, 4) * 100;
    const h = 20 + hash01(i, 5) * 80;
    const op = waveOp(0.08 + hash01(i, 6) * 0.08);
    parts.push(
      `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 2)},${op.toFixed(3)})" stroke-width="0.85"/>`
    );
  }
  // Layer: 主グリッド線
  for (let i = 0; i < 8; i += 1) {
    const x = 18 + hash01(i, 10) * (CANVAS_W - 30);
    const op = waveOp(0.2 + hash01(i, 11) * 0.16);
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="4" x2="${x.toFixed(1)}" y2="${CANVAS_H - 4}" stroke="rgba(${pick(p.strokes, i, 1)},${op.toFixed(3)})" stroke-width="${(1.05 + hash01(i, 12) * 0.9).toFixed(2)}"/>`
    );
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="4" x2="${x.toFixed(1)}" y2="${CANVAS_H - 4}" stroke="rgba(${pick(p.accent, i, 1)},${(op * 0.18).toFixed(3)})" stroke-width="${(2.6 + hash01(i, 12) * 1.2).toFixed(2)}"/>`
    );
  }
  for (let i = 0; i < 9; i += 1) {
    const y = 30 + hash01(i, 20) * (CANVAS_H - 50);
    const op = waveOp(0.18 + hash01(i, 21) * 0.14);
    parts.push(
      `<line x1="6" y1="${y.toFixed(1)}" x2="${CANVAS_W - 6}" y2="${y.toFixed(1)}" stroke="rgba(${pick(p.accent, i, 1)},${op.toFixed(3)})" stroke-width="${(1.0 + hash01(i, 22) * 0.75).toFixed(2)}"/>`
    );
    parts.push(
      `<line x1="6" y1="${y.toFixed(1)}" x2="${CANVAS_W - 6}" y2="${y.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 3)},${(op * 0.16).toFixed(3)})" stroke-width="${(2.2 + hash01(i, 22) * 0.8).toFixed(2)}"/>`
    );
  }
  // 交点フレア
  for (let i = 0; i < 12; i += 1) {
    const nx = 0.12 + hash01(i, 30) * 0.8;
    const ny = 0.1 + hash01(i, 31) * 0.8;
    if (!place(nx, ny, 0.85, i + 40)) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const op = waveOp(0.28 + hash01(i, 32) * 0.22);
    const arm = 4 + hash01(i, 35) * 3;
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.8 + hash01(i, 33) * 1.4).toFixed(1)}" fill="rgba(${pick(p.accent, i, 2)},${op.toFixed(3)})"/>`
    );
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4.5 + hash01(i, 34) * 2.5).toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 3)},${(op * 0.4).toFixed(3)})" stroke-width="0.8"/>`
    );
    parts.push(
      `<line x1="${(x - arm).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + arm).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,${(op * 0.45).toFixed(3)})" stroke-width="0.9"/>`
    );
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${(y - arm).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + arm).toFixed(1)}" stroke="rgba(255,255,255,${(op * 0.45).toFixed(3)})" stroke-width="0.9"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildEmberHex(p: WavePalette): string {
  const parts: string[] = [];
  const r = 15;
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
      if (!place(nx, ny, 0.95, row * 25 + col)) continue;
      const rr = r * (0.85 + hash01(col, row) * 0.25);
      const frame = pick(p.strokes, col, row);
      const core = pick(p.fills, col, row);
      const glow = pick(p.accent, col, row);
      const fop = waveOp(0.28 + hash01(col, row) * 0.16);
      const gop = waveOp(0.08 + hash01(col + 1, row) * 0.1);
      // 外枠（厚い黒）
      parts.push(
        `<path d="${hexPath(cx, cy, rr)}" fill="rgba(${frame},${waveOp(0.4).toFixed(3)})" stroke="rgba(0,0,0,${waveOp(0.32).toFixed(3)})" stroke-width="1.3"/>`
      );
      // 内側溶芯
      parts.push(
        `<path d="${hexPath(cx, cy, rr * 0.62)}" fill="rgba(${core},${fop.toFixed(3)})" stroke="rgba(${glow},${gop.toFixed(3)})" stroke-width="0.85"/>`
      );
      if (hash01(col, row + 3) > 0.72) {
        parts.push(
          `<path d="${hexPath(cx, cy, rr * 0.32)}" fill="rgba(${glow},${waveOp(0.14 + hash01(col, row + 4) * 0.12).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

function buildNeonRidge(p: WavePalette): string {
  const parts: string[] = [];
  const r = 14;
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
      if (!place(nx, ny, 1.1, row * 28 + col)) continue;
      const rr = r * (0.8 + hash01(col, row) * 0.3);
      const fill = pick(p.fills, col, row);
      const neon =
        nx < 0.45
          ? (p.strokes[0] ?? p.accent[0]!)
          : nx > 0.58
            ? (p.strokes[1] ?? p.accent[1]!)
            : pick(p.strokes, col, row);
      const fop = waveOp(0.7);
      const nop = waveOp(0.45 + hash01(col, row) * 0.35);
      parts.push(
        `<path d="${hexPath(cx, cy, rr)}" fill="rgba(${fill},${fop.toFixed(3)})" stroke="rgba(0,0,0,0.55)" stroke-width="1.4"/>`
      );
      // 上面エッジだけネオン（選択的発光）
      const a0 = -Math.PI / 6;
      for (let e = 0; e < 3; e += 1) {
        if (hash01(col + e, row) < 0.35) continue;
        const a1 = a0 + (Math.PI / 3) * e;
        const a2 = a1 + Math.PI / 3;
        const x1 = cx + rr * Math.cos(a1);
        const y1 = cy + rr * Math.sin(a1);
        const x2 = cx + rr * Math.cos(a2);
        const y2 = cy + rr * Math.sin(a2);
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${neon},${nop.toFixed(3)})" stroke-width="2.1" stroke-linecap="round"/>`
        );
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${neon},${(nop * 0.35).toFixed(3)})" stroke-width="4.2" stroke-linecap="round"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

function moleculeAt(
  cx: number,
  cy: number,
  r: number,
  rot: number,
  stroke: string,
  op: number,
  sw: number,
  labelChance: number,
  seed: number
): string {
  const parts: string[] = [];
  const ring: string[] = [];
  for (let k = 0; k < 6; k += 1) {
    const a = rot + (Math.PI / 3) * k;
    ring.push(
      `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
    );
  }
  parts.push(
    `<polygon points="${ring.join(" ")}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}"/>`
  );
  // 二重結合
  if (hash01(seed, 1) > 0.45) {
    const k = Math.floor(hash01(seed, 2) * 6);
    const a1 = rot + (Math.PI / 3) * k;
    const a2 = a1 + Math.PI / 3;
    const mx = (Math.cos(a1) + Math.cos(a2)) * 0.5;
    const my = (Math.sin(a1) + Math.sin(a2)) * 0.5;
    const ox = -my * 2.2;
    const oy = mx * 2.2;
    parts.push(
      `<line x1="${(cx + Math.cos(a1) * r * 0.72 + ox).toFixed(1)}" y1="${(cy + Math.sin(a1) * r * 0.72 + oy).toFixed(1)}" x2="${(cx + Math.cos(a2) * r * 0.72 + ox).toFixed(1)}" y2="${(cy + Math.sin(a2) * r * 0.72 + oy).toFixed(1)}" stroke="rgba(${stroke},${(op * 0.9).toFixed(3)})" stroke-width="${(sw * 0.75).toFixed(2)}"/>`
    );
  }
  if (hash01(seed, 3) < labelChance) {
    const a = rot + hash01(seed, 4) * Math.PI * 2;
    const lx = cx + Math.cos(a) * (r + 11);
    const ly = cy + Math.sin(a) * (r + 11);
    parts.push(
      `<line x1="${(cx + Math.cos(a) * r).toFixed(1)}" y1="${(cy + Math.sin(a) * r).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="rgba(${stroke},${(op * 0.9).toFixed(3)})" stroke-width="${(sw * 0.85).toFixed(2)}"/>`
    );
    const label = pick(["N", "O", "OH", "CH3", "NH"], seed, 5);
    parts.push(
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="rgba(${stroke},${Math.min(1, op * 1.15).toFixed(3)})" font-size="${(8 + sw).toFixed(0)}" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>`
    );
  }
  return parts.join("");
}

function buildChemInk(p: WavePalette): string {
  const parts: string[] = [];
  // Layer 3: 薄い背景分子
  for (let i = 0; i < 32; i += 1) {
    const nx = hash01(i, 1);
    const ny = hash01(i, 2);
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 6 + hash01(i, 3) * 8;
    const op = waveOp(0.09 + hash01(i, 4) * 0.08);
    parts.push(
      moleculeAt(
        cx,
        cy,
        r,
        hash01(i, 5) * Math.PI,
        pick(p.strokes, 2, i),
        op,
        0.6,
        0.25,
        i
      )
    );
  }
  // Layer 2: 中間
  for (let i = 0; i < 14; i += 1) {
    const nx = 0.08 + hash01(i + 40, 1) * 0.86;
    const ny = 0.08 + hash01(i + 40, 2) * 0.86;
    if (!place(nx, ny, 1.05, i + 50)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 11 + hash01(i, 6) * 10;
    const isRed = hash01(i, 7) > 0.48;
    const stroke = isRed ? p.strokes[1]! : p.strokes[0]!;
    const op = waveOp(0.28 + hash01(i, 8) * 0.18);
    parts.push(
      moleculeAt(cx, cy, r, hash01(i, 9) * Math.PI, stroke, op, 1.3, 0.5, i + 60)
    );
  }
  // Layer 1: 前景（少し控えめ）
  for (let i = 0; i < 8; i += 1) {
    const nx = 0.15 + hash01(i + 80, 1) * 0.75;
    const ny = 0.12 + hash01(i + 80, 2) * 0.75;
    if (!place(nx, ny, 0.95, i + 90)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 16 + hash01(i, 10) * 12;
    const isRed = hash01(i, 11) > 0.38;
    const stroke = isRed ? p.strokes[3]! : p.strokes[0]!;
    const op = waveOp(0.5 + hash01(i, 12) * 0.22);
    parts.push(
      moleculeAt(cx, cy, r, hash01(i, 13) * Math.PI, stroke, op, 2.0, 0.7, i + 100)
    );
  }
  return wrapSvg(parts.join(""));
}

function buildGoldMonogram(p: WavePalette): string {
  const parts: string[] = [];
  const stepX = 24;
  const stepY = 22;
  for (let row = -1; row < Math.ceil(CANVAS_H / stepY) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / stepX) + 2; col += 1) {
      const cx = col * stepX + (row % 2) * (stepX / 2) + 4;
      const cy = row * stepY + 6;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (!place(nx, ny, 1.0, row * 30 + col)) continue;
      const centerBoost =
        1 - Math.min(1, Math.hypot(nx - 0.5, ny - 0.38) * 1.05);
      const op = waveOp(
        (0.16 + hash01(col, row) * 0.12) * (0.55 + centerBoost * 0.45)
      );
      const r = 4.6 + hash01(col, row) * 2.0 + centerBoost * 1.1;
      const stroke = pick(p.strokes, col, row);
      const fill = pick(p.accent, col, row);
      const petals: string[] = [];
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        petals.push(
          `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(1.15 + centerBoost * 0.28).toFixed(1)}" fill="rgba(${fill},${op.toFixed(3)})"/>`
        );
      }
      parts.push(petals.join(""));
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.25 + centerBoost * 0.45).toFixed(1)}" fill="rgba(${stroke},${Math.min(1, op * 1.05).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

function buildStealthFacet(p: WavePalette): string {
  const parts: string[] = [];
  const cell = 16;
  // コントラストを広げた面色（塗りのみ・線なし）
  const facets = [
    "8,9,11",
    "18,20,24",
    "32,36,42",
    "48,54,62",
    "62,70,80",
    "14,15,18",
    "28,32,38",
  ];
  for (let row = 0; row < Math.ceil(CANVAS_H / cell) + 1; row += 1) {
    for (let col = 0; col < Math.ceil(CANVAS_W / cell) + 1; col += 1) {
      const x0 = col * cell;
      const y0 = row * cell;
      const mode = Math.floor(hash01(col, row) * 4);
      const f1 = pick(facets, col, row);
      const f2 = pick(facets, col + 3, row + 1);
      const op = waveOp(0.85 + hash01(col, row) * 0.15);
      const op2 = waveOp(0.8 + hash01(col + 1, row) * 0.18);
      if (mode === 0) {
        parts.push(
          `<polygon points="${x0},${y0} ${x0 + cell},${y0} ${x0},${y0 + cell}" fill="rgba(${f1},${op.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0 + cell},${y0} ${x0 + cell},${y0 + cell} ${x0},${y0 + cell}" fill="rgba(${f2},${op2.toFixed(3)})"/>`
        );
      } else if (mode === 1) {
        parts.push(
          `<polygon points="${x0},${y0} ${x0 + cell},${y0} ${x0 + cell},${y0 + cell}" fill="rgba(${f1},${op.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0},${y0} ${x0 + cell},${y0 + cell} ${x0},${y0 + cell}" fill="rgba(${f2},${op2.toFixed(3)})"/>`
        );
      } else if (mode === 2) {
        const mx = x0 + cell / 2;
        const my = y0 + cell / 2;
        parts.push(
          `<polygon points="${x0},${y0} ${x0 + cell},${y0} ${mx},${my}" fill="rgba(${f1},${op.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0 + cell},${y0} ${x0 + cell},${y0 + cell} ${mx},${my}" fill="rgba(${f2},${op2.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0 + cell},${y0 + cell} ${x0},${y0 + cell} ${mx},${my}" fill="rgba(${pick(facets, col, row + 2)},${op.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0},${y0 + cell} ${x0},${y0} ${mx},${my}" fill="rgba(${pick(facets, col + 2, row)},${op2.toFixed(3)})"/>`
        );
      } else {
        parts.push(
          `<rect x="${x0}" y="${y0}" width="${cell}" height="${cell}" fill="rgba(${f1},${op.toFixed(3)})"/>`
        );
        parts.push(
          `<polygon points="${x0},${y0} ${x0 + cell},${y0} ${x0 + cell * 0.5},${y0 + cell * 0.55}" fill="rgba(${f2},${(op * 0.85).toFixed(3)})"/>`
        );
      }
    }
  }
  parts.push(
    `<radialGradient id="sfV" cx="50%" cy="40%" r="78%"><stop offset="50%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.65)"/></radialGradient><rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#sfV)"/>`
  );
  return wrapSvg(parts.join(""));
}

function buildParchmentCrest(p: WavePalette): string {
  const parts: string[] = [];
  // 不透明に近い羊皮紙地（暗カード上でも地色が見える）
  const paper = p.fills[0] ?? "225,200,165";
  parts.push(
    `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="rgba(${paper},${waveOp(0.72).toFixed(3)})"/>`
  );
  // 細かい紙粒
  for (let i = 0; i < 100; i += 1) {
    const x = hash01(i, 1) * CANVAS_W;
    const y = hash01(i, 2) * CANVAS_H;
    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + hash01(i, 3)).toFixed(1)}" fill="rgba(55,40,25,${waveOp(0.1 + hash01(i, 4) * 0.1).toFixed(3)})"/>`
    );
  }
  const step = 24;
  for (let row = -1; row < Math.ceil(CANVAS_H / step) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / step) + 2; col += 1) {
      const ox = (row % 2) * (step / 2);
      const cx = col * step + ox + 4;
      const cy = row * step + 6;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      // ほぼ全面に置く（欠けは少なめ）
      if (!place(nx, ny, 1.45, row * 22 + col)) continue;
      const r = 9.5 + hash01(col, row) * 4;
      const ink = pick(p.strokes, col, row);
      const op = waveOp(0.78 + hash01(col, row) * 0.2);
      // ゴシック十字（太い塗り）
      for (let k = 0; k < 4; k += 1) {
        const a = -Math.PI / 2 + (Math.PI / 2) * k;
        const tipX = cx + Math.cos(a) * r;
        const tipY = cy + Math.sin(a) * r;
        const leftA = a - 0.28;
        const rightA = a + 0.28;
        const mid = r * 0.48;
        const arm = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${(cx + Math.cos(rightA) * mid).toFixed(1)},${(cy + Math.sin(rightA) * mid).toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + Math.cos(leftA) * mid).toFixed(1)},${(cy + Math.sin(leftA) * mid).toFixed(1)}`;
        parts.push(
          `<polygon points="${arm}" fill="rgba(${ink},${op.toFixed(3)})"/>`
        );
      }
      // 翼状フロリッシュ（太め）
      for (let k = 0; k < 4; k += 1) {
        const a = -Math.PI / 2 + (Math.PI / 2) * k + Math.PI / 4;
        parts.push(
          `<path d="M${(cx + Math.cos(a) * r * 0.18).toFixed(1)} ${(cy + Math.sin(a) * r * 0.18).toFixed(1)} Q${(cx + Math.cos(a) * r * 0.78).toFixed(1)} ${(cy + Math.sin(a) * r * 0.78).toFixed(1)} ${(cx + Math.cos(a - 0.55) * r * 1.08).toFixed(1)} ${(cy + Math.sin(a - 0.55) * r * 1.08).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.85"/>`
        );
        parts.push(
          `<path d="M${(cx + Math.cos(a) * r * 0.18).toFixed(1)} ${(cy + Math.sin(a) * r * 0.18).toFixed(1)} Q${(cx + Math.cos(a) * r * 0.78).toFixed(1)} ${(cy + Math.sin(a) * r * 0.78).toFixed(1)} ${(cx + Math.cos(a + 0.55) * r * 1.08).toFixed(1)} ${(cy + Math.sin(a + 0.55) * r * 1.08).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.85"/>`
        );
      }
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6" fill="rgba(${ink},${op.toFixed(3)})"/>`
      );
    }
  }
  // 端だけ落とす（中央は読める）
  parts.push(
    `<radialGradient id="pcV" cx="50%" cy="42%" r="78%"><stop offset="55%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.42)"/></radialGradient><rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#pcV)"/>`
  );
  return wrapSvg(parts.join(""));
}

function buildHud(p: WavePalette): string {
  const parts: string[] = [];
  const corners: [number, number, number, number][] = [
    [10, 12, 1, 1],
    [CANVAS_W - 10, 12, -1, 1],
    [10, CANVAS_H - 14, 1, -1],
    [CANVAS_W - 10, CANVAS_H - 14, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    const op = waveOp(0.22);
    parts.push(
      `<path d="M${x} ${y + sy * 16} L${x} ${y} L${x + sx * 16} ${y}" fill="none" stroke="${p.hudPrimary}${op})" stroke-width="1.35"/>`
    );
  }
  for (let i = 0; i < 10; i += 1) {
    const y = 50 + i * 36;
    if (y > CANVAS_H - 36) continue;
    const op = waveOp(0.12 + hash01(i, 2) * 0.08);
    parts.push(
      `<line x1="${CANVAS_W - 20}" y1="${y}" x2="${CANVAS_W - 7}" y2="${y}" stroke="${p.hudSecondary}${op})" stroke-width="1.1"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildSkinSvg(variant: ProfilePlanProWaveBgVariant): string {
  const p = PALETTES[variant];
  activeOpacityMul = p.opacityMul ?? 1;
  switch (variant) {
    case "wave-royal-plum":
      return buildRoyalPlum(p);
    case "wave-obsidian-warp":
      return buildObsidianWarp(p);
    case "wave-cyan-grid":
      return buildCyanGrid(p);
    case "wave-ember-hex":
      return buildEmberHex(p);
    case "wave-neon-ridge":
      return buildNeonRidge(p);
    case "wave-chem-ink":
      return buildChemInk(p);
    case "wave-gold-monogram":
      return buildGoldMonogram(p);
    case "wave-stealth-facet":
      return buildStealthFacet(p);
    case "wave-parchment-crest":
      return buildParchmentCrest(p);
    default:
      return wrapSvg("");
  }
}

const CACHE_VER = "v7-soften-gold-ember";

export function getProfilePlanProWaveSkinSvg(
  variant: ProfilePlanProWaveBgVariant
): string {
  return cachedSvg(`wave:skin:svg:${variant}:${CACHE_VER}`, () =>
    buildSkinSvg(variant)
  );
}

export function getProfilePlanProWaveHudSvg(
  variant: ProfilePlanProWaveBgVariant
): string {
  return cachedSvg(`wave:hud:svg:${variant}:${CACHE_VER}`, () => {
    const p = PALETTES[variant];
    activeOpacityMul = p.opacityMul ?? 1;
    return buildHud(p);
  });
}

export function getProfilePlanProWaveSkinUrl(
  variant: ProfilePlanProWaveBgVariant
): string {
  return cachedUrl(`wave:skin:${variant}:${CACHE_VER}`, () =>
    buildSkinSvg(variant)
  );
}

export function getProfilePlanProWaveHudUrl(
  variant: ProfilePlanProWaveBgVariant
): string {
  return cachedUrl(`wave:hud:${variant}:${CACHE_VER}`, () => {
    const p = PALETTES[variant];
    activeOpacityMul = p.opacityMul ?? 1;
    return buildHud(p);
  });
}

export const PROFILE_PLAN_PRO_WAVE_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
