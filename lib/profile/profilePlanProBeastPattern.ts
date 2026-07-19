/**
 * PRO 背景 — 獣皮 / 宝石 / 大理石
 * atmos・scale と同じ配置思想: 疎な図形・中央空け・端に寄せ・微細 HUD
 */

import type { ProfilePlanProBeastBgVariant } from "./profilePlanProBeastBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;

export const PROFILE_PLAN_PRO_BEAST_OPACITY_SCALE = 2.15;

type BeastPalette = {
  strokes: readonly string[];
  fills: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  /** 細い線モチーフ向けの追加ブースト */
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProBeastBgVariant, BeastPalette> = {
  "beast-panther": {
    strokes: ["126,34,206", "167,139,250", "192,132,252", "88,28,135"],
    fills: ["46,16,101", "76,29,149", "24,10,36"],
    accent: ["216,180,254", "192,132,252"],
    hudPrimary: "rgba(192,132,252,",
    hudSecondary: "rgba(167,139,250,",
    opacityMul: 1.7,
  },
  "beast-crocodile": {
    strokes: ["22,101,52", "21,128,61", "74,112,78", "6,78,59"],
    fills: ["10,28,18", "20,45,28", "6,20,14"],
    accent: ["52,211,153", "34,120,70"],
    hudPrimary: "rgba(52,211,153,",
    hudSecondary: "rgba(21,128,61,",
  },
  "beast-tiger": {
    strokes: ["203,213,225", "148,163,184", "226,232,240", "100,116,139"],
    fills: ["30,32,38", "51,55,65", "18,18,22"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-drake": {
    strokes: ["157,23,77", "190,24,93", "219,39,119", "112,26,66"],
    fills: ["40,8,28", "76,16,48", "24,6,18"],
    accent: ["244,114,182", "192,38,211"],
    hudPrimary: "rgba(244,114,182,",
    hudSecondary: "rgba(192,38,211,",
  },
  "beast-raven": {
    strokes: ["99,102,241", "129,140,248", "67,56,202", "139,92,246"],
    fills: ["18,16,42", "30,27,75", "12,12,28"],
    accent: ["165,180,252", "196,181,253"],
    hudPrimary: "rgba(165,180,252,",
    hudSecondary: "rgba(129,140,248,",
  },
  "beast-wolf": {
    strokes: ["125,211,252", "56,189,248", "186,230,253", "14,165,233"],
    fills: ["12,28,40", "8,47,73", "6,20,32"],
    accent: ["224,242,254", "103,232,249"],
    hudPrimary: "rgba(125,211,252,",
    hudSecondary: "rgba(56,189,248,",
  },
  "beast-diamond": {
    strokes: ["34,211,238", "103,232,249", "6,182,212", "165,243,252"],
    fills: ["8,32,48", "12,48,72", "4,20,32"],
    accent: ["207,250,254", "67,232,248"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(103,232,249,",
  },
  "beast-marble": {
    strokes: ["212,168,40", "180,140,30", "234,179,8", "146,110,24"],
    fills: ["28,22,12", "40,32,16", "18,14,8"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "beast-viper": {
    strokes: ["212,168,40", "180,140,30", "234,179,8", "161,128,40"],
    fills: ["28,22,10", "40,32,12", "18,14,6"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "beast-shark": {
    strokes: ["59,130,246", "96,165,250", "147,197,253", "37,99,235"],
    fills: ["15,35,70", "30,58,110", "10,22,48"],
    accent: ["191,219,254", "147,197,253"],
    hudPrimary: "rgba(147,197,253,",
    hudSecondary: "rgba(96,165,250,",
    opacityMul: 1.55,
  },
  "beast-falcon": {
    strokes: ["203,213,225", "148,163,184", "226,232,240", "100,116,139"],
    fills: ["28,32,38", "45,52,62", "18,20,24"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-leopard": {
    strokes: ["203,213,225", "148,163,184", "226,232,240", "125,211,252"],
    fills: ["24,28,36", "40,48,60", "14,16,22"],
    accent: ["241,245,249", "186,230,253"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(125,211,252,",
  },
  "beast-scorpion": {
    strokes: ["239,68,68", "248,113,113", "220,38,38", "185,28,28"],
    fills: ["68,16,16", "90,24,24", "40,10,10"],
    accent: ["254,202,202", "252,165,165"],
    hudPrimary: "rgba(252,165,165,",
    hudSecondary: "rgba(248,113,113,",
    opacityMul: 1.55,
  },
  "beast-beetle": {
    strokes: ["13,148,136", "20,184,166", "45,212,191", "37,99,235"],
    fills: ["6,28,32", "8,40,48", "10,24,48"],
    accent: ["94,234,212", "96,165,250"],
    hudPrimary: "rgba(45,212,191,",
    hudSecondary: "rgba(59,130,246,",
  },
  "beast-manta": {
    strokes: ["37,99,235", "59,130,246", "29,78,216", "96,165,250"],
    fills: ["8,18,40", "12,28,58", "4,12,28"],
    accent: ["147,197,253", "191,219,254"],
    hudPrimary: "rgba(96,165,250,",
    hudSecondary: "rgba(37,99,235,",
  },
  "beast-turtle": {
    strokes: ["132,140,40", "101,120,40", "163,163,50", "74,96,40"],
    fills: ["22,28,12", "36,42,18", "14,18,8"],
    accent: ["190,200,80", "163,163,50"],
    hudPrimary: "rgba(163,163,50,",
    hudSecondary: "rgba(132,140,40,",
  },
  "beast-carbon": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "71,85,105"],
    fills: ["30,41,59", "51,65,85", "15,23,42"],
    accent: ["226,232,240", "203,213,225"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.6,
  },
  "beast-damascus": {
    strokes: ["148,163,184", "203,213,225", "100,116,139", "71,85,105"],
    fills: ["30,35,45", "45,52,65", "20,24,32"],
    accent: ["226,232,240", "186,198,212"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-titanium": {
    strokes: ["148,163,184", "203,213,225", "226,232,240", "100,116,139"],
    fills: ["36,42,54", "51,58,72", "24,28,36"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-velvet": {
    strokes: ["139,92,246", "167,139,250", "126,34,206", "192,132,252"],
    fills: ["46,16,101", "76,29,149", "30,12,48"],
    accent: ["216,180,254", "196,181,253"],
    hudPrimary: "rgba(196,181,253,",
    hudSecondary: "rgba(167,139,250,",
    opacityMul: 1.75,
  },
  "beast-chrome": {
    strokes: ["226,232,240", "203,213,225", "148,163,184", "56,189,248"],
    fills: ["40,48,60", "60,70,85", "24,30,40"],
    accent: ["241,245,249", "125,211,252"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(56,189,248,",
  },
  "beast-kintsugi": {
    strokes: ["212,168,40", "180,140,30", "234,179,8", "161,128,40"],
    fills: ["20,16,8", "32,26,12", "12,10,6"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "beast-meteorite": {
    strokes: ["214,211,209", "168,162,158", "231,229,228", "120,113,108"],
    fills: ["55,48,40", "68,64,60", "36,32,28"],
    accent: ["245,245,244", "212,180,120"],
    hudPrimary: "rgba(231,229,228,",
    hudSecondary: "rgba(214,211,209,",
    opacityMul: 1.6,
  },
  "beast-holosilk": {
    strokes: ["34,211,238", "232,121,249", "167,139,250", "103,232,249"],
    fills: ["20,12,36", "30,20,55", "12,24,40"],
    accent: ["165,243,252", "240,171,252"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(232,121,249,",
  },
  "beast-monogram": {
    strokes: ["34,211,238", "103,232,249", "6,182,212", "165,243,252"],
    fills: ["8,32,48", "12,48,72", "4,20,32"],
    accent: ["207,250,254", "67,232,248"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(103,232,249,",
  },
  "beast-chain": {
    strokes: ["203,213,225", "148,163,184", "226,232,240", "100,116,139"],
    fills: ["30,35,45", "45,52,62", "18,22,28"],
    accent: ["241,245,249", "186,198,212"],
    hudPrimary: "rgba(226,232,240,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-chevron": {
    strokes: ["212,168,40", "180,140,30", "234,179,8", "161,128,40"],
    fills: ["28,22,10", "40,32,12", "16,12,6"],
    accent: ["253,224,71", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "beast-damier": {
    strokes: ["34,211,238", "56,189,248", "148,163,184", "103,232,249"],
    fills: ["8,24,40", "15,35,55", "30,41,59"],
    accent: ["165,243,252", "125,211,252"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(148,163,184,",
  },
  "beast-crown": {
    strokes: ["212,168,40", "234,179,8", "180,140,30", "253,224,71"],
    fills: ["28,22,10", "40,30,12", "16,12,6"],
    accent: ["254,240,138", "250,204,21"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
  },
  "beast-constellation": {
    strokes: ["125,211,252", "186,230,253", "56,189,248", "147,197,253"],
    fills: ["8,20,40", "12,30,55", "4,12,24"],
    accent: ["224,242,254", "103,232,249"],
    hudPrimary: "rgba(186,230,253,",
    hudSecondary: "rgba(56,189,248,",
  },
  "beast-circuitlace": {
    strokes: ["167,139,250", "34,211,238", "192,132,252", "103,232,249"],
    fills: ["24,12,48", "12,32,48", "30,16,55"],
    accent: ["196,181,253", "165,243,252"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(34,211,238,",
  },
  "beast-ripple": {
    strokes: ["59,130,246", "96,165,250", "37,99,235", "147,197,253"],
    fills: ["12,24,48", "20,40,72", "8,16,36"],
    accent: ["191,219,254", "147,197,253"],
    hudPrimary: "rgba(96,165,250,",
    hudSecondary: "rgba(59,130,246,",
    opacityMul: 1.8,
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function beastOp(raw: number): number {
  return Math.min(
    1,
    Math.round(raw * PROFILE_PLAN_PRO_BEAST_OPACITY_SCALE * activeOpacityMul * 1000) /
      1000
  );
}

/** atmos / scale と同系 — 右・下・隅に寄せ、中央は空ける */
function densityAt(nx: number, ny: number): number {
  const right = Math.pow(nx, 1.5);
  const bottom = Math.pow(ny, 1.7);
  const topRight = Math.max(0, 1 - Math.hypot((nx - 1) * 1.15, (ny - 0.02) * 1.15));
  const rightMid = Math.max(0, 1 - Math.hypot((nx - 1) * 1.0, (ny - 0.5) * 1.5));
  const holeDist = ((nx - 0.34) ** 2) / 0.05 + ((ny - 0.42) ** 2) / 0.14;
  const centerFactor = Math.min(1, 0.22 + holeDist);
  const w = (right * 0.55 + bottom * 0.5 + topRight * 0.65 + rightMid * 0.42) * centerFactor;
  return Math.min(1.4, w);
}

function toUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const urlCache = new Map<string, string>();

function cachedUrl(key: string, build: () => string): string {
  const hit = urlCache.get(key);
  if (hit !== undefined) return hit;
  const url = toUrl(build());
  urlCache.set(key, url);
  return url;
}

function pick<T>(arr: readonly T[], a: number, b: number): T {
  return arr[Math.floor(hash01(a, b) * arr.length) % arr.length]!;
}

function wrapSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" preserveAspectRatio="none">${body}</svg>`;
}

/* ─── Midnight Panther: flow fur + faint spots ─── */

function buildPanther(p: BeastPalette): string {
  const parts: string[] = [];

  // Fur flow strokes — noise-driven short curves
  for (let i = 0; i < 220; i += 1) {
    const nx = hash01(i * 1.7, 2.1);
    const ny = hash01(i * 2.3, 4.4);
    const dens = densityAt(nx, ny);
    if (hash01(i + 0.3, 9.1) > dens * 0.92) continue;

    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const ang =
      -0.55 +
      Math.sin(nx * 4.2 + ny * 3.1) * 0.55 +
      (hash01(i, 1.2) - 0.5) * 0.35;
    const len = 7 + hash01(i, 3.3) * 14;
    const bend = (hash01(i, 5.5) - 0.5) * 4.5;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend;
    const my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    const stroke = pick(p.strokes, i, 7.7);
    const op = beastOp(0.11 + hash01(i, 8.8) * 0.18);
    const sw = (0.55 + hash01(i, 2.2) * 0.75).toFixed(2);
    parts.push(
      `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
    );
  }

  // Faint leopard-like spots (incomplete rings)
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.35 + hash01(i * 3.1, 1.4) * 0.7;
    const ny = hash01(i * 2.7, 6.2);
    const dens = densityAt(nx, ny);
    if (hash01(i + 11, 0.5) > dens * 0.75) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rx = 4.5 + hash01(i, 4.1) * 5.5;
    const ry = 3.2 + hash01(i, 5.2) * 4.2;
    const stroke = pick(p.accent, i, 2.2);
    const op = beastOp(0.1 + hash01(i, 1.1) * 0.14);
    const rot = (hash01(i, 9.9) * 50 - 25).toFixed(1);
    // open arc as spot outline
    const a0 = hash01(i, 3.3) * Math.PI * 0.4;
    const a1 = a0 + Math.PI * (1.1 + hash01(i, 4.4) * 0.7);
    const sx = cx + Math.cos(a0) * rx;
    const sy = cy + Math.sin(a0) * ry;
    const ex = cx + Math.cos(a1) * rx;
    const ey = cy + Math.sin(a1) * ry;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    parts.push(
      `<g transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})">` +
        `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="1.1" stroke-linecap="round"/>` +
        `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(rx * 0.35).toFixed(1)}" ry="${(ry * 0.3).toFixed(1)}" fill="rgba(${pick(p.fills, i, 1)},${beastOp(0.08).toFixed(3)})"/>` +
        `</g>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Onyx Crocodile: large leather scutes ─── */

function scutePath(cx: number, cy: number, w: number, h: number, soft: number): string {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = cy - h / 2;
  const b = cy + h / 2;
  const s = soft;
  return [
    `M${(l + s).toFixed(1)} ${t.toFixed(1)}`,
    `Q${cx.toFixed(1)} ${(t - s * 0.35).toFixed(1)} ${(r - s).toFixed(1)} ${t.toFixed(1)}`,
    `Q${(r + s * 0.2).toFixed(1)} ${cy.toFixed(1)} ${(r - s).toFixed(1)} ${b.toFixed(1)}`,
    `Q${cx.toFixed(1)} ${(b + s * 0.4).toFixed(1)} ${(l + s).toFixed(1)} ${b.toFixed(1)}`,
    `Q${(l - s * 0.2).toFixed(1)} ${cy.toFixed(1)} ${(l + s).toFixed(1)} ${t.toFixed(1)}`,
    "Z",
  ].join(" ");
}

function buildCrocodile(p: BeastPalette): string {
  const parts: string[] = [];
  const colStep = 28;
  const rowStep = 20;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep * 0.48);
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny) * 1.08;
      if (hash01(col + 1.2, row + 3.4) > dens * 0.78) continue;

      const jitter = 0.78 + hash01(col * 1.5, row * 2.1) * 0.45;
      const w = 22 * jitter;
      const h = 15 * jitter;
      const soft = 3.2 + hash01(col, row) * 2.2;
      const stroke = pick(p.strokes, col, row);
      const fill = pick(p.fills, col + 2, row + 1);
      const op = beastOp(0.1 + hash01(col, row + 9) * 0.14);
      const fillOp = beastOp(0.06 + hash01(col * 0.7, row) * 0.1);
      const d = scutePath(cx, cy, w, h, soft);
      parts.push(
        `<path d="${d}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.7 + hash01(col, row) * 0.55).toFixed(2)}"/>`
      );

      // leather ridge / keeled bump
      if (hash01(col + 4, row + 2) > 0.32) {
        const ridge = pick(p.accent, col, row);
        parts.push(
          `<line x1="${cx.toFixed(1)}" y1="${(cy - h * 0.22).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + h * 0.28).toFixed(1)}" stroke="rgba(${ridge},${beastOp(op * 1.15).toFixed(3)})" stroke-width="0.55"/>`
        );
      }

      // subtle edge highlight for leather sheen
      if (hash01(col * 2.2, row * 3.1) > 0.68) {
        parts.push(
          `<path d="${scutePath(cx, cy - 0.6, w * 0.7, h * 0.45, soft * 0.8)}" fill="none" stroke="rgba(${pick(p.accent, col + 1, row)},${beastOp(0.08).toFixed(3)})" stroke-width="0.4"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── White Tiger: thin abstract stripes ─── */

function tigerStripePath(
  x0: number,
  y0: number,
  len: number,
  ang: number,
  width: number,
  wobble: number
): string {
  const steps = 6;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const px = x0 + Math.cos(ang) * len * t;
    const py = y0 + Math.sin(ang) * len * t;
    const wave = Math.sin(t * Math.PI * 2.2) * wobble;
    const nx = Math.cos(ang + Math.PI / 2);
    const ny = Math.sin(ang + Math.PI / 2);
    const half = width * (0.55 + Math.sin(t * Math.PI) * 0.45);
    left.push(`${(px + nx * half + nx * wave).toFixed(1)} ${(py + ny * half + ny * wave).toFixed(1)}`);
    right.push(
      `${(px - nx * half - nx * wave * 0.6).toFixed(1)} ${(py - ny * half - ny * wave * 0.6).toFixed(1)}`
    );
  }
  return `M${left[0]} L${left.slice(1).join(" L")} L${right.reverse().join(" L")} Z`;
}

function buildTiger(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 48; i += 1) {
    const nx = 0.28 + hash01(i * 1.9, 0.7) * 0.78;
    const ny = hash01(i * 2.4, 3.3);
    const dens = densityAt(nx, ny);
    if (hash01(i + 5, 1.1) > dens * 0.88) continue;

    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const ang = -0.95 + (hash01(i, 8.2) - 0.5) * 0.28 + Math.sin(ny * 3) * 0.12;
    const len = 38 + hash01(i, 4.4) * 55;
    const width = 0.9 + hash01(i, 6.6) * 1.6;
    const wobble = 1.2 + hash01(i, 2.2) * 2.4;
    const stroke = pick(p.strokes, i, 3);
    const fill = pick(p.fills, i, 5);
    const op = beastOp(0.09 + hash01(i, 7.7) * 0.14);
    const fillOp = beastOp(0.035 + hash01(i, 1.5) * 0.06);
    const d = tigerStripePath(x, y, len, ang, width, wobble);
    parts.push(
      `<path d="${d}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.45"/>`
    );

    // silver edge highlight — sporty sharpness
    if (hash01(i, 9.1) > 0.55) {
      const hx = x + Math.cos(ang) * 4;
      const hy = y + Math.sin(ang) * 4;
      const accent = pick(p.accent, i, 2);
      parts.push(
        `<line x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${(hx + Math.cos(ang) * len * 0.55).toFixed(1)}" y2="${(hy + Math.sin(ang) * len * 0.55).toFixed(1)}" stroke="rgba(${accent},${beastOp(0.12).toFixed(3)})" stroke-width="0.35" stroke-linecap="round"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Dragon Scale: stacked hex honeycomb ─── */

function hexPoints(cx: number, cy: number, r: number, flat = true): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

function buildDrake(p: BeastPalette): string {
  const parts: string[] = [];
  const r = 13;
  const colStep = r * 1.75;
  const rowStep = r * 1.52;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny) * 1.05;
      if (hash01(col + 2.1, row + 1.7) > dens * 0.8) continue;

      const sizeJ = 0.82 + hash01(col * 1.3, row * 2.1) * 0.38;
      const rr = r * sizeJ;
      const stroke = pick(p.strokes, col, row);
      const fill = pick(p.fills, col + 1, row + 3);
      const op = beastOp(0.1 + hash01(col, row + 8) * 0.13);
      const fillOp = beastOp(0.055 + hash01(col * 0.5, row) * 0.09);

      parts.push(
        `<polygon points="${hexPoints(cx, cy, rr)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.65 + hash01(col, row) * 0.45).toFixed(2)}"/>`
      );

      // inner bevel — stacked depth
      if (hash01(col + 7, row + 3) > 0.28) {
        const accent = pick(p.accent, col, row);
        parts.push(
          `<polygon points="${hexPoints(cx, cy - 0.4, rr * 0.62)}" fill="none" stroke="rgba(${accent},${beastOp(op * 0.85).toFixed(3)})" stroke-width="0.4"/>`
        );
      }

      // highlight facet edge (top-left)
      if (hash01(col * 3.2, row * 1.1) > 0.62) {
        const a0 = -Math.PI * 0.7;
        const a1 = -Math.PI * 0.15;
        const x1 = cx + Math.cos(a0) * rr * 0.92;
        const y1 = cy + Math.sin(a0) * rr * 0.92;
        const x2 = cx + Math.cos(a1) * rr * 0.92;
        const y2 = cy + Math.sin(a1) * rr * 0.92;
        parts.push(
          `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${pick(p.accent, col + 2, row)},${beastOp(0.14).toFixed(3)})" stroke-width="0.55"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Raven Feather: flowing vanes ─── */

function featherPath(
  cx: number,
  cy: number,
  len: number,
  ang: number,
  spread: number
): { outline: string; rachis: string; barbs: string[] } {
  const tipX = cx + Math.cos(ang) * len;
  const tipY = cy + Math.sin(ang) * len;
  const midX = cx + Math.cos(ang) * len * 0.45;
  const midY = cy + Math.sin(ang) * len * 0.45;
  const nx = Math.cos(ang + Math.PI / 2);
  const ny = Math.sin(ang + Math.PI / 2);
  const w1 = spread * 0.35;
  const w2 = spread;

  const outline = [
    `M${cx.toFixed(1)} ${cy.toFixed(1)}`,
    `Q${(midX + nx * w1).toFixed(1)} ${(midY + ny * w1).toFixed(1)} ${(tipX * 0.15 + midX * 0.85 + nx * w2 * 0.4).toFixed(1)} ${(tipY * 0.15 + midY * 0.85 + ny * w2 * 0.4).toFixed(1)}`,
    `Q${(midX + nx * w2 * 0.15).toFixed(1)} ${(midY + ny * w2 * 0.15).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
    `Q${(midX - nx * w2 * 0.15).toFixed(1)} ${(midY - ny * w2 * 0.15).toFixed(1)} ${(tipX * 0.15 + midX * 0.85 - nx * w2 * 0.4).toFixed(1)} ${(tipY * 0.15 + midY * 0.85 - ny * w2 * 0.4).toFixed(1)}`,
    `Q${(midX - nx * w1).toFixed(1)} ${(midY - ny * w1).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`,
    "Z",
  ].join(" ");

  const rachis = `M${cx.toFixed(1)} ${cy.toFixed(1)} L${tipX.toFixed(1)} ${tipY.toFixed(1)}`;

  const barbs: string[] = [];
  const barbCount = 7 + Math.floor(hash01(cx * 0.1, cy * 0.1) * 5);
  for (let i = 1; i < barbCount; i += 1) {
    const t = i / barbCount;
    const bx = cx + Math.cos(ang) * len * t;
    const by = cy + Math.sin(ang) * len * t;
    const sideW = spread * (0.25 + Math.sin(t * Math.PI) * 0.75) * (0.55 + t * 0.2);
    const flare = 0.35 + t * 0.25;
    // left vane
    barbs.push(
      `M${bx.toFixed(1)} ${by.toFixed(1)} L${(bx + nx * sideW + Math.cos(ang) * sideW * flare).toFixed(1)} ${(by + ny * sideW + Math.sin(ang) * sideW * flare).toFixed(1)}`
    );
    // right vane — slightly thinner / angle shift for light-catch feel
    barbs.push(
      `M${bx.toFixed(1)} ${by.toFixed(1)} L${(bx - nx * sideW * 0.85 + Math.cos(ang) * sideW * flare * 0.7).toFixed(1)} ${(by - ny * sideW * 0.85 + Math.sin(ang) * sideW * flare * 0.7).toFixed(1)}`
    );
  }

  return { outline, rachis, barbs };
}

function buildRaven(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 36; i += 1) {
    const nx = 0.32 + hash01(i * 2.1, 1.5) * 0.72;
    const ny = hash01(i * 1.8, 4.7);
    const dens = densityAt(nx, ny);
    if (hash01(i + 3, 2.2) > dens * 0.82) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    // flowing S-curve orientation
    const ang =
      -0.35 +
      Math.sin(nx * 2.8 + ny * 2.2) * 0.7 +
      (hash01(i, 6.6) - 0.5) * 0.5;
    const len = 28 + hash01(i, 3.3) * 42;
    const spread = 5.5 + hash01(i, 5.5) * 7;
    const { outline, rachis, barbs } = featherPath(cx, cy, len, ang, spread);
    const stroke = pick(p.strokes, i, 2);
    const fill = pick(p.fills, i, 4);
    const op = beastOp(0.08 + hash01(i, 7) * 0.12);
    const fillOp = beastOp(0.04 + hash01(i, 1.2) * 0.07);

    parts.push(
      `<path d="${outline}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.55"/>`
    );
    parts.push(
      `<path d="${rachis}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${beastOp(op * 1.35).toFixed(3)})" stroke-width="0.7" stroke-linecap="round"/>`
    );

    const barbOp = beastOp(0.05 + hash01(i, 8.8) * 0.08);
    const barbStroke = pick(p.strokes, i + 3, 1);
    for (const b of barbs) {
      parts.push(
        `<path d="${b}" fill="none" stroke="rgba(${barbStroke},${barbOp.toFixed(3)})" stroke-width="0.3"/>`
      );
    }

    // light-angle glint on one vane
    if (hash01(i, 9.9) > 0.48) {
      const gx = cx + Math.cos(ang) * len * 0.4 + Math.cos(ang + Math.PI / 2) * spread * 0.45;
      const gy = cy + Math.sin(ang) * len * 0.4 + Math.sin(ang + Math.PI / 2) * spread * 0.45;
      parts.push(
        `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="0.9" fill="rgba(${pick(p.accent, i, 8)},${beastOp(0.16).toFixed(3)})"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Arctic Wolf: diagonal fur flow ─── */

function buildWolf(p: BeastPalette): string {
  const parts: string[] = [];
  const flowAng = -0.72;

  // Parallel fur bundles
  for (let i = 0; i < 160; i += 1) {
    const nx = hash01(i * 1.4, 0.9);
    const ny = hash01(i * 2.6, 3.1);
    const dens = densityAt(nx, ny);
    if (hash01(i + 1.1, 4.4) > dens * 0.95) continue;

    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const ang = flowAng + (hash01(i, 2.2) - 0.5) * 0.22;
    const len = 10 + hash01(i, 5.5) * 18;
    const strands = 2 + Math.floor(hash01(i, 7.7) * 3);

    for (let s = 0; s < strands; s += 1) {
      const off = (s - (strands - 1) / 2) * 1.15;
      const ox = x + Math.cos(ang + Math.PI / 2) * off;
      const oy = y + Math.sin(ang + Math.PI / 2) * off;
      const bend = (hash01(i + s, 3.3) - 0.5) * 3.2;
      const x2 = ox + Math.cos(ang) * len;
      const y2 = oy + Math.sin(ang) * len;
      const mx = (ox + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend;
      const my = (oy + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      const stroke = pick(p.strokes, i + s, 1);
      const op = beastOp(0.055 + hash01(i + s, 8) * 0.11);
      const sw = (0.3 + hash01(i + s, 1.1) * 0.5).toFixed(2);
      parts.push(
        `<path d="M${ox.toFixed(1)} ${oy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
      );
    }

    // ice tip highlight
    if (hash01(i, 9.2) > 0.78) {
      const tipX = x + Math.cos(ang) * len * 0.92;
      const tipY = y + Math.sin(ang) * len * 0.92;
      parts.push(
        `<circle cx="${tipX.toFixed(1)}" cy="${tipY.toFixed(1)}" r="0.7" fill="rgba(${pick(p.accent, i, 2)},${beastOp(0.18).toFixed(3)})"/>`
      );
    }
  }

  // Soft under-layer wash strokes (colder luxury)
  for (let i = 0; i < 24; i += 1) {
    const nx = 0.4 + hash01(i * 3.2, 1.1) * 0.65;
    const ny = hash01(i * 2.1, 5.5);
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.7) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const len = 22 + hash01(i, 4) * 30;
    const x2 = x + Math.cos(flowAng) * len;
    const y2 = y + Math.sin(flowAng) * len;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${pick(p.fills, i, 2)},${beastOp(0.05).toFixed(3)})" stroke-width="${(2.2 + hash01(i, 3) * 2).toFixed(1)}" stroke-linecap="round"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Black Diamond: gem facets ─── */

function facetPoly(
  cx: number,
  cy: number,
  r: number,
  n: number,
  rot: number,
  squash: number
): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = rot + (Math.PI * 2 * i) / n;
    const rr = r * (0.75 + hash01(cx + i, cy) * 0.4);
    pts.push(
      `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * squash).toFixed(1)}`
    );
  }
  return pts.join(" ");
}

function buildDiamond(p: BeastPalette): string {
  const parts: string[] = [];

  // Clustered facet crystals toward edges
  for (let i = 0; i < 42; i += 1) {
    const nx = 0.3 + hash01(i * 1.7, 2.2) * 0.75;
    const ny = hash01(i * 2.9, 1.4);
    const dens = densityAt(nx, ny);
    if (hash01(i + 2, 3.3) > dens * 0.85) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 8 + hash01(i, 5.5) * 14;
    const n = hash01(i, 6.6) > 0.45 ? 3 : hash01(i, 7.7) > 0.5 ? 4 : 5;
    const rot = hash01(i, 8.8) * Math.PI;
    const squash = 0.72 + hash01(i, 1.1) * 0.4;
    const stroke = pick(p.strokes, i, 1);
    const fill = pick(p.fills, i, 3);
    const op = beastOp(0.1 + hash01(i, 4.4) * 0.14);
    const fillOp = beastOp(0.045 + hash01(i, 2.2) * 0.08);

    parts.push(
      `<polygon points="${facetPoly(cx, cy, r, n, rot, squash)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.55 + hash01(i, 9) * 0.5).toFixed(2)}" stroke-linejoin="round"/>`
    );

    // internal facet cut lines
    const cuts = 1 + Math.floor(hash01(i, 3.1) * 2);
    for (let c = 0; c < cuts; c += 1) {
      const a = rot + (Math.PI * 2 * c) / Math.max(n, 3) + 0.2;
      const ix = cx + Math.cos(a) * r * 0.15;
      const iy = cy + Math.sin(a) * r * squash * 0.15;
      const ox = cx + Math.cos(a) * r * 0.88;
      const oy = cy + Math.sin(a) * r * squash * 0.88;
      parts.push(
        `<line x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}" x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="rgba(${pick(p.accent, i + c, 1)},${beastOp(0.1).toFixed(3)})" stroke-width="0.35"/>`
      );
    }

    // vertex sparkle
    if (hash01(i, 0.7) > 0.62) {
      const a = rot;
      const sx = cx + Math.cos(a) * r * 0.95;
      const sy = cy + Math.sin(a) * r * squash * 0.95;
      const acc = pick(p.accent, i, 5);
      const s = 1.6 + hash01(i, 2) * 1.2;
      parts.push(
        `<line x1="${(sx - s).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + s).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="rgba(${acc},${beastOp(0.22).toFixed(3)})" stroke-width="0.55"/>` +
          `<line x1="${sx.toFixed(1)}" y1="${(sy - s).toFixed(1)}" x2="${sx.toFixed(1)}" y2="${(sy + s).toFixed(1)}" stroke="rgba(${acc},${beastOp(0.22).toFixed(3)})" stroke-width="0.55"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Obsidian Marble: gold vein cracks ─── */

function branchVein(
  x: number,
  y: number,
  ang: number,
  len: number,
  depth: number,
  parts: string[],
  p: BeastPalette,
  seed: number
): void {
  if (depth <= 0 || len < 4) return;

  const steps = 4 + Math.floor(hash01(seed, depth) * 3);
  let cx = x;
  let cy = y;
  let a = ang;
  const stroke = pick(p.strokes, seed, depth);
  const isMain = depth >= 3;
  const op = beastOp((isMain ? 0.12 : 0.06) + hash01(seed, depth + 1) * 0.1);
  const sw = (isMain ? 0.75 : 0.35) + hash01(seed, depth + 2) * (isMain ? 0.55 : 0.35);

  for (let i = 0; i < steps; i += 1) {
    a += (hash01(seed + i, depth * 1.7) - 0.5) * 0.55;
    const seg = len / steps;
    const nx = cx + Math.cos(a) * seg;
    const ny = cy + Math.sin(a) * seg;
    parts.push(
      `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}" stroke-linecap="round"/>`
    );
    cx = nx;
    cy = ny;

    // occasional gold node
    if (isMain && hash01(seed + i, 9.9) > 0.82) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0.85" fill="rgba(${pick(p.accent, seed, i)},${beastOp(0.16).toFixed(3)})"/>`
      );
    }
  }

  // bifurcate
  if (hash01(seed, depth + 5) > 0.35) {
    branchVein(
      cx,
      cy,
      a + 0.45 + hash01(seed, 1) * 0.35,
      len * 0.55,
      depth - 1,
      parts,
      p,
      seed + 17
    );
  }
  if (hash01(seed + 3, depth + 6) > 0.48) {
    branchVein(
      cx,
      cy,
      a - 0.5 - hash01(seed, 2) * 0.3,
      len * 0.48,
      depth - 1,
      parts,
      p,
      seed + 31
    );
  }
}

function buildMarble(p: BeastPalette): string {
  const parts: string[] = [];

  // Anchor veins from edges (luxury marble)
  const anchors: { x: number; y: number; ang: number; len: number }[] = [];
  for (let i = 0; i < 14; i += 1) {
    const side = Math.floor(hash01(i, 0.5) * 3); // R, B, TR
    let x: number;
    let y: number;
    let ang: number;
    if (side === 0) {
      x = CANVAS_W * (0.72 + hash01(i, 1) * 0.28);
      y = CANVAS_H * hash01(i, 2);
      ang = Math.PI + (hash01(i, 3) - 0.5) * 0.9;
    } else if (side === 1) {
      x = CANVAS_W * (0.4 + hash01(i, 4) * 0.6);
      y = CANVAS_H * (0.78 + hash01(i, 5) * 0.22);
      ang = -Math.PI / 2 + (hash01(i, 6) - 0.5) * 1.0;
    } else {
      x = CANVAS_W * (0.65 + hash01(i, 7) * 0.35);
      y = CANVAS_H * hash01(i, 8) * 0.25;
      ang = Math.PI * 0.75 + (hash01(i, 9) - 0.5) * 0.7;
    }
    const nx = x / CANVAS_W;
    const ny = y / CANVAS_H;
    if (hash01(i + 10, 1.1) > densityAt(nx, ny) * 0.95) continue;
    anchors.push({ x, y, ang, len: 38 + hash01(i, 11) * 55 });
  }

  anchors.forEach((a, i) => {
    branchVein(a.x, a.y, a.ang, a.len, 4, parts, p, i * 13 + 7);
  });

  // Fine hairline cracks
  for (let i = 0; i < 40; i += 1) {
    const nx = 0.35 + hash01(i * 2.2, 1.5) * 0.7;
    const ny = hash01(i * 1.6, 4.4);
    if (hash01(i, 0.3) > densityAt(nx, ny) * 0.8) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const ang = hash01(i, 5) * Math.PI * 2;
    const len = 6 + hash01(i, 6) * 16;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${pick(p.strokes, i, 2)},${beastOp(0.05 + hash01(i, 7) * 0.07).toFixed(3)})" stroke-width="0.3" stroke-linecap="round"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Golden Viper: fine diamond snake scales ─── */

function fineDiamondPath(cx: number, cy: number, rx: number, ry: number): string {
  return [
    `M${cx.toFixed(1)} ${(cy - ry).toFixed(1)}`,
    `L${(cx + rx).toFixed(1)} ${cy.toFixed(1)}`,
    `L${cx.toFixed(1)} ${(cy + ry).toFixed(1)}`,
    `L${(cx - rx).toFixed(1)} ${cy.toFixed(1)}`,
    "Z",
  ].join(" ");
}

function buildViper(p: BeastPalette): string {
  const parts: string[] = [];
  const colStep = 11;
  const rowStep = 9;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny) * 1.2;
      if (hash01(col + 1.1, row + 2.2) > dens * 0.88) continue;

      const j = 0.72 + hash01(col * 1.4, row * 1.9) * 0.5;
      const rx = 5.2 * j;
      const ry = 6.4 * j;
      const stroke = pick(p.strokes, col, row);
      const fill = pick(p.fills, col + 1, row);
      const op = beastOp(0.08 + hash01(col, row + 5) * 0.12);
      const fillOp = beastOp(0.04 + hash01(col * 0.6, row) * 0.07);
      parts.push(
        `<path d="${fineDiamondPath(cx, cy, rx, ry)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.4 + hash01(col, row) * 0.35).toFixed(2)}"/>`
      );

      // gold keel highlight on denser scales
      if (hash01(col + 7, row + 3) > 0.62) {
        parts.push(
          `<line x1="${cx.toFixed(1)}" y1="${(cy - ry * 0.35).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + ry * 0.4).toFixed(1)}" stroke="rgba(${pick(p.accent, col, row)},${beastOp(op * 1.2).toFixed(3)})" stroke-width="0.35"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Shark Skin: fine V denticles ─── */

function buildShark(p: BeastPalette): string {
  const parts: string[] = [];
  const colStep = 8;
  const rowStep = 7;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * 3.5;
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny) * 1.25;
      if (hash01(col + 0.8, row + 1.5) > dens * 0.9) continue;

      const s = 2.4 + hash01(col, row) * 2.2;
      const lean = (hash01(col * 2, row) - 0.5) * 0.35;
      const tipY = cy + s * 1.15;
      const lx = cx - s + lean;
      const rx = cx + s + lean;
      const stroke = pick(p.strokes, col, row);
      const op = beastOp(0.12 + hash01(col, row + 4) * 0.16);
      // V denticle pointing with flow
      parts.push(
        `<path d="M${lx.toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} ${tipY.toFixed(1)} L${rx.toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.55 + hash01(col, row) * 0.45).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`
      );

      if (hash01(col + 3, row + 9) > 0.72) {
        parts.push(
          `<line x1="${cx.toFixed(1)}" y1="${(cy + 0.4).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(tipY - 0.5).toFixed(1)}" stroke="rgba(${pick(p.accent, col, row)},${beastOp(0.16).toFixed(3)})" stroke-width="0.45"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Falcon Wing: geometric feather lattice ─── */

function buildFalcon(p: BeastPalette): string {
  const parts: string[] = [];

  // Rows of angular flight feathers fanning from right edge
  for (let row = 0; row < 18; row += 1) {
    const feathers = 5 + (row % 3);
    for (let f = 0; f < feathers; f += 1) {
      const nx = 0.42 + f * 0.1 + hash01(row, f) * 0.08;
      const ny = 0.06 + row * 0.052 + hash01(f, row + 1) * 0.02;
      if (hash01(row + f, 2.2) > densityAt(nx, ny) * 0.9) continue;

      const cx = nx * CANVAS_W;
      const cy = ny * CANVAS_H;
      const ang = -0.55 - f * 0.08 + (hash01(row, f + 3) - 0.5) * 0.12;
      const len = 18 + f * 4 + hash01(row, f) * 10;
      const tipX = cx + Math.cos(ang) * len;
      const tipY = cy + Math.sin(ang) * len;
      const midX = cx + Math.cos(ang) * len * 0.45;
      const midY = cy + Math.sin(ang) * len * 0.45;
      const nx2 = Math.cos(ang + Math.PI / 2);
      const ny2 = Math.sin(ang + Math.PI / 2);
      const w = 2.2 + f * 0.35;

      // geometric vane — trapezoid feather
      const outline = [
        `M${cx.toFixed(1)} ${cy.toFixed(1)}`,
        `L${(midX + nx2 * w).toFixed(1)} ${(midY + ny2 * w).toFixed(1)}`,
        `L${(tipX + nx2 * w * 0.25).toFixed(1)} ${(tipY + ny2 * w * 0.25).toFixed(1)}`,
        `L${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
        `L${(tipX - nx2 * w * 0.25).toFixed(1)} ${(tipY - ny2 * w * 0.25).toFixed(1)}`,
        `L${(midX - nx2 * w * 0.7).toFixed(1)} ${(midY - ny2 * w * 0.7).toFixed(1)}`,
        "Z",
      ].join(" ");

      const stroke = pick(p.strokes, row, f);
      const fill = pick(p.fills, row + 1, f);
      const op = beastOp(0.09 + hash01(row, f) * 0.12);
      const fillOp = beastOp(0.035 + hash01(f, row) * 0.055);

      parts.push(
        `<path d="${outline}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.5"/>`
      );
      // rachis as hard geometric centerline
      parts.push(
        `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${tipX.toFixed(1)}" y2="${tipY.toFixed(1)}" stroke="rgba(${pick(p.accent, row, f)},${beastOp(op * 1.15).toFixed(3)})" stroke-width="0.45"/>`
      );

      // barbs as parallel ticks (geometric, not organic)
      const ticks = 4 + Math.floor(hash01(row, f) * 3);
      for (let t = 1; t < ticks; t += 1) {
        const tt = t / ticks;
        const bx = cx + Math.cos(ang) * len * tt;
        const by = cy + Math.sin(ang) * len * tt;
        const side = w * (0.4 + Math.sin(tt * Math.PI) * 0.6);
        parts.push(
          `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + nx2 * side).toFixed(1)}" y2="${(by + ny2 * side).toFixed(1)}" stroke="rgba(${stroke},${beastOp(0.06).toFixed(3)})" stroke-width="0.3"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Snow Leopard: digital particle rosettes ─── */

function buildLeopard(p: BeastPalette): string {
  const parts: string[] = [];

  // Spot cluster centers
  for (let i = 0; i < 26; i += 1) {
    const nx = 0.34 + hash01(i * 2.7, 1.3) * 0.7;
    const ny = hash01(i * 1.9, 4.1);
    const dens = densityAt(nx, ny);
    if (hash01(i + 5, 0.7) > dens * 0.78) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const ringR = 5.5 + hash01(i, 3.3) * 7;
    const particleCount = 14 + Math.floor(hash01(i, 5.5) * 18);

    // Ring of digital particles (rects / plus / dashes — not circles)
    for (let k = 0; k < particleCount; k += 1) {
      const a =
        (Math.PI * 2 * k) / particleCount +
        hash01(i, k) * 0.4 +
        (hash01(i + k, 2) - 0.5) * 0.5;
      const rr = ringR * (0.7 + hash01(i + k, 1) * 0.55);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      const kind = Math.floor(hash01(i * 3 + k, 9) * 3);
      const stroke = pick(p.strokes, i, k);
      const op = beastOp(0.08 + hash01(i + k, 4) * 0.12);
      const sz = 0.8 + hash01(i, k + 2) * 1.4;

      if (kind === 0) {
        // pixel square
        parts.push(
          `<rect x="${(px - sz / 2).toFixed(1)}" y="${(py - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="rgba(${stroke},${op.toFixed(3)})"/>`
        );
      } else if (kind === 1) {
        // dash aligned to ring tangent
        const tx = Math.cos(a + Math.PI / 2) * sz * 1.4;
        const ty = Math.sin(a + Math.PI / 2) * sz * 1.4;
        parts.push(
          `<line x1="${(px - tx).toFixed(1)}" y1="${(py - ty).toFixed(1)}" x2="${(px + tx).toFixed(1)}" y2="${(py + ty).toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.55" stroke-linecap="square"/>`
        );
      } else {
        // plus particle
        parts.push(
          `<line x1="${(px - sz).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px + sz).toFixed(1)}" y2="${py.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.5"/>` +
            `<line x1="${px.toFixed(1)}" y1="${(py - sz).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py + sz).toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.5"/>`
        );
      }
    }

    // sparse core particles
    const coreN = 3 + Math.floor(hash01(i, 8) * 4);
    for (let k = 0; k < coreN; k += 1) {
      const px = cx + (hash01(i, k + 10) - 0.5) * ringR * 0.7;
      const py = cy + (hash01(i + 2, k) - 0.5) * ringR * 0.55;
      const sz = 0.6 + hash01(i, k) * 1.1;
      parts.push(
        `<rect x="${(px - sz / 2).toFixed(1)}" y="${(py - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="rgba(${pick(p.accent, i, k)},${beastOp(0.12).toFixed(3)})"/>`
      );
    }
  }

  // ambient digital dust
  for (let i = 0; i < 50; i += 1) {
    const nx = hash01(i * 1.5, 2.2);
    const ny = hash01(i * 2.1, 3.7);
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.7) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const sz = 0.5 + hash01(i, 6) * 0.9;
    parts.push(
      `<rect x="${(x - sz / 2).toFixed(1)}" y="${(y - sz / 2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="rgba(${pick(p.fills, i, 1)},${beastOp(0.06).toFixed(3)})"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Scorpion Armor: segmented plates ─── */

function segmentPlate(
  cx: number,
  cy: number,
  w: number,
  h: number,
  taper: number
): string {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const t = cy - h / 2;
  const b = cy + h / 2;
  const inset = w * taper;
  return [
    `M${(l + inset).toFixed(1)} ${t.toFixed(1)}`,
    `L${(r - inset).toFixed(1)} ${t.toFixed(1)}`,
    `L${r.toFixed(1)} ${b.toFixed(1)}`,
    `L${l.toFixed(1)} ${b.toFixed(1)}`,
    "Z",
  ].join(" ");
}

function buildScorpion(p: BeastPalette): string {
  const parts: string[] = [];

  // Vertical articulated columns along right/bottom
  for (let col = 0; col < 7; col += 1) {
    const segments = 8 + (col % 3);
    for (let s = 0; s < segments; s += 1) {
      const nx = 0.55 + col * 0.07 + hash01(col, s) * 0.04;
      const ny = 0.08 + s * 0.1 + hash01(s, col) * 0.02;
      if (hash01(col + s, 1.5) > densityAt(nx, ny) * 0.92) continue;

      const cx = nx * CANVAS_W;
      const cy = ny * CANVAS_H;
      const w = 16 + col * 1.5 + hash01(col, s) * 6;
      const h = 11 + hash01(s, col + 2) * 5;
      const taper = 0.12 + hash01(col, s + 1) * 0.1;
      const stroke = pick(p.strokes, col, s);
      const fill = pick(p.fills, col + 1, s);
      const op = beastOp(0.16 + hash01(col, s) * 0.16);
      const fillOp = beastOp(0.09 + hash01(s, col) * 0.1);

      parts.push(
        `<path d="${segmentPlate(cx, cy, w, h, taper)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.95"/>`
      );

      // joint hinge line between segments
      parts.push(
        `<line x1="${(cx - w * 0.32).toFixed(1)}" y1="${(cy + h * 0.48).toFixed(1)}" x2="${(cx + w * 0.32).toFixed(1)}" y2="${(cy + h * 0.48).toFixed(1)}" stroke="rgba(${pick(p.accent, col, s)},${beastOp(0.22).toFixed(3)})" stroke-width="0.75"/>`
      );

      // armor ridge
      if (hash01(col, s + 7) > 0.4) {
        parts.push(
          `<line x1="${cx.toFixed(1)}" y1="${(cy - h * 0.25).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + h * 0.2).toFixed(1)}" stroke="rgba(${pick(p.accent, s, col)},${beastOp(0.16).toFixed(3)})" stroke-width="0.55"/>`
        );
      }
    }
  }

  // Side carapace arcs (pedipalp / claw suggestion — abstract)
  for (let i = 0; i < 10; i += 1) {
    const nx = 0.7 + hash01(i, 2) * 0.28;
    const ny = 0.55 + hash01(i, 4) * 0.4;
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.85) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 8 + hash01(i, 3) * 12;
    const a0 = Math.PI * 0.15 + hash01(i, 5) * 0.3;
    const a1 = a0 + Math.PI * 0.55;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r;
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r.toFixed(1)} ${(r * 0.7).toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${beastOp(0.12).toFixed(3)})" stroke-width="0.7"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Beetle Shell: iridescent elytra plates ─── */

function buildBeetle(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 32; i += 1) {
    const nx = 0.36 + hash01(i * 2.1, 1.4) * 0.68;
    const ny = hash01(i * 1.7, 3.8);
    const dens = densityAt(nx, ny);
    if (hash01(i + 2, 0.9) > dens * 0.85) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const w = 14 + hash01(i, 4) * 22;
    const h = 10 + hash01(i, 5) * 16;
    const rot = ((hash01(i, 6) - 0.5) * 40).toFixed(1);

    // elytron: rounded shield
    const d = [
      `M${(-w / 2).toFixed(1)} 0`,
      `Q0 ${(-h * 0.55).toFixed(1)} ${(w / 2).toFixed(1)} 0`,
      `Q${(w * 0.15).toFixed(1)} ${(h * 0.55).toFixed(1)} 0 ${(h * 0.65).toFixed(1)}`,
      `Q${(-w * 0.15).toFixed(1)} ${(h * 0.55).toFixed(1)} ${(-w / 2).toFixed(1)} 0`,
      "Z",
    ].join(" ");

    // color shift teal ↔ blue by position (iridescence)
    const t = (nx + ny) * 0.5;
    const stroke =
      t > 0.55
        ? p.strokes[Math.min(3, Math.floor(t * 4))]!
        : pick(p.strokes, i, 1);
    const fill = pick(p.fills, i, 2);
    const accent = t > 0.5 ? p.accent[1]! : p.accent[0]!;
    const op = beastOp(0.1 + hash01(i, 7) * 0.12);
    const fillOp = beastOp(0.05 + hash01(i, 8) * 0.08);

    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.65"/>` +
        `<path d="M${(-w * 0.28).toFixed(1)} ${(-h * 0.08).toFixed(1)} Q0 ${(-h * 0.35).toFixed(1)} ${(w * 0.28).toFixed(1)} ${(-h * 0.08).toFixed(1)}" fill="none" stroke="rgba(${accent},${beastOp(0.14).toFixed(3)})" stroke-width="0.5"/>` +
        `<line x1="0" y1="${(-h * 0.15).toFixed(1)}" x2="0" y2="${(h * 0.4).toFixed(1)}" stroke="rgba(${accent},${beastOp(0.1).toFixed(3)})" stroke-width="0.4"/>` +
        `</g>`
    );

    // secondary sheen flake
    if (hash01(i, 9.5) > 0.55) {
      const sx = cx + (hash01(i, 1) - 0.5) * w * 0.3;
      const sy = cy - h * 0.15;
      parts.push(
        `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${(2 + hash01(i, 2) * 3).toFixed(1)}" ry="${(1 + hash01(i, 3)).toFixed(1)}" fill="rgba(${accent},${beastOp(0.12).toFixed(3)})"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Manta Flow: smooth wing curves ─── */

function buildManta(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 22; i += 1) {
    const nx = 0.38 + hash01(i * 1.8, 2.1) * 0.66;
    const ny = hash01(i * 2.4, 3.5);
    if (hash01(i + 1, 0.6) > densityAt(nx, ny) * 0.88) continue;

    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const span = 40 + hash01(i, 4) * 70;
    const lift = 8 + hash01(i, 5) * 22;
    const ang = -0.25 + (hash01(i, 6) - 0.5) * 0.5;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    // wing: long S-curve ribbon
    const x1 = x0 + cos * span * 0.35 - sin * lift * 0.3;
    const y1 = y0 + sin * span * 0.35 + cos * lift * 0.3;
    const x2 = x0 + cos * span * 0.7 + sin * lift * 0.2;
    const y2 = y0 + sin * span * 0.7 - cos * lift * 0.2;
    const x3 = x0 + cos * span;
    const y3 = y0 + sin * span;

    const stroke = pick(p.strokes, i, 1);
    const accent = pick(p.accent, i, 2);
    const op = beastOp(0.09 + hash01(i, 7) * 0.12);
    const sw = (0.7 + hash01(i, 8) * 1.1).toFixed(2);

    parts.push(
      `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
    );

    // parallel flow companion (wing thickness)
    const off = 3.5 + hash01(i, 9) * 4;
    const ox = -sin * off;
    const oy = cos * off;
    parts.push(
      `<path d="M${(x0 + ox).toFixed(1)} ${(y0 + oy).toFixed(1)} C${(x1 + ox * 0.8).toFixed(1)} ${(y1 + oy * 0.8).toFixed(1)} ${(x2 + ox * 0.5).toFixed(1)} ${(y2 + oy * 0.5).toFixed(1)} ${(x3 + ox * 0.2).toFixed(1)} ${(y3 + oy * 0.2).toFixed(1)}" fill="none" stroke="rgba(${accent},${beastOp(0.07).toFixed(3)})" stroke-width="0.45" stroke-linecap="round"/>`
    );

    // soft fill lobe between curves
    if (hash01(i, 1.1) > 0.45) {
      const fill = pick(p.fills, i, 3);
      parts.push(
        `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)} L${(x3 + ox * 0.2).toFixed(1)} ${(y3 + oy * 0.2).toFixed(1)} C${(x2 + ox * 0.5).toFixed(1)} ${(y2 + oy * 0.5).toFixed(1)} ${(x1 + ox * 0.8).toFixed(1)} ${(y1 + oy * 0.8).toFixed(1)} ${(x0 + ox).toFixed(1)} ${(y0 + oy).toFixed(1)} Z" fill="rgba(${fill},${beastOp(0.04).toFixed(3)})" stroke="none"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Turtle Armor: irregular organic scutes ─── */

function irregularScute(
  cx: number,
  cy: number,
  r: number,
  n: number,
  seed: number
): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n + hash01(seed, i) * 0.25;
    const rr = r * (0.72 + hash01(seed + i, i + 2) * 0.45);
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.92).toFixed(1)}`);
  }
  return pts.join(" ");
}

function buildTurtle(p: BeastPalette): string {
  const parts: string[] = [];

  // Organic scute packing (jittered, not hex grid)
  for (let i = 0; i < 48; i += 1) {
    const nx = 0.32 + hash01(i * 1.6, 2.5) * 0.72;
    const ny = hash01(i * 2.2, 1.8);
    const dens = densityAt(nx, ny);
    if (hash01(i + 3, 0.8) > dens * 0.82) continue;

    const cx = nx * CANVAS_W + (hash01(i, 4) - 0.5) * 8;
    const cy = ny * CANVAS_H + (hash01(i, 5) - 0.5) * 8;
    const r = 9 + hash01(i, 6) * 14;
    const n = 5 + Math.floor(hash01(i, 7) * 3); // 5–7 sides, natural
    const stroke = pick(p.strokes, i, 1);
    const fill = pick(p.fills, i, 2);
    const op = beastOp(0.1 + hash01(i, 8) * 0.12);
    const fillOp = beastOp(0.05 + hash01(i, 9) * 0.08);

    parts.push(
      `<polygon points="${irregularScute(cx, cy, r, n, i * 11)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.55 + hash01(i, 1) * 0.45).toFixed(2)}" stroke-linejoin="round"/>`
    );

    // growth ring inside scute
    if (hash01(i, 2.2) > 0.4) {
      parts.push(
        `<polygon points="${irregularScute(cx, cy - 0.5, r * 0.55, n, i * 11 + 3)}" fill="none" stroke="rgba(${pick(p.accent, i, 3)},${beastOp(0.1).toFixed(3)})" stroke-width="0.4"/>`
      );
    }

    // suture notch between plates
    if (hash01(i, 3.3) > 0.7) {
      const a = hash01(i, 4.4) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.85;
      const y1 = cy + Math.sin(a) * r * 0.85;
      parts.push(
        `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="0.7" fill="rgba(${pick(p.accent, i, 5)},${beastOp(0.14).toFixed(3)})"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Carbon Weave: ultra-fine twill ─── */

function buildCarbon(p: BeastPalette): string {
  const parts: string[] = [];
  // Fine twill: two diagonal families forming carbon fiber weave
  const gap = 5.5;

  for (let i = -20; i < 90; i += 1) {
    // / direction
    const x0 = i * gap;
    const y0 = 0;
    const x1 = x0 + CANVAS_H * 0.55;
    const y1 = CANVAS_H;
    // sample midpoints for density culling via segments
    const segs = 8;
    for (let s = 0; s < segs; s += 1) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const ax = x0 + (x1 - x0) * t0;
      const ay = y0 + (y1 - y0) * t0;
      const bx = x0 + (x1 - x0) * t1;
      const by = y0 + (y1 - y0) * t1;
      const mx = (ax + bx) / 2 / CANVAS_W;
      const my = (ay + by) / 2 / CANVAS_H;
      if (mx < -0.05 || mx > 1.05) continue;
      if (hash01(i + s * 0.1, 1.1) > densityAt(mx, my) * 0.95) continue;
      const stroke = pick(p.strokes, i, s);
      const op = beastOp(0.09 + hash01(i, s) * 0.12);
      parts.push(
        `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.65"/>`
      );
    }
  }

  for (let i = -20; i < 90; i += 1) {
    // \ direction
    const x0 = i * gap + 2.2;
    const y0 = CANVAS_H;
    const x1 = x0 + CANVAS_H * 0.55;
    const y1 = 0;
    const segs = 8;
    for (let s = 0; s < segs; s += 1) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const ax = x0 + (x1 - x0) * t0;
      const ay = y0 + (y1 - y0) * t0;
      const bx = x0 + (x1 - x0) * t1;
      const by = y0 + (y1 - y0) * t1;
      const mx = (ax + bx) / 2 / CANVAS_W;
      const my = (ay + by) / 2 / CANVAS_H;
      if (mx < -0.05 || mx > 1.05) continue;
      if (hash01(i + s * 0.2, 2.2) > densityAt(mx, my) * 0.95) continue;
      const stroke = pick(p.strokes, i + 3, s);
      const op = beastOp(0.08 + hash01(i + 1, s) * 0.1);
      parts.push(
        `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.55"/>`
      );
    }
  }

  // sparse weave node highlights (fiber intersections)
  for (let i = 0; i < 40; i += 1) {
    const nx = 0.4 + hash01(i, 3.3) * 0.6;
    const ny = hash01(i, 4.4);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.75) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    parts.push(
      `<rect x="${(x - 0.6).toFixed(1)}" y="${(y - 0.6).toFixed(1)}" width="1.2" height="1.2" fill="rgba(${pick(p.accent, i, 1)},${beastOp(0.1).toFixed(3)})" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Damascus Steel: wavy layered grain ─── */

function buildDamascus(p: BeastPalette): string {
  const parts: string[] = [];
  const bands = 28;

  for (let b = 0; b < bands; b += 1) {
    const baseY = (b / bands) * CANVAS_H + hash01(b, 1) * 4;
    const amp = 4 + hash01(b, 2) * 10;
    const freq = 1.8 + hash01(b, 3) * 2.4;
    const phase = hash01(b, 4) * Math.PI * 2;
    const steps = 24;
    let d = "";
    let kept = false;

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const x = t * CANVAS_W;
      const y =
        baseY +
        Math.sin(t * Math.PI * freq + phase) * amp +
        Math.sin(t * Math.PI * freq * 1.7 + phase * 1.3) * amp * 0.35;
      const nx = t;
      const ny = y / CANVAS_H;
      if (hash01(b + s * 0.01, 5) > densityAt(nx, Math.min(1, Math.max(0, ny))) * 1.05) {
        if (kept) {
          // break stroke for sparsity
          const stroke = pick(p.strokes, b, s);
          const op = beastOp(0.07 + hash01(b, s) * 0.1);
          const sw = (0.45 + hash01(b, 6) * 0.7).toFixed(2);
          parts.push(
            `<path d="${d}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
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
      const stroke = pick(p.strokes, b, 7);
      const op = beastOp(0.07 + hash01(b, 8) * 0.1);
      parts.push(
        `<path d="${d}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.45 + hash01(b, 9) * 0.7).toFixed(2)}" stroke-linecap="round"/>`
      );
    }

    // secondary thinner grain between bands
    if (hash01(b, 10) > 0.4) {
      const y2 = baseY + amp * 0.4;
      let d2 = "";
      let k2 = false;
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const x = t * CANVAS_W;
        const y =
          y2 +
          Math.sin(t * Math.PI * freq * 1.15 + phase + 0.8) * amp * 0.55;
        if (hash01(b, s + 20) > densityAt(t, Math.min(1, y / CANVAS_H)) * 0.9) {
          if (k2) {
            parts.push(
              `<path d="${d2}" fill="none" stroke="rgba(${pick(p.accent, b, s)},${beastOp(0.05).toFixed(3)})" stroke-width="0.3"/>`
            );
            d2 = "";
            k2 = false;
          }
          continue;
        }
        d2 += k2 ? ` L${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`;
        k2 = true;
      }
      if (k2 && d2) {
        parts.push(
          `<path d="${d2}" fill="none" stroke="rgba(${pick(p.accent, b, 1)},${beastOp(0.05).toFixed(3)})" stroke-width="0.3"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Brushed Titanium: vertical hairlines ─── */

function buildTitanium(p: BeastPalette): string {
  const parts: string[] = [];
  const cols = 72;

  for (let c = 0; c < cols; c += 1) {
    const x = (c / cols) * CANVAS_W + hash01(c, 1) * 1.2;
    const nx = x / CANVAS_W;
    // break into vertical segments for density
    const segs = 10;
    for (let s = 0; s < segs; s += 1) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const y0 = t0 * CANVAS_H + hash01(c, s) * 2;
      const y1 = t1 * CANVAS_H - hash01(c + 1, s) * 2;
      const my = (t0 + t1) / 2;
      if (hash01(c * 0.5 + s, 2) > densityAt(nx, my) * 0.98) continue;

      const stroke = pick(p.strokes, c, s);
      const op = beastOp(0.04 + hash01(c, s + 3) * 0.09);
      const sw = (0.25 + hash01(c, s + 5) * 0.45).toFixed(2);
      // slight length jitter — brushed feel
      const inset = hash01(c, s + 7) * 3;
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${(y0 + inset).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y1 - inset).toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
      );

      // occasional brighter hairline catch
      if (hash01(c, s + 9) > 0.88) {
        parts.push(
          `<line x1="${(x + 0.6).toFixed(1)}" y1="${(y0 + 4).toFixed(1)}" x2="${(x + 0.6).toFixed(1)}" y2="${(y0 + 18 + hash01(c, s) * 20).toFixed(1)}" stroke="rgba(${pick(p.accent, c, s)},${beastOp(0.12).toFixed(3)})" stroke-width="0.3"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Black Velvet: light sinks into soft piles ─── */

function buildVelvet(p: BeastPalette): string {
  const parts: string[] = [];

  // Soft pile ellipses — darker sinks
  for (let i = 0; i < 36; i += 1) {
    const nx = 0.35 + hash01(i * 2.1, 1.2) * 0.7;
    const ny = hash01(i * 1.8, 3.4);
    if (hash01(i + 2, 0.6) > densityAt(nx, ny) * 0.88) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rx = 10 + hash01(i, 4) * 22;
    const ry = 7 + hash01(i, 5) * 16;
    const rot = ((hash01(i, 6) - 0.5) * 50).toFixed(1);
    const fill = pick(p.fills, i, 1);
    const stroke = pick(p.strokes, i, 2);
    // sink = higher fill opacity, lower edge
    const fillOp = beastOp(0.12 + hash01(i, 7) * 0.14);
    parts.push(
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="none" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
    );
    // soft catch-light rim (only partial arc)
    const a0 = hash01(i, 8) * Math.PI;
    const a1 = a0 + Math.PI * (0.35 + hash01(i, 9) * 0.4);
    const x1 = cx + Math.cos(a0) * rx * 0.92;
    const y1 = cy + Math.sin(a0) * ry * 0.92;
    const x2 = cx + Math.cos(a1) * rx * 0.92;
    const y2 = cy + Math.sin(a1) * ry * 0.92;
    parts.push(
      `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} ${rot} 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, i, 1)},${beastOp(0.18).toFixed(3)})" stroke-width="1.0" stroke-linecap="round"/>`
    );
    // micro pile strokes
    const n = 6 + Math.floor(hash01(i, 10) * 8);
    for (let k = 0; k < n; k += 1) {
      const a = hash01(i, k) * Math.PI * 2;
      const r = rx * (0.2 + hash01(i + k, 1) * 0.55);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      const len = 2 + hash01(i, k + 2) * 4;
      parts.push(
        `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${(px + Math.cos(a + 0.4) * len).toFixed(1)}" y2="${(py + Math.sin(a + 0.4) * len).toFixed(1)}" stroke="rgba(${stroke},${beastOp(0.1).toFixed(3)})" stroke-width="0.55" stroke-linecap="round"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Liquid Chrome: soft specular ribbons ─── */

function buildChrome(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 18; i += 1) {
    const nx = 0.38 + hash01(i * 1.7, 2) * 0.65;
    const ny = hash01(i * 2.3, 3.1);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.9) continue;

    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const span = 50 + hash01(i, 4) * 90;
    const amp = 10 + hash01(i, 5) * 28;
    const ang = -0.4 + (hash01(i, 6) - 0.5) * 0.8;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const x1 = x0 + cos * span * 0.33 - sin * amp;
    const y1 = y0 + sin * span * 0.33 + cos * amp;
    const x2 = x0 + cos * span * 0.66 + sin * amp * 0.7;
    const y2 = y0 + sin * span * 0.66 - cos * amp * 0.7;
    const x3 = x0 + cos * span;
    const y3 = y0 + sin * span;

    const stroke = pick(p.strokes, i, 1);
    const accent = pick(p.accent, i, 2);
    const op = beastOp(0.08 + hash01(i, 7) * 0.12);
    const sw = (1.2 + hash01(i, 8) * 2.4).toFixed(2);

    // soft body ribbon
    parts.push(
      `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}" fill="none" stroke="rgba(${pick(p.fills, i, 1)},${beastOp(0.06).toFixed(3)})" stroke-width="${(Number(sw) * 2.2).toFixed(1)}" stroke-linecap="round"/>`
    );
    // specular core
    parts.push(
      `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="round"/>`
    );
    // hot highlight
    parts.push(
      `<path d="M${(x0 + cos * 4).toFixed(1)} ${(y0 + sin * 4).toFixed(1)} C${x1.toFixed(1)} ${y1.toFixed(1)} ${(x2 - cos * 8).toFixed(1)} ${(y2 - sin * 8).toFixed(1)} ${(x3 - cos * 12).toFixed(1)} ${(y3 - sin * 12).toFixed(1)}" fill="none" stroke="rgba(${accent},${beastOp(0.16).toFixed(3)})" stroke-width="0.55" stroke-linecap="round"/>`
    );

    // droplet glints
    if (hash01(i, 9) > 0.45) {
      const gx = x0 + cos * span * (0.3 + hash01(i, 1) * 0.4);
      const gy = y0 + sin * span * (0.3 + hash01(i, 2) * 0.4);
      parts.push(
        `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${(1.5 + hash01(i, 3) * 2).toFixed(1)}" ry="0.7" fill="rgba(${accent},${beastOp(0.18).toFixed(3)})" transform="rotate(${(ang * 57.3).toFixed(1)} ${gx.toFixed(1)} ${gy.toFixed(1)})"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Cracked Gold: kintsugi repair lines ─── */

function kintsugiBranch(
  x: number,
  y: number,
  ang: number,
  len: number,
  depth: number,
  parts: string[],
  p: BeastPalette,
  seed: number
): void {
  if (depth <= 0 || len < 5) return;
  const steps = 3 + Math.floor(hash01(seed, depth) * 3);
  let cx = x;
  let cy = y;
  let a = ang;
  const stroke = pick(p.strokes, seed, depth);
  const isMain = depth >= 3;
  const op = beastOp((isMain ? 0.14 : 0.07) + hash01(seed, depth) * 0.1);
  const sw = (isMain ? 0.85 : 0.4) + hash01(seed, depth + 1) * (isMain ? 0.5 : 0.3);

  for (let i = 0; i < steps; i += 1) {
    a += (hash01(seed + i, depth * 2) - 0.5) * 0.65;
    const seg = len / steps;
    const nx = cx + Math.cos(a) * seg;
    const ny = cy + Math.sin(a) * seg;
    parts.push(
      `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}" stroke-linecap="round"/>`
    );
    cx = nx;
    cy = ny;
    if (isMain && hash01(seed + i, 8) > 0.78) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1" fill="rgba(${pick(p.accent, seed, i)},${beastOp(0.18).toFixed(3)})"/>`
      );
    }
  }

  if (hash01(seed, depth + 4) > 0.32) {
    kintsugiBranch(cx, cy, a + 0.55, len * 0.52, depth - 1, parts, p, seed + 19);
  }
  if (hash01(seed + 2, depth + 5) > 0.42) {
    kintsugiBranch(cx, cy, a - 0.6, len * 0.45, depth - 1, parts, p, seed + 37);
  }
}

function buildKintsugi(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 12; i += 1) {
    const side = Math.floor(hash01(i, 0.4) * 3);
    let x: number;
    let y: number;
    let ang: number;
    if (side === 0) {
      x = CANVAS_W * (0.7 + hash01(i, 1) * 0.3);
      y = CANVAS_H * hash01(i, 2);
      ang = Math.PI + (hash01(i, 3) - 0.5) * 0.8;
    } else if (side === 1) {
      x = CANVAS_W * (0.45 + hash01(i, 4) * 0.55);
      y = CANVAS_H * (0.75 + hash01(i, 5) * 0.25);
      ang = -Math.PI / 2 + (hash01(i, 6) - 0.5) * 0.9;
    } else {
      x = CANVAS_W * (0.62 + hash01(i, 7) * 0.38);
      y = CANVAS_H * hash01(i, 8) * 0.3;
      ang = Math.PI * 0.8 + (hash01(i, 9) - 0.5) * 0.6;
    }
    if (hash01(i + 10, 1) > densityAt(x / CANVAS_W, y / CANVAS_H) * 0.98) continue;
    kintsugiBranch(x, y, ang, 42 + hash01(i, 11) * 50, 4, parts, p, i * 17 + 3);
  }

  // fine hairline cracks (ungilded)
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.38 + hash01(i * 2, 1.5) * 0.65;
    const ny = hash01(i * 1.7, 4);
    if (hash01(i, 0.3) > densityAt(nx, ny) * 0.75) continue;
    const x = nx * CANVAS_W;
    const y = ny * CANVAS_H;
    const a = hash01(i, 5) * Math.PI * 2;
    const len = 5 + hash01(i, 6) * 12;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * len).toFixed(1)}" y2="${(y + Math.sin(a) * len).toFixed(1)}" stroke="rgba(${pick(p.fills, i, 1)},${beastOp(0.06).toFixed(3)})" stroke-width="0.3"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Meteorite: Widmanstätten crystal needles ─── */

function buildMeteorite(p: BeastPalette): string {
  const parts: string[] = [];

  // Interlocking crystal plates / needles at characteristic angles
  const angles = [-0.55, 0.55, 1.2, -1.2, 0.15, Math.PI / 2];

  for (let i = 0; i < 55; i += 1) {
    const nx = 0.34 + hash01(i * 1.9, 1.1) * 0.7;
    const ny = hash01(i * 2.2, 3.3);
    if (hash01(i + 1, 0.7) > densityAt(nx, ny) * 0.85) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const ang = angles[Math.floor(hash01(i, 4) * angles.length)]! + (hash01(i, 5) - 0.5) * 0.15;
    const len = 12 + hash01(i, 6) * 28;
    const half = len / 2;
    const x1 = cx - Math.cos(ang) * half;
    const y1 = cy - Math.sin(ang) * half;
    const x2 = cx + Math.cos(ang) * half;
    const y2 = cy + Math.sin(ang) * half;
    const stroke = pick(p.strokes, i, 1);
    const op = beastOp(0.14 + hash01(i, 7) * 0.16);
    const sw = (0.7 + hash01(i, 8) * 0.9).toFixed(2);

    parts.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${sw}" stroke-linecap="square"/>`
    );

    // cross-hatch partner at crystal angle
    if (hash01(i, 9) > 0.4) {
      const ang2 = ang + (hash01(i, 10) > 0.5 ? 1.1 : -1.1);
      const len2 = len * (0.4 + hash01(i, 11) * 0.4);
      parts.push(
        `<line x1="${(cx - Math.cos(ang2) * len2 * 0.5).toFixed(1)}" y1="${(cy - Math.sin(ang2) * len2 * 0.5).toFixed(1)}" x2="${(cx + Math.cos(ang2) * len2 * 0.5).toFixed(1)}" y2="${(cy + Math.sin(ang2) * len2 * 0.5).toFixed(1)}" stroke="rgba(${pick(p.accent, i, 2)},${beastOp(0.14).toFixed(3)})" stroke-width="0.55"/>`
      );
    }
  }

  // sparse crystal facet polygons
  for (let i = 0; i < 14; i += 1) {
    const nx = 0.4 + hash01(i * 3, 2) * 0.6;
    const ny = hash01(i * 2.5, 4);
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.7) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 5 + hash01(i, 5) * 9;
    const n = 3 + Math.floor(hash01(i, 6) * 3);
    const pts: string[] = [];
    for (let k = 0; k < n; k += 1) {
      const a = (Math.PI * 2 * k) / n + hash01(i, k) * 0.3;
      const rr = r * (0.7 + hash01(i + k, 1) * 0.4);
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    parts.push(
      `<polygon points="${pts.join(" ")}" fill="rgba(${pick(p.fills, i, 1)},${beastOp(0.045).toFixed(3)})" stroke="rgba(${pick(p.strokes, i, 2)},${beastOp(0.09).toFixed(3)})" stroke-width="0.45"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Holographic Silk: polarized folds ─── */

function buildHolosilk(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 20; i += 1) {
    const nx = 0.36 + hash01(i * 1.6, 1.4) * 0.68;
    const ny = hash01(i * 2.1, 3.2);
    if (hash01(i + 1, 0.55) > densityAt(nx, ny) * 0.88) continue;

    const x0 = nx * CANVAS_W;
    const y0 = ny * CANVAS_H;
    const span = 35 + hash01(i, 4) * 65;
    const fold = 6 + hash01(i, 5) * 18;
    const ang = -0.3 + (hash01(i, 6) - 0.5) * 0.7;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    // fabric fold as soft S
    const c1x = x0 + cos * span * 0.3 - sin * fold;
    const c1y = y0 + sin * span * 0.3 + cos * fold;
    const c2x = x0 + cos * span * 0.7 + sin * fold * 0.6;
    const c2y = y0 + sin * span * 0.7 - cos * fold * 0.6;
    const x3 = x0 + cos * span;
    const y3 = y0 + sin * span;

    // base fold shadow
    parts.push(
      `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}" fill="none" stroke="rgba(${pick(p.fills, i, 1)},${beastOp(0.07).toFixed(3)})" stroke-width="${(1.8 + hash01(i, 7) * 2).toFixed(1)}" stroke-linecap="round"/>`
    );

    // polarized color bands along fold (cyan → violet → magenta)
    const colors = [p.strokes[0]!, p.strokes[2]!, p.strokes[1]!, p.accent[0]!, p.accent[1]!];
    for (let b = 0; b < 4; b += 1) {
      const off = (b - 1.5) * 1.4;
      const ox = -sin * off;
      const oy = cos * off;
      const col = colors[b % colors.length]!;
      const op = beastOp(0.05 + hash01(i, b) * 0.08);
      parts.push(
        `<path d="M${(x0 + ox).toFixed(1)} ${(y0 + oy).toFixed(1)} C${(c1x + ox).toFixed(1)} ${(c1y + oy).toFixed(1)} ${(c2x + ox * 0.5).toFixed(1)} ${(c2y + oy * 0.5).toFixed(1)} ${(x3 + ox * 0.2).toFixed(1)} ${(y3 + oy * 0.2).toFixed(1)}" fill="none" stroke="rgba(${col},${op.toFixed(3)})" stroke-width="0.45" stroke-linecap="round"/>`
      );
    }

    // weave micro-lines perpendicular to fold
    const ticks = 5 + Math.floor(hash01(i, 8) * 5);
    for (let t = 1; t < ticks; t += 1) {
      const tt = t / ticks;
      const bx =
        (1 - tt) * (1 - tt) * (1 - tt) * x0 +
        3 * (1 - tt) * (1 - tt) * tt * c1x +
        3 * (1 - tt) * tt * tt * c2x +
        tt * tt * tt * x3;
      const by =
        (1 - tt) * (1 - tt) * (1 - tt) * y0 +
        3 * (1 - tt) * (1 - tt) * tt * c1y +
        3 * (1 - tt) * tt * tt * c2y +
        tt * tt * tt * y3;
      const tw = 2.5 + hash01(i, t) * 3;
      parts.push(
        `<line x1="${(bx - sin * tw).toFixed(1)}" y1="${(by + cos * tw).toFixed(1)}" x2="${(bx + sin * tw).toFixed(1)}" y2="${(by - cos * tw).toFixed(1)}" stroke="rgba(${pick(p.strokes, i, t)},${beastOp(0.04).toFixed(3)})" stroke-width="0.3"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Monogram Grid: repeated U marks ─── */

function monogramU(cx: number, cy: number, s: number): string {
  const t = s * 0.18;
  const w = s * 0.72;
  const h = s;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2 - t;
  return [
    `M${l.toFixed(1)} ${top.toFixed(1)}`,
    `L${l.toFixed(1)} ${bot.toFixed(1)}`,
    `Q${cx.toFixed(1)} ${(bot + s * 0.35).toFixed(1)} ${r.toFixed(1)} ${bot.toFixed(1)}`,
    `L${r.toFixed(1)} ${top.toFixed(1)}`,
  ].join(" ");
}

function buildMonogram(p: BeastPalette): string {
  const parts: string[] = [];
  const colStep = 22;
  const rowStep = 24;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep * 0.5);
      const cy = row * rowStep;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (hash01(col + 1, row + 2) > densityAt(nx, ny) * 0.82) continue;

      const s = 7.5 + hash01(col, row) * 4.5;
      const stroke = pick(p.strokes, col, row);
      const op = beastOp(0.08 + hash01(col, row + 5) * 0.12);
      parts.push(
        `<path d="${monogramU(cx, cy, s)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.55 + hash01(col, row) * 0.35).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`
      );

      // tiny crosshair under some monograms (brand grid feel)
      if (hash01(col + 3, row + 7) > 0.78) {
        const a = pick(p.accent, col, row);
        parts.push(
          `<line x1="${(cx - 2).toFixed(1)}" y1="${(cy + s * 0.55).toFixed(1)}" x2="${(cx + 2).toFixed(1)}" y2="${(cy + s * 0.55).toFixed(1)}" stroke="rgba(${a},${beastOp(0.1).toFixed(3)})" stroke-width="0.35"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Interlock Chain: linked rings ─── */

function buildChain(p: BeastPalette): string {
  const parts: string[] = [];
  const step = 18;

  for (let row = 0; row < 28; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      const cx = col * step + (row % 2) * (step * 0.5);
      const cy = row * step * 0.72;
      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      if (hash01(col + 0.5, row + 1.2) > densityAt(nx, ny) * 0.85) continue;

      const rx = 7 + hash01(col, row) * 3.5;
      const ry = 5 + hash01(col + 1, row) * 2.5;
      const stroke = pick(p.strokes, col, row);
      const op = beastOp(0.09 + hash01(col, row) * 0.11);
      const rot = row % 2 === 0 ? 0 : 18;

      parts.push(
        `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.7" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
      );

      // link highlight arc
      if (hash01(col, row + 4) > 0.55) {
        const a0 = -0.4;
        const a1 = 0.9;
        const x1 = cx + Math.cos(a0) * rx;
        const y1 = cy + Math.sin(a0) * ry;
        const x2 = cx + Math.cos(a1) * rx;
        const y2 = cy + Math.sin(a1) * ry;
        parts.push(
          `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} ${rot} 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${pick(p.accent, col, row)},${beastOp(0.12).toFixed(3)})" stroke-width="0.45"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Royal Chevron: stacked thin Vs ─── */

function buildChevron(p: BeastPalette): string {
  const parts: string[] = [];
  const rowStep = 10;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    const y = row * rowStep;
    const amp = 7 + (row % 3) * 1.5;
    const colStep = 16;
    const cols = Math.ceil(CANVAS_W / colStep) + 2;
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const nx = cx / CANVAS_W;
      const ny = y / CANVAS_H;
      if (hash01(col + row * 0.1, 2) > densityAt(nx, ny) * 0.92) continue;

      const tipY = y + amp * 0.85;
      const lx = cx - amp;
      const rx = cx + amp;
      const stroke = pick(p.strokes, col, row);
      const op = beastOp(0.07 + hash01(col, row) * 0.1);
      parts.push(
        `<path d="M${lx.toFixed(1)} ${y.toFixed(1)} L${cx.toFixed(1)} ${tipY.toFixed(1)} L${rx.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.4 + hash01(col, row) * 0.35).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`
      );

      // secondary nested chevron
      if (hash01(col, row + 5) > 0.65) {
        const a = pick(p.accent, col, row);
        parts.push(
          `<path d="M${(lx + 2.2).toFixed(1)} ${(y + 1.2).toFixed(1)} L${cx.toFixed(1)} ${(tipY - 1.5).toFixed(1)} L${(rx - 2.2).toFixed(1)} ${(y + 1.2).toFixed(1)}" fill="none" stroke="rgba(${a},${beastOp(0.08).toFixed(3)})" stroke-width="0.3"/>`
        );
      }
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Neo Damier: warped cyber checker ─── */

function buildDamier(p: BeastPalette): string {
  const parts: string[] = [];
  const n = 14;

  for (let row = 0; row < n + 4; row += 1) {
    for (let col = 0; col < n + 2; col += 1) {
      // perspective-ish warp toward right/bottom
      const u = col / n;
      const v = row / n;
      const warp = 1 + u * 0.35 + v * 0.15;
      const cx = 40 + u * CANVAS_W * 0.95 * warp + Math.sin(v * 4) * 4;
      const cy = v * CANVAS_H * 0.95 + Math.sin(u * 3.5) * 6;
      const nx = Math.min(1, Math.max(0, cx / CANVAS_W));
      const ny = Math.min(1, Math.max(0, cy / CANVAS_H));
      if (hash01(col + 1.1, row + 2.2) > densityAt(nx, ny) * 0.88) continue;

      const isDark = (col + row) % 2 === 0;
      const size = (7 + hash01(col, row) * 4) * (0.85 + u * 0.25);
      const rot = ((hash01(col, row) - 0.5) * 12 + u * 8).toFixed(1);
      const fill = isDark ? pick(p.fills, col, row) : pick(p.strokes, col, row);
      const stroke = pick(p.accent, col, row);
      const fillOp = beastOp(isDark ? 0.06 + hash01(col, row) * 0.06 : 0.035);
      const op = beastOp(0.07 + hash01(col + 3, row) * 0.08);

      const half = size / 2;
      const d = [
        `M${(-half).toFixed(1)} ${(-half).toFixed(1)}`,
        `L${half.toFixed(1)} ${(-half).toFixed(1)}`,
        `L${half.toFixed(1)} ${half.toFixed(1)}`,
        `L${(-half).toFixed(1)} ${half.toFixed(1)}`,
        "Z",
      ].join(" ");

      parts.push(
        `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
          `<path d="${d}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.4"/>` +
          `</g>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Crown Matrix: tiny crowns as dots ─── */

function crownPath(cx: number, cy: number, s: number): string {
  const w = s;
  const h = s * 0.72;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const base = cy + h * 0.35;
  const top = cy - h * 0.45;
  const mid = cy - h * 0.05;
  return [
    `M${l.toFixed(1)} ${base.toFixed(1)}`,
    `L${l.toFixed(1)} ${mid.toFixed(1)}`,
    `L${(l + w * 0.2).toFixed(1)} ${top.toFixed(1)}`,
    `L${cx.toFixed(1)} ${(mid - h * 0.1).toFixed(1)}`,
    `L${(r - w * 0.2).toFixed(1)} ${top.toFixed(1)}`,
    `L${r.toFixed(1)} ${mid.toFixed(1)}`,
    `L${r.toFixed(1)} ${base.toFixed(1)}`,
    "Z",
  ].join(" ");
}

function buildCrown(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 55; i += 1) {
    const nx = 0.32 + hash01(i * 1.7, 1.3) * 0.72;
    const ny = hash01(i * 2.1, 3.5);
    if (hash01(i + 2, 0.6) > densityAt(nx, ny) * 0.8) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 5 + hash01(i, 4) * 7;
    const stroke = pick(p.strokes, i, 1);
    const fill = pick(p.fills, i, 2);
    const op = beastOp(0.09 + hash01(i, 5) * 0.12);
    const fillOp = beastOp(0.04 + hash01(i, 6) * 0.06);

    parts.push(
      `<path d="${crownPath(cx, cy, s)}" fill="rgba(${fill},${fillOp.toFixed(3)})" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="0.45" stroke-linejoin="round"/>`
    );

    // jewel tip dots
    if (hash01(i, 7) > 0.5) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${(cy - s * 0.32).toFixed(1)}" r="0.7" fill="rgba(${pick(p.accent, i, 1)},${beastOp(0.16).toFixed(3)})"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Constellation: stars + thin links ─── */

function buildConstellation(p: BeastPalette): string {
  const parts: string[] = [];
  const stars: { x: number; y: number; bright: number }[] = [];

  for (let i = 0; i < 48; i += 1) {
    const nx = 0.3 + hash01(i * 1.9, 1.1) * 0.75;
    const ny = hash01(i * 2.4, 3.2);
    if (hash01(i, 0.5) > densityAt(nx, ny) * 0.9) continue;
    stars.push({
      x: nx * CANVAS_W,
      y: ny * CANVAS_H,
      bright: hash01(i, 4),
    });
  }

  // connect nearby stars
  for (let i = 0; i < stars.length; i += 1) {
    const a = stars[i]!;
    let links = 0;
    for (let j = i + 1; j < stars.length && links < 2; j += 1) {
      const b = stars[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 28 || d > 62) continue;
      if (hash01(i + j, 5) > 0.55) continue;
      const stroke = pick(p.strokes, i, j);
      parts.push(
        `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(${stroke},${beastOp(0.06 + (1 - d / 62) * 0.06).toFixed(3)})" stroke-width="0.35"/>`
      );
      links += 1;
    }
  }

  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i]!;
    const r = 0.7 + s.bright * 1.4;
    const accent = pick(p.accent, i, 1);
    parts.push(
      `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(${accent},${beastOp(0.12 + s.bright * 0.12).toFixed(3)})"/>`
    );
    if (s.bright > 0.72) {
      const arm = 2.2 + s.bright * 2;
      parts.push(
        `<line x1="${(s.x - arm).toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${(s.x + arm).toFixed(1)}" y2="${s.y.toFixed(1)}" stroke="rgba(${accent},${beastOp(0.14).toFixed(3)})" stroke-width="0.4"/>` +
          `<line x1="${s.x.toFixed(1)}" y1="${(s.y - arm).toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${(s.y + arm).toFixed(1)}" stroke="rgba(${accent},${beastOp(0.14).toFixed(3)})" stroke-width="0.4"/>`
      );
    }
  }

  return wrapSvg(parts.join(""));
}

/* ─── Circuit Lace: lace curves + circuit nodes ─── */

function buildCircuitLace(p: BeastPalette): string {
  const parts: string[] = [];

  // Lace loops
  for (let i = 0; i < 28; i += 1) {
    const nx = 0.34 + hash01(i * 2, 1.4) * 0.7;
    const ny = hash01(i * 1.8, 3.6);
    if (hash01(i + 1, 0.55) > densityAt(nx, ny) * 0.85) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const r = 8 + hash01(i, 4) * 16;
    const lobes = 4 + Math.floor(hash01(i, 5) * 3);
    let d = "";
    for (let k = 0; k <= lobes * 2; k += 1) {
      const t = k / (lobes * 2);
      const a = t * Math.PI * 2;
      const rr = r * (0.55 + 0.45 * Math.abs(Math.sin(a * (lobes / 2))));
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.88;
      d += k === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += " Z";
    const stroke = pick(p.strokes, i, 1);
    parts.push(
      `<path d="${d}" fill="none" stroke="rgba(${stroke},${beastOp(0.07 + hash01(i, 6) * 0.08).toFixed(3)})" stroke-width="0.45"/>`
    );

    // circuit traces radiating
    const rays = 3 + Math.floor(hash01(i, 7) * 3);
    for (let k = 0; k < rays; k += 1) {
      const a = hash01(i, k + 8) * Math.PI * 2;
      const len = r * (0.7 + hash01(i, k) * 0.8);
      const x2 = cx + Math.cos(a) * len;
      const y2 = cy + Math.sin(a) * len;
      const mid = len * 0.55;
      const xm = cx + Math.cos(a) * mid;
      const ym = cy + Math.sin(a) * mid;
      // elbow: horizontal then to tip (circuit style)
      const elbow =
        hash01(i, k + 10) > 0.5
          ? `M${cx.toFixed(1)} ${cy.toFixed(1)} L${xm.toFixed(1)} ${cy.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`
          : `M${cx.toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} ${ym.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
      parts.push(
        `<path d="${elbow}" fill="none" stroke="rgba(${pick(p.accent, i, k)},${beastOp(0.08).toFixed(3)})" stroke-width="0.4"/>`
      );
      parts.push(
        `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="1" fill="none" stroke="rgba(${pick(p.strokes, i, k + 2)},${beastOp(0.12).toFixed(3)})" stroke-width="0.45"/>`
      );
    }

    // center via
    parts.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.2" fill="rgba(${pick(p.accent, i, 3)},${beastOp(0.14).toFixed(3)})"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── Void Ripple: dark concentric rings ─── */

function buildRipple(p: BeastPalette): string {
  const parts: string[] = [];

  for (let i = 0; i < 12; i += 1) {
    const nx = 0.45 + hash01(i * 2.2, 1.2) * 0.55;
    const ny = 0.15 + hash01(i * 1.7, 3.1) * 0.75;
    if (hash01(i, 0.4) > densityAt(nx, ny) * 0.95) continue;

    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const rings = 4 + Math.floor(hash01(i, 4) * 5);
    const baseR = 6 + hash01(i, 5) * 10;

    for (let r = 1; r <= rings; r += 1) {
      const rr = baseR + r * (5 + hash01(i, r) * 3);
      const stroke = pick(p.strokes, i, r);
      const op = beastOp(0.16 - r * 0.01 + hash01(i, r + 6) * 0.06);
      // incomplete arcs — void / sparse feel
      const a0 = hash01(i, r + 8) * Math.PI * 2;
      const sweep = Math.PI * (0.7 + hash01(i, r + 9) * 1.0);
      const a1 = a0 + sweep;
      const x1 = cx + Math.cos(a0) * rr;
      const y1 = cy + Math.sin(a0) * rr;
      const x2 = cx + Math.cos(a1) * rr;
      const y2 = cy + Math.sin(a1) * rr;
      const large = sweep > Math.PI ? 1 : 0;
      parts.push(
        `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="rgba(${stroke},${op.toFixed(3)})" stroke-width="${(0.7 + (1 - r / rings) * 0.65).toFixed(2)}" stroke-linecap="round"/>`
      );
    }

    // quiet center sink
    parts.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.5 + hash01(i, 10)).toFixed(1)}" fill="rgba(${pick(p.fills, i, 1)},${beastOp(0.14).toFixed(3)})" stroke="rgba(${pick(p.accent, i, 2)},${beastOp(0.2).toFixed(3)})" stroke-width="0.55"/>`
    );
  }

  return wrapSvg(parts.join(""));
}

/* ─── HUD (shared placement with scale) ─── */

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

function buildHudSvg(variant: ProfilePlanProBeastBgVariant): string {
  const { hudPrimary, hudSecondary } = PALETTES[variant];
  const g: string[] = [];

  g.push(dotGrid(210, 20, 70, 34, 8, beastOp(0.12), hudPrimary));
  g.push(tickRow(196, 66, 12, 7.5, 3, beastOp(0.22), hudSecondary));
  g.push(plusMark(276, 40, 3, beastOp(0.3), hudPrimary));
  g.push(plusMark(288, 190, 2.6, beastOp(0.26), hudPrimary));
  g.push(tickRow(286, 150, 8, 6, 2.4, beastOp(0.18), hudSecondary));
  g.push(dotGrid(24, 372, 60, 40, 9, beastOp(0.1), hudPrimary));
  g.push(tickRow(150, 420, 16, 6, 2.2, beastOp(0.16), hudSecondary));
  g.push(plusMark(280, 400, 3, beastOp(0.24), hudPrimary));

  return wrapSvg(g.join(""));
}

function buildSkinSvg(variant: ProfilePlanProBeastBgVariant): string {
  const p = PALETTES[variant];
  activeOpacityMul = p.opacityMul ?? 1;
  try {
    switch (variant) {
      case "beast-panther":
        return buildPanther(p);
      case "beast-crocodile":
        return buildCrocodile(p);
      case "beast-tiger":
        return buildTiger(p);
      case "beast-drake":
        return buildDrake(p);
      case "beast-raven":
        return buildRaven(p);
      case "beast-wolf":
        return buildWolf(p);
      case "beast-diamond":
        return buildDiamond(p);
      case "beast-marble":
        return buildMarble(p);
      case "beast-viper":
        return buildViper(p);
      case "beast-shark":
        return buildShark(p);
      case "beast-falcon":
        return buildFalcon(p);
      case "beast-leopard":
        return buildLeopard(p);
      case "beast-scorpion":
        return buildScorpion(p);
      case "beast-beetle":
        return buildBeetle(p);
      case "beast-manta":
        return buildManta(p);
      case "beast-turtle":
        return buildTurtle(p);
      case "beast-carbon":
        return buildCarbon(p);
      case "beast-damascus":
        return buildDamascus(p);
      case "beast-titanium":
        return buildTitanium(p);
      case "beast-velvet":
        return buildVelvet(p);
      case "beast-chrome":
        return buildChrome(p);
      case "beast-kintsugi":
        return buildKintsugi(p);
      case "beast-meteorite":
        return buildMeteorite(p);
      case "beast-holosilk":
        return buildHolosilk(p);
      case "beast-monogram":
        return buildMonogram(p);
      case "beast-chain":
        return buildChain(p);
      case "beast-chevron":
        return buildChevron(p);
      case "beast-damier":
        return buildDamier(p);
      case "beast-crown":
        return buildCrown(p);
      case "beast-constellation":
        return buildConstellation(p);
      case "beast-circuitlace":
        return buildCircuitLace(p);
      case "beast-ripple":
        return buildRipple(p);
      default:
        return wrapSvg("");
    }
  } finally {
    activeOpacityMul = 1;
  }
}

/** 疎な獣皮 / 宝石レイヤー */
export function getProfilePlanProBeastSkinUrl(
  variant: ProfilePlanProBeastBgVariant
): string {
  return cachedUrl(`beast:skin:${variant}:v8`, () => buildSkinSvg(variant));
}

/** 微細 HUD */
export function getProfilePlanProBeastHudUrl(
  variant: ProfilePlanProBeastBgVariant
): string {
  return cachedUrl(`beast:hud:${variant}:v8`, () => buildHudSvg(variant));
}

export const PROFILE_PLAN_PRO_BEAST_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
