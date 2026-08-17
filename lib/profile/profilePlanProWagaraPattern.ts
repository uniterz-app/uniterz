/**
 * PRO 背景 — 和柄×サイバー 10 案の SVG 模様生成
 * atmos / scale / cosmos と同じ配置思想:
 * 疎な図形・中央空け・右下〜端に寄せ・微細 HUD
 */

import type { ProfilePlanProWagaraBgVariant } from "./profilePlanProWagaraBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;

export const PROFILE_PLAN_PRO_WAGARA_OPACITY_SCALE = 2.15;

type WagaraPalette = {
  strokes: readonly string[];
  fills: readonly string[];
  accent: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProWagaraBgVariant, WagaraPalette> = {
  "wagara-seigaiha": {
    strokes: ["56,189,248", "14,165,233", "103,232,249", "2,132,199"],
    fills: ["8,47,73", "12,74,110", "4,30,50"],
    accent: ["186,230,253", "224,242,254"],
    hudPrimary: "rgba(56,189,248,",
    hudSecondary: "rgba(14,165,233,",
    opacityMul: 2.0,
  },
  "wagara-asanoha": {
    strokes: ["52,211,153", "16,185,129", "110,231,183", "5,150,105"],
    fills: ["6,58,44", "4,47,36", "2,32,25"],
    accent: ["167,243,208", "209,250,229"],
    hudPrimary: "rgba(52,211,153,",
    hudSecondary: "rgba(16,185,129,",
    opacityMul: 1.95,
  },
  "wagara-kikkou": {
    strokes: ["234,179,8", "212,168,40", "253,224,71", "180,140,30"],
    fills: ["45,35,12", "60,45,16", "28,20,8"],
    accent: ["254,240,138", "253,224,71"],
    hudPrimary: "rgba(234,179,8,",
    hudSecondary: "rgba(212,168,40,",
    opacityMul: 2.0,
  },
  "wagara-yagasuri": {
    strokes: ["248,113,113", "220,38,38", "252,165,165", "153,27,27"],
    fills: ["69,10,10", "90,20,20", "40,6,6"],
    accent: ["254,202,202", "252,165,165"],
    hudPrimary: "rgba(248,113,113,",
    hudSecondary: "rgba(220,38,38,",
    opacityMul: 2.0,
  },
  "wagara-shippou": {
    strokes: ["192,132,252", "167,139,250", "216,180,254", "139,92,246"],
    fills: ["46,16,101", "35,15,75", "24,10,55"],
    accent: ["233,213,255", "221,214,254"],
    hudPrimary: "rgba(192,132,252,",
    hudSecondary: "rgba(167,139,250,",
    opacityMul: 2.0,
  },
  "wagara-sayagata": {
    strokes: ["203,213,225", "226,232,240", "148,163,184", "241,245,249"],
    fills: ["30,41,59", "51,65,85", "15,23,42"],
    accent: ["248,250,252", "226,232,240"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(148,163,184,",
    opacityMul: 1.9,
  },
  "wagara-ichimatsu": {
    strokes: ["45,212,191", "20,184,166", "94,234,212", "13,148,136"],
    fills: ["4,47,46", "6,60,56", "2,32,30"],
    accent: ["153,246,228", "204,251,241"],
    hudPrimary: "rgba(45,212,191,",
    hudSecondary: "rgba(20,184,166,",
    opacityMul: 1.95,
  },
  "wagara-karakusa": {
    strokes: ["163,230,53", "132,204,22", "190,242,100", "101,163,13"],
    fills: ["26,46,5", "35,60,8", "16,28,3"],
    accent: ["217,249,157", "236,252,203"],
    hudPrimary: "rgba(163,230,53,",
    hudSecondary: "rgba(132,204,22,",
    opacityMul: 1.95,
  },
  "wagara-raimon": {
    strokes: ["96,165,250", "59,130,246", "147,197,253", "37,99,235"],
    fills: ["23,37,84", "30,58,138", "12,20,50"],
    accent: ["191,219,254", "219,234,254"],
    hudPrimary: "rgba(96,165,250,",
    hudSecondary: "rgba(59,130,246,",
    opacityMul: 2.05,
  },
  "wagara-kumiko": {
    strokes: ["251,146,60", "249,115,22", "253,186,116", "194,65,12"],
    fills: ["67,20,7", "80,30,10", "40,12,4"],
    accent: ["254,215,170", "255,237,213"],
    hudPrimary: "rgba(251,146,60,",
    hudSecondary: "rgba(249,115,22,",
    opacityMul: 2.0,
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function wagaraOp(raw: number): number {
  return Math.min(
    1,
    Math.round(
      raw * PROFILE_PLAN_PRO_WAGARA_OPACITY_SCALE * activeOpacityMul * 1000
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

function place(nx: number, ny: number, densMul: number, seed: number): boolean {
  return hash01(seed, densMul) <= densityAt(nx, ny) * densMul;
}

/* ─── 模様ユニット ─── */

/** 1. 青海波 — 同心半円の扇タイル */
function buildSeigaiha(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 13; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const nx = 0.4 + col * 0.085 + (row % 2) * 0.0425;
      const ny = 0.05 + row * 0.074;
      if (nx > 1.04 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.9, row * 11 + col)) continue;
      const cx = Math.min(CANVAS_W - 4, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      for (let k = 0; k < 3; k += 1) {
        const r = 11 - k * 3.4;
        parts.push(
          `<path d="M${(cx - r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, row + k, col)},${wagaraOp(0.13 - k * 0.015).toFixed(3)})" stroke-width="${(0.85 - k * 0.12).toFixed(2)}"/>`
        );
      }
      if (hash01(row, col + 7) > 0.75) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${(cy - 3).toFixed(1)}" r="1" fill="rgba(${pick(p.accent, row, col)},${wagaraOp(0.16).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 2. 麻の葉 — 六角＋放射スポークの星形格子 */
function buildAsanoha(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 12; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const nx = 0.42 + col * 0.09 + (row % 2) * 0.045;
      const ny = 0.06 + row * 0.08;
      if (nx > 1.04 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.88, row * 9 + col + 1)) continue;
      const cx = Math.min(CANVAS_W - 5, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      const r = 9 + hash01(row, col) * 4;
      const pts: string[] = [];
      const spokes: string[] = [];
      for (let k = 0; k < 6; k += 1) {
        const a = (Math.PI / 3) * k - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        spokes.push(
          `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(${pick(p.strokes, row + k, col)},${wagaraOp(0.11).toFixed(3)})" stroke-width="0.5"/>`
        );
      }
      parts.push(
        `<polygon points="${pts.join(" ")}" fill="rgba(${pick(p.fills, row, col)},${wagaraOp(0.06).toFixed(3)})" stroke="rgba(${pick(p.strokes, col, row)},${wagaraOp(0.14).toFixed(3)})" stroke-width="0.65"/>`
      );
      parts.push(spokes.join(""));
      if (hash01(row, col + 4) > 0.7) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.2" fill="rgba(${pick(p.accent, row, col)},${wagaraOp(0.18).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 3. 亀甲 — 二重六角タイル */
function buildKikkou(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let row = 0; row < 13; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const nx = 0.42 + col * 0.09 + (row % 2) * 0.045;
      const ny = 0.05 + row * 0.075;
      if (nx > 1.04 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.86, row * 10 + col + 2)) continue;
      const cx = Math.min(CANVAS_W - 5, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      const R = 10;
      for (const [r, w, op] of [
        [R, 0.75, 0.14],
        [R * 0.62, 0.5, 0.1],
      ] as const) {
        const pts: string[] = [];
        for (let k = 0; k < 6; k += 1) {
          const a = (Math.PI / 3) * k + Math.PI / 6;
          pts.push(
            `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`
          );
        }
        parts.push(
          `<polygon points="${pts.join(" ")}" fill="none" stroke="rgba(${pick(p.strokes, row, col)},${wagaraOp(op).toFixed(3)})" stroke-width="${w}"/>`
        );
      }
      if (hash01(row, col + 6) > 0.62) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.3" fill="rgba(${pick(p.accent, row, col)},${wagaraOp(0.17).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 4. 矢絣 — 矢羽根シェブロンの縦列 */
function buildYagasuri(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let col = 0; col < 9; col += 1) {
    const nx = 0.42 + col * 0.072;
    if (nx > 1.02) continue;
    const cx = nx * CANVAS_W;
    const w = 7 + hash01(col, 1) * 3;
    for (let row = 0; row < 15; row += 1) {
      const ny = 0.04 + row * 0.066;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.92, col * 17 + row)) continue;
      const cy = ny * CANVAS_H;
      const h = 10 + hash01(col, row) * 5;
      const up = hash01(col, row + 3) > 0.5;
      const tipY = up ? cy - h * 0.5 : cy + h * 0.5;
      const baseY = up ? cy + h * 0.5 : cy - h * 0.5;
      parts.push(
        `<path d="M${(cx - w / 2).toFixed(1)} ${baseY.toFixed(1)} L${cx.toFixed(1)} ${tipY.toFixed(1)} L${(cx + w / 2).toFixed(1)} ${baseY.toFixed(1)}" fill="none" stroke="rgba(${pick(p.strokes, col, row)},${wagaraOp(0.14).toFixed(3)})" stroke-width="0.85" stroke-linejoin="miter"/>`
      );
      if (hash01(col, row + 9) > 0.6) {
        parts.push(
          `<line x1="${cx.toFixed(1)}" y1="${tipY.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="rgba(${pick(p.accent, col, row)},${wagaraOp(0.1).toFixed(3)})" stroke-width="0.45"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 5. 七宝 — 重なり円の繋ぎ文様 */
function buildShippou(p: WagaraPalette): string {
  const parts: string[] = [];
  const R = 12;
  for (let row = 0; row < 14; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const nx = 0.42 + col * 0.078 + (row % 2) * 0.039;
      const ny = 0.05 + row * 0.068;
      if (nx > 1.04 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.88, row * 12 + col + 3)) continue;
      const cx = Math.min(CANVAS_W - 4, nx * CANVAS_W);
      const cy = ny * CANVAS_H;
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${R}" fill="none" stroke="rgba(${pick(p.strokes, row, col)},${wagaraOp(0.12).toFixed(3)})" stroke-width="0.65"/>`
      );
      if (hash01(row, col + 5) > 0.55) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="none" stroke="rgba(${pick(p.accent, row, col)},${wagaraOp(0.14).toFixed(3)})" stroke-width="0.5"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 6. 紗綾形 — 卍崩しの鍵ストローク */
function buildSayagata(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 46; i += 1) {
    const nx = 0.4 + hash01(i * 1.8, 1.2) * 0.62;
    const ny = hash01(i * 2.0, 3.1);
    if (!place(nx, ny, 0.92, i + 4)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const s = 4 + hash01(i, 4) * 4;
    const rot = hash01(i, 5) > 0.5 ? 45 : -45;
    // 卍を崩した段状の鍵ストローク
    const d = [
      `M${(-s * 1.5).toFixed(1)} 0`,
      `h${s.toFixed(1)}`,
      `v${(-s).toFixed(1)}`,
      `h${s.toFixed(1)}`,
      `v${(-s).toFixed(1)}`,
      `h${s.toFixed(1)}`,
    ].join(" ");
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${wagaraOp(0.13 + hash01(i, 6) * 0.06).toFixed(3)})" stroke-width="0.75"/>` +
        `</g>`
    );
    if (hash01(i, 8) > 0.72) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1" fill="rgba(${pick(p.accent, i, 1)},${wagaraOp(0.15).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 7. 市松 — 交互に埋まる正方形タイル */
function buildIchimatsu(p: WagaraPalette): string {
  const parts: string[] = [];
  const S = 13;
  for (let row = 0; row < 16; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const nx = 0.42 + col * 0.062;
      const ny = 0.04 + row * 0.062;
      if (nx > 1.02 || ny > 1.02) continue;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.85, row * 13 + col + 5)) continue;
      const x = Math.min(CANVAS_W - S, nx * CANVAS_W);
      const y = ny * CANVAS_H;
      const filled = (row + col) % 2 === 0;
      if (filled) {
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${S}" height="${S}" fill="rgba(${pick(p.fills, row, col)},${wagaraOp(0.1).toFixed(3)})" stroke="rgba(${pick(p.strokes, row, col)},${wagaraOp(0.09).toFixed(3)})" stroke-width="0.4"/>`
        );
      } else {
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${S}" height="${S}" fill="none" stroke="rgba(${pick(p.strokes, col, row)},${wagaraOp(0.1).toFixed(3)})" stroke-width="0.5"/>`
        );
      }
      if (hash01(row, col + 8) > 0.85) {
        parts.push(
          `<circle cx="${(x + S / 2).toFixed(1)}" cy="${(y + S / 2).toFixed(1)}" r="1.1" fill="rgba(${pick(p.accent, row, col)},${wagaraOp(0.16).toFixed(3)})"/>`
        );
      }
    }
  }
  return wrapSvg(parts.join(""));
}

/** 8. 唐草 — 渦巻く蔓＋小さな葉 */
function buildKarakusa(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 26; i += 1) {
    const nx = 0.4 + hash01(i * 1.7, 1.3) * 0.62;
    const ny = hash01(i * 1.9, 3.3);
    if (!place(nx, ny, 0.88, i + 6)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const dir = hash01(i, 3) > 0.5 ? 1 : -1;
    const rot = ((hash01(i, 4) - 0.5) * 90).toFixed(1);
    // 内側に巻き込む渦（3 セグメントの近似スパイラル）
    const r0 = 9 + hash01(i, 5) * 7;
    const d = [
      `M${(r0 * dir).toFixed(1)} 0`,
      `Q${(r0 * dir).toFixed(1)} ${(-r0).toFixed(1)} 0 ${(-r0).toFixed(1)}`,
      `Q${(-r0 * 0.72 * dir).toFixed(1)} ${(-r0).toFixed(1)} ${(-r0 * 0.72 * dir).toFixed(1)} ${(-r0 * 0.3).toFixed(1)}`,
      `Q${(-r0 * 0.72 * dir).toFixed(1)} ${(r0 * 0.32).toFixed(1)} ${(-r0 * 0.16 * dir).toFixed(1)} ${(r0 * 0.32).toFixed(1)}`,
      `Q${(r0 * 0.3 * dir).toFixed(1)} ${(r0 * 0.32).toFixed(1)} ${(r0 * 0.3 * dir).toFixed(1)} ${(-r0 * 0.12).toFixed(1)}`,
    ].join(" ");
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${wagaraOp(0.14).toFixed(3)})" stroke-width="0.8" stroke-linecap="round"/>` +
        `<path d="M${(r0 * dir).toFixed(1)} 0 q${(3 * dir).toFixed(1)} -4 ${(6.5 * dir).toFixed(1)} -1.5 q${(-2.5 * dir).toFixed(1)} 3.5 ${(-6.5 * dir).toFixed(1)} 1.5" fill="rgba(${pick(p.fills, i, 1)},${wagaraOp(0.12).toFixed(3)})" stroke="rgba(${pick(p.accent, i, 1)},${wagaraOp(0.12).toFixed(3)})" stroke-width="0.45"/>` +
        `</g>`
    );
  }
  return wrapSvg(parts.join(""));
}

/** 9. 雷文 — 角渦メアンダー（回路風） */
function buildRaimon(p: WagaraPalette): string {
  const parts: string[] = [];
  for (let i = 0; i < 30; i += 1) {
    const nx = 0.4 + hash01(i * 1.9, 1.1) * 0.62;
    const ny = hash01(i * 1.7, 3.5);
    if (!place(nx, ny, 0.9, i + 7)) continue;
    const cx = nx * CANVAS_W;
    const cy = ny * CANVAS_H;
    const u = 3 + hash01(i, 4) * 2.2;
    const rot = (Math.floor(hash01(i, 5) * 4) * 90).toFixed(0);
    // 外から内へ巻く四角渦
    const d = [
      `M${(-u * 2).toFixed(1)} ${(u * 2).toFixed(1)}`,
      `h${(u * 4).toFixed(1)}`,
      `v${(-u * 4).toFixed(1)}`,
      `h${(-u * 3).toFixed(1)}`,
      `v${(u * 3).toFixed(1)}`,
      `h${(u * 2).toFixed(1)}`,
      `v${(-u * 2).toFixed(1)}`,
      `h${(-u).toFixed(1)}`,
      `v${u.toFixed(1)}`,
    ].join(" ");
    parts.push(
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
        `<path d="${d}" fill="none" stroke="rgba(${pick(p.strokes, i, 1)},${wagaraOp(0.14 + hash01(i, 6) * 0.05).toFixed(3)})" stroke-width="0.75"/>` +
        `</g>`
    );
    if (hash01(i, 9) > 0.68) {
      parts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.2" fill="rgba(${pick(p.accent, i, 1)},${wagaraOp(0.18).toFixed(3)})"/>`
      );
    }
  }
  return wrapSvg(parts.join(""));
}

/** 10. 組子 — 三角格子＋内部リブ */
function buildKumiko(p: WagaraPalette): string {
  const parts: string[] = [];
  const S = 15;
  const H = S * 0.866;
  for (let row = 0; row < 18; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      const x0 = CANVAS_W * 0.4 + col * (S / 2);
      const y0 = 14 + row * H;
      if (x0 > CANVAS_W - 4 || y0 > CANVAS_H - 4) continue;
      const nx = x0 / CANVAS_W;
      const ny = y0 / CANVAS_H;
      if (!place(Math.min(1, nx), Math.min(1, ny), 0.82, row * 14 + col + 8)) continue;
      const up = (row + col) % 2 === 0;
      const p1 = up
        ? `${x0.toFixed(1)},${(y0 + H).toFixed(1)} ${(x0 + S / 2).toFixed(1)},${y0.toFixed(1)} ${(x0 + S).toFixed(1)},${(y0 + H).toFixed(1)}`
        : `${x0.toFixed(1)},${y0.toFixed(1)} ${(x0 + S).toFixed(1)},${y0.toFixed(1)} ${(x0 + S / 2).toFixed(1)},${(y0 + H).toFixed(1)}`;
      parts.push(
        `<polygon points="${p1}" fill="none" stroke="rgba(${pick(p.strokes, row, col)},${wagaraOp(0.12).toFixed(3)})" stroke-width="0.6"/>`
      );
      // 組子の内部リブ（一部の三角のみ）
      if (hash01(row, col + 2) > 0.6) {
        const cx = x0 + S / 2;
        const cy = up ? y0 + H * 0.66 : y0 + H * 0.34;
        const vs = up
          ? [
              [x0, y0 + H],
              [x0 + S / 2, y0],
              [x0 + S, y0 + H],
            ]
          : [
              [x0, y0],
              [x0 + S, y0],
              [x0 + S / 2, y0 + H],
            ];
        for (const [vx, vy] of vs) {
          parts.push(
            `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${vx.toFixed(1)}" y2="${vy.toFixed(1)}" stroke="rgba(${pick(p.accent, row, col)},${wagaraOp(0.09).toFixed(3)})" stroke-width="0.4"/>`
          );
        }
      }
    }
  }
  return wrapSvg(parts.join(""));
}

function buildHudSvg(variant: ProfilePlanProWagaraBgVariant): string {
  const { hudPrimary, hudSecondary } = PALETTES[variant];
  const g: string[] = [];
  const op = (n: number) => wagaraOp(n);
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

function buildSkinSvg(variant: ProfilePlanProWagaraBgVariant): string {
  const p = PALETTES[variant];
  activeOpacityMul = p.opacityMul ?? 1;
  try {
    switch (variant) {
      case "wagara-seigaiha":
        return buildSeigaiha(p);
      case "wagara-asanoha":
        return buildAsanoha(p);
      case "wagara-kikkou":
        return buildKikkou(p);
      case "wagara-yagasuri":
        return buildYagasuri(p);
      case "wagara-shippou":
        return buildShippou(p);
      case "wagara-sayagata":
        return buildSayagata(p);
      case "wagara-ichimatsu":
        return buildIchimatsu(p);
      case "wagara-karakusa":
        return buildKarakusa(p);
      case "wagara-raimon":
        return buildRaimon(p);
      case "wagara-kumiko":
        return buildKumiko(p);
      default:
        return wrapSvg("");
    }
  } finally {
    activeOpacityMul = 1;
  }
}

export function getProfilePlanProWagaraSkinSvg(
  variant: ProfilePlanProWagaraBgVariant
): string {
  return cachedSvg(`wagara:skin:svg:${variant}:v1`, () => buildSkinSvg(variant));
}

export function getProfilePlanProWagaraHudSvg(
  variant: ProfilePlanProWagaraBgVariant
): string {
  return cachedSvg(`wagara:hud:svg:${variant}:v1`, () => buildHudSvg(variant));
}

export function getProfilePlanProWagaraSkinUrl(
  variant: ProfilePlanProWagaraBgVariant
): string {
  return cachedUrl(`wagara:skin:${variant}:v1`, () => buildSkinSvg(variant));
}

export function getProfilePlanProWagaraHudUrl(
  variant: ProfilePlanProWagaraBgVariant
): string {
  return cachedUrl(`wagara:hud:${variant}:v1`, () => buildHudSvg(variant));
}

export const PROFILE_PLAN_PRO_WAGARA_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
