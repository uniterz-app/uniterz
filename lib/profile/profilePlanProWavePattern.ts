/**
 * PRO 背景 — Wave テーマ参考パターン
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
    strokes: ["190,205,225", "140,155,175", "230,238,250"],
    fills: ["28,34,44", "16,18,24"],
    accent: ["255,255,255", "120,200,255"],
    hudPrimary: "rgba(200,215,235,",
    hudSecondary: "rgba(140,160,185,",
    opacityMul: 1.35,
  },
  "wave-parchment-crest": {
    strokes: ["245,220,160", "220,185,115", "255,240,200"],
    fills: ["42,32,22", "28,20,14"],
    accent: ["255,236,190", "170,130,70"],
    hudPrimary: "rgba(245,220,160,",
    hudSecondary: "rgba(200,165,100,",
    opacityMul: 1.4,
  },
  "wave-crimson-shard": {
    strokes: ["255,50,50", "220,30,40", "160,20,28", "255,120,100"],
    fills: ["18,18,20", "32,34,38", "10,10,12", "48,50,56"],
    accent: ["255,70,70", "255,160,140"],
    hudPrimary: "rgba(255,70,70,",
    hudSecondary: "rgba(180,40,50,",
    opacityMul: 1.25,
  },
  "wave-signal-mosaic": {
    strokes: ["255,40,40", "0,160,170", "255,90,70", "0,120,140"],
    fills: ["0,0,0", "8,20,24"],
    accent: ["255,80,60", "40,210,220"],
    hudPrimary: "rgba(255,60,50,",
    hudSecondary: "rgba(0,180,190,",
    opacityMul: 0.72,
  },
  "wave-riot-shard": {
    strokes: ["255,20,20", "200,0,0", "80,80,85", "40,40,44"],
    fills: ["255,30,30", "180,10,10", "55,55,60", "20,20,22"],
    accent: ["255,60,60", "120,120,128"],
    hudPrimary: "rgba(255,40,40,",
    hudSecondary: "rgba(160,160,168,",
    opacityMul: 1.2,
  },
  "wave-inferno-decal": {
    strokes: ["255,30,30", "255,70,40", "220,10,20"],
    fills: ["255,35,35", "230,20,20"],
    accent: ["255,90,60", "255,180,120"],
    hudPrimary: "rgba(255,50,40,",
    hudSecondary: "rgba(200,30,30,",
    opacityMul: 1.3,
  },
  /** ロゴ画像スキン — HUD のみ SVG。本体は PNG レイヤー */
  "wave-uniterz-logo": {
    strokes: ["120,240,255", "80,220,255", "200,250,255"],
    fills: ["0,20,28", "0,8,12"],
    accent: ["180,250,255", "100,230,255"],
    hudPrimary: "rgba(120,240,255,",
    hudSecondary: "rgba(80,220,255,",
    opacityMul: 0.85,
  },
  /** サイバー六角 — Native/ランキングは SVG。Web は CSS タイル */
  "wave-mono-hex": {
    strokes: ["26,95,112", "10,40,52", "6,28,36"],
    fills: ["26,95,112", "4,18,26", "2,6,10"],
    accent: ["40,120,140", "20,70,85"],
    hudPrimary: "rgba(40,120,140,",
    hudSecondary: "rgba(20,70,85,",
    opacityMul: 0.72,
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
  // 全面塗りはしない（暗カードが地）。明るい稜線の切子だけ載せる。
  const cell = 28;
  for (let row = -1; row < Math.ceil(CANVAS_H / cell) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / cell) + 2; col += 1) {
      const x0 = col * cell + (row % 2) * (cell * 0.2);
      const y0 = row * cell;
      const nx = (x0 + cell / 2) / CANVAS_W;
      const ny = (y0 + cell / 2) / CANVAS_H;
      if (!place(nx, ny, 1.35, row * 31 + col)) continue;
      const mode = Math.floor(hash01(col, row) * 3);
      const stroke = pick(p.strokes, col, row);
      const accent = pick(p.accent, col + 1, row);
      const op = waveOp(0.55 + hash01(col, row) * 0.35);
      const sw = 1.35 + hash01(col, row + 2) * 0.9;
      const x1 = x0 + cell;
      const y1 = y0 + cell;
      const mx = x0 + cell * 0.5;
      const my = y0 + cell * 0.5;
      if (mode === 0) {
        parts.push(
          `<polygon points="${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y0.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}"/>`
        );
        parts.push(
          `<polygon points="${x1.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="rgba(${stroke},${(op * 0.75).toFixed(3)})" stroke-width="${(sw * 0.85).toFixed(2)}"/>`
        );
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x0.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(${accent},${(op * 0.55).toFixed(3)})" stroke-width="${(sw * 0.7).toFixed(2)}"/>`
        );
      } else if (mode === 1) {
        parts.push(
          `<polygon points="${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}"/>`
        );
        parts.push(
          `<polygon points="${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="rgba(${stroke},${(op * 0.75).toFixed(3)})" stroke-width="${(sw * 0.85).toFixed(2)}"/>`
        );
      } else {
        parts.push(
          `<polygon points="${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}"/>`
        );
        parts.push(
          `<polygon points="${x1.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}" fill="none" stroke="rgba(${accent},${(op * 0.7).toFixed(3)})" stroke-width="${(sw * 0.9).toFixed(2)}"/>`
        );
        parts.push(
          `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}" fill="none" stroke="rgba(${stroke},${(op * 0.8).toFixed(3)})" stroke-width="${(sw * 0.85).toFixed(2)}"/>`
        );
        parts.push(
          `<polygon points="${x0.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}" fill="none" stroke="rgba(${stroke},${(op * 0.65).toFixed(3)})" stroke-width="${(sw * 0.8).toFixed(2)}"/>`
        );
      }
      if (hash01(col, row + 9) > 0.62) {
        parts.push(
          `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${(1.4 + hash01(col, row) * 1.2).toFixed(1)}" fill="rgba(${accent},${(op * 0.55).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

function buildParchmentCrest(p: WavePalette): string {
  const parts: string[] = [];
  // 暗地はカード CSS 任せ。暖色の紋章だけを疎に・太く（SVG 肥大化を避ける）。
  const step = 48;
  for (let row = -1; row < Math.ceil(CANVAS_H / step) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / step) + 2; col += 1) {
      const ox = (row % 2) * (step / 2);
      const cx = col * step + ox + 8;
      const cy = row * step + 10;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (!place(nx, ny, 1.15, row * 19 + col)) continue;
      const r = 13 + hash01(col, row) * 5;
      const ink = pick(p.strokes, col, row);
      const glow = pick(p.accent, col + 2, row);
      const op = waveOp(0.7 + hash01(col, row) * 0.25);
      // 四芒星アーム（塗り）
      for (let k = 0; k < 4; k += 1) {
        const a = -Math.PI / 2 + (Math.PI / 2) * k;
        const tipX = cx + Math.cos(a) * r;
        const tipY = cy + Math.sin(a) * r;
        const leftA = a - 0.36;
        const rightA = a + 0.36;
        const mid = r * 0.5;
        const arm = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${(cx + Math.cos(rightA) * mid).toFixed(1)},${(cy + Math.sin(rightA) * mid).toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} ${(cx + Math.cos(leftA) * mid).toFixed(1)},${(cy + Math.sin(leftA) * mid).toFixed(1)}`;
        parts.push(
          `<polygon points="${arm}" fill="rgba(${ink},${op.toFixed(3)})"/>`
        );
      }
      // 斜め翼は1本ストロークのみ（要素数抑制）
      for (let k = 0; k < 4; k += 1) {
        const a = -Math.PI / 2 + (Math.PI / 2) * k + Math.PI / 4;
        const d = `M${(cx + Math.cos(a) * r * 0.22).toFixed(1)} ${(cy + Math.sin(a) * r * 0.22).toFixed(1)} Q${(cx + Math.cos(a) * r * 0.82).toFixed(1)} ${(cy + Math.sin(a) * r * 0.82).toFixed(1)} ${(cx + Math.cos(a + (k % 2 === 0 ? -0.55 : 0.55)) * r * 1.15).toFixed(1)} ${(cy + Math.sin(a + (k % 2 === 0 ? -0.55 : 0.55)) * r * 1.15).toFixed(1)}`;
        parts.push(
          `<path d="${d}" fill="none" stroke="rgba(${glow},${(op * 0.5).toFixed(3)})" stroke-width="3.4"/>`
        );
        parts.push(
          `<path d="${d}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.8"/>`
        );
      }
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.6" fill="rgba(${ink},${op.toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 参考1 — 黒裂晶＋右縁紅光 */
function buildCrimsonShard(p: WavePalette): string {
  const parts: string[] = [];
  const cell = 22;
  for (let row = -1; row < Math.ceil(CANVAS_H / cell) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / cell) + 2; col += 1) {
      const x0 = col * cell + hash01(col, row) * 4;
      const y0 = row * cell + hash01(row, col) * 3;
      const nx = (x0 + cell / 2) / CANVAS_W;
      const ny = (y0 + cell / 2) / CANVAS_H;
      if (!place(nx, ny, 1.4, row * 29 + col)) continue;
      const jitter = 3 + hash01(col + 2, row) * 6;
      const pts = [
        [x0 + hash01(col, 1) * jitter, y0 + hash01(row, 2) * jitter],
        [x0 + cell - hash01(col, 3) * jitter, y0 + hash01(row, 4) * 2],
        [
          x0 + cell * (0.55 + hash01(col, 5) * 0.35),
          y0 + cell - hash01(row, 6) * jitter,
        ],
        [x0 + hash01(col, 7) * 2, y0 + cell * (0.45 + hash01(row, 8) * 0.4)],
      ];
      const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      const fill = pick(p.fills, col, row);
      const fop = waveOp(0.55 + hash01(col, row) * 0.35);
      // 右縁ほど紅い稜線
      const rimBoost = Math.pow(Math.max(0, (nx - 0.35) / 0.65), 1.2);
      const rim = pick(p.strokes, col, row);
      const rop = waveOp(0.12 + rimBoost * 0.75 + hash01(col, row + 1) * 0.12);
      parts.push(
        `<polygon points="${poly}" fill="rgba(${fill},${fop.toFixed(3)})" stroke="rgba(${rim},${rop.toFixed(3)})" stroke-width="${(0.7 + rimBoost * 1.4).toFixed(2)}"/>`
      );
      if (rimBoost > 0.35 && hash01(col, row + 11) > 0.45) {
        const [ax, ay] = pts[0]!;
        const [bx, by] = pts[1]!;
        parts.push(
          `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(${p.accent[0]},${(rop * 0.85).toFixed(3)})" stroke-width="${(1.4 + rimBoost).toFixed(2)}"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 参考2 — 赤×シアンの信号モザイク（やや薄め） */
function buildSignalMosaic(p: WavePalette): string {
  const parts: string[] = [];
  const step = 22;
  for (let row = -1; row < Math.ceil(CANVAS_H / step) + 2; row += 1) {
    for (let col = -1; col < Math.ceil(CANVAS_W / step) + 2; col += 1) {
      const cx = col * step + (row % 2) * (step * 0.35) + 4;
      const cy = row * step + 4;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (!place(nx, ny, 0.85, row * 41 + col)) continue;
      const red = hash01(col, row) > 0.42;
      const ink = red ? (p.strokes[0] ?? "255,40,40") : (p.strokes[1] ?? "0,160,170");
      const glow = red ? (p.accent[0] ?? ink) : (p.accent[1] ?? ink);
      const op = waveOp((red ? 0.32 : 0.18) + hash01(col, row) * 0.2);
      const s = 4.2 + hash01(col + 1, row) * 6.5;
      const kind = Math.floor(hash01(col, row + 3) * 5);
      if (kind === 0) {
        parts.push(
          `<rect x="${(cx - s).toFixed(1)}" y="${(cy - s).toFixed(1)}" width="${(s * 2).toFixed(1)}" height="${(s * 2).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.05" transform="rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
        );
        parts.push(
          `<rect x="${(cx - s * 0.55).toFixed(1)}" y="${(cy - s * 0.55).toFixed(1)}" width="${(s * 1.1).toFixed(1)}" height="${(s * 1.1).toFixed(1)}" fill="none" stroke="rgba(${glow},${(op * 0.55).toFixed(3)})" stroke-width="0.85" transform="rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
        );
      } else if (kind === 1) {
        parts.push(
          `<rect x="${(cx - s).toFixed(1)}" y="${(cy - s).toFixed(1)}" width="${(s * 2).toFixed(1)}" height="${(s * 2).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.0"/>`
        );
        if (hash01(col, row + 5) > 0.55) {
          parts.push(
            `<rect x="${(cx - s * 0.55).toFixed(1)}" y="${(cy - s * 0.55).toFixed(1)}" width="${(s * 1.1).toFixed(1)}" height="${(s * 1.1).toFixed(1)}" fill="none" stroke="rgba(${glow},${(op * 0.5).toFixed(3)})" stroke-width="0.8"/>`
          );
        }
      } else if (kind === 2) {
        const a = s * 0.9;
        parts.push(
          `<path d="M${(cx - a).toFixed(1)} ${(cy - a).toFixed(1)} H${(cx - a * 0.25).toFixed(1)} M${(cx - a).toFixed(1)} ${(cy - a).toFixed(1)} V${(cy - a * 0.25).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.1"/>`
        );
        parts.push(
          `<path d="M${(cx + a).toFixed(1)} ${(cy + a).toFixed(1)} H${(cx + a * 0.25).toFixed(1)} M${(cx + a).toFixed(1)} ${(cy + a).toFixed(1)} V${(cy + a * 0.25).toFixed(1)}" fill="none" stroke="rgba(${ink},${op.toFixed(3)})" stroke-width="1.1"/>`
        );
      } else if (kind === 3) {
        parts.push(
          `<rect x="${(cx - s * 0.3).toFixed(1)}" y="${(cy - s * 0.3).toFixed(1)}" width="${(s * 0.6).toFixed(1)}" height="${(s * 0.6).toFixed(1)}" fill="rgba(${ink},${(op * 0.75).toFixed(3)})"/>`
        );
      } else {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.0 + hash01(col, row) * 1.2).toFixed(1)}" fill="rgba(${ink},${(op * 0.85).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 参考3 — 赤×灰の暴砕シャード＋ハッチ */
function buildRiotShard(p: WavePalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 48; i += 1) {
    const nx = 0.04 + hash01(i, 1) * 0.92;
    const ny = 0.03 + hash01(i, 2) * 0.94;
    if (!place(nx, ny, 1.15, i + 7)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const isRed = hash01(i, 3) > 0.38;
    const fill = isRed
      ? pick([p.fills[0]!, p.fills[1]!], i, 4)
      : pick([p.fills[2]!, p.fills[3]!], i, 5);
    const stroke = isRed
      ? pick([p.strokes[0]!, p.strokes[1]!], i, 6)
      : pick([p.strokes[2]!, p.strokes[3]!], i, 7);
    const op = waveOp((isRed ? 0.72 : 0.45) + hash01(i, 8) * 0.22);
    const ang = hash01(i, 9) * Math.PI * 2;
    const len = 18 + hash01(i, 10) * 34;
    const w = 7 + hash01(i, 11) * 14;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const px = (dx: number, dy: number) => {
      const x = cx + dx * cos - dy * sin;
      const y = cy + dx * sin + dy * cos;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    const poly = [
      px(-len * 0.15, 0),
      px(len * 0.55, -w * 0.15),
      px(len, 0),
      px(len * 0.4, w * 0.55),
      px(-len * 0.05, w * 0.2),
    ].join(" ");
    parts.push(
      `<polygon points="${poly}" fill="rgba(${fill},${op.toFixed(3)})" stroke="rgba(${stroke},${Math.min(1, op * 1.05).toFixed(3)})" stroke-width="1.15"/>`
    );
    if (isRed && hash01(i, 12) > 0.35) {
      // ハッチ線
      for (let h = 0; h < 4; h += 1) {
        const t0 = 0.15 + h * 0.18;
        const t1 = t0 + 0.22;
        const yOff = -w * 0.25 + h * (w * 0.18);
        parts.push(
          `<line x1="${(cx + (t0 * len - len * 0.1) * cos - yOff * sin).toFixed(1)}" y1="${(cy + (t0 * len - len * 0.1) * sin + yOff * cos).toFixed(1)}" x2="${(cx + (t1 * len - len * 0.1) * cos - yOff * sin).toFixed(1)}" y2="${(cy + (t1 * len - len * 0.1) * sin + yOff * cos).toFixed(1)}" stroke="rgba(0,0,0,${waveOp(0.45).toFixed(3)})" stroke-width="0.85"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 参考4 — 黒地の赤炎デカール */
function buildInfernoDecal(p: WavePalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    const nx = 0.06 + hash01(i, 1) * 0.88;
    const ny = 0.05 + hash01(i, 2) * 0.9;
    if (!place(nx, ny, 1.05, i + 17)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rot = hash01(i, 3) * Math.PI * 2;
    const s = 10 + hash01(i, 4) * 16;
    const ink = pick(p.strokes, i, 5);
    const op = waveOp(0.75 + hash01(i, 6) * 0.22);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const pt = (dx: number, dy: number) => {
      const x = cx + dx * cos - dy * sin;
      const y = cy + dx * sin + dy * cos;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    // 2〜3舌の炎シルエット
    const tongues = 2 + Math.floor(hash01(i, 7) * 2);
    const tip = pt(0, -s);
    const baseL = pt(-s * 0.42, s * 0.55);
    const baseR = pt(s * 0.42, s * 0.55);
    const midL = pt(-s * 0.55, -s * 0.05);
    const midR = pt(s * 0.55, -s * 0.1);
    const cleft = pt(s * (hash01(i, 8) - 0.5) * 0.35, -s * 0.35);
    if (tongues === 2) {
      parts.push(
        `<path d="M${baseL} Q${midL} ${tip} Q${midR} ${baseR} Q${pt(0, s * 0.35)} ${baseL} Z" fill="rgba(${ink},${op.toFixed(3)})"/>`
      );
    } else {
      parts.push(
        `<path d="M${baseL} Q${midL} ${tip} L${cleft} Q${midR} ${baseR} Q${pt(0, s * 0.32)} ${baseL} Z" fill="rgba(${ink},${op.toFixed(3)})"/>`
      );
    }
    // 細いハイライト縁
    parts.push(
      `<path d="M${baseL} Q${midL} ${tip}" fill="none" stroke="rgba(${p.accent[0]},${(op * 0.35).toFixed(3)})" stroke-width="0.9"/>`
    );
  }
  return wrapSvg(parts.join(""));
}

function buildHud(p: WavePalette): string {
  const parts: string[] = [];
  // パネル四隅の鉤括弧は出さない（プロフィール枠と二重になるため）
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

/**
 * Uiverse hex lattice のサイバー色版（アイソメ立体六角）。
 * Web は CSS 本番パターン、Native / ランキングは本 SVG。
 * 上面シアンは抑えてメトリクス文字と競合しないようにする。
 */
function buildMonoHex(_p: WavePalette): string {
  const c1 = "#1a5f70"; // 上面（旧 #67e8f9 → 深シアン）
  const c2 = "#02060a";
  const c3 = "#0a1c28"; // 暗シアン側面
  // --u:5 → tile ≈ 84.5 × 64
  const tw = 84.5;
  const th = 64;
  const hw = tw / 2;
  const hh = th / 2;
  const parts: string[] = [];
  parts.push(
    `<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="${c2}"/>`
  );
  parts.push(`<g opacity="0.72">`);

  const cols = Math.ceil(CANVAS_W / tw) + 2;
  const rows = Math.ceil(CANVAS_H / hh) + 2;
  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const ox = col * tw + (row % 2 === 0 ? 0 : hw);
      const oy = row * hh;
      // 上面（明るい菱）
      const top = [
        [ox + hw, oy],
        [ox + tw, oy + hh * 0.5],
        [ox + hw, oy + hh],
        [ox, oy + hh * 0.5],
      ];
      // 左側面（黒）
      const left = [
        [ox, oy + hh * 0.5],
        [ox + hw, oy + hh],
        [ox + hw, oy + th],
        [ox, oy + hh * 1.5],
      ];
      // 右側面（暗シアン）
      const right = [
        [ox + hw, oy + hh],
        [ox + tw, oy + hh * 0.5],
        [ox + tw, oy + hh * 1.5],
        [ox + hw, oy + th],
      ];
      const poly = (pts: number[][], fill: string) =>
        `<polygon points="${pts
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ")}" fill="${fill}"/>`;
      parts.push(poly(top, c1));
      parts.push(poly(left, c2));
      parts.push(poly(right, c3));
    }
  }
  parts.push(`</g>`);
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
    case "wave-crimson-shard":
      return buildCrimsonShard(p);
    case "wave-signal-mosaic":
      return buildSignalMosaic(p);
    case "wave-riot-shard":
      return buildRiotShard(p);
    case "wave-inferno-decal":
      return buildInfernoDecal(p);
    case "wave-uniterz-logo":
      // 本体は PNG（Web CSS / Native Image）。SVG は空。
      return wrapSvg("");
    case "wave-mono-hex":
      return buildMonoHex(p);
    default:
      return wrapSvg("");
  }
}

const CACHE_VER = "v24-no-hud-corners";

/** Web 用: ロゴ画像スキンは PNG を返す（他は SVG data URL） */
export function getProfilePlanProWaveUniterzLogoCssUrl(): string {
  return "url(/brand/uniterz-logo.png)";
}

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
