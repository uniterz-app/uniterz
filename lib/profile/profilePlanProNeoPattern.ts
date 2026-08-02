/**
 * PRO 背景 — NEO LAB 10 案の SVG 生成（v3: 柄重視）
 * 色の霧ではなく、はっきり読めるグラフィック柄を主役にする。
 * 線・格子・波・亀裂・流線など「模様」として判別できる構造。
 */

import type { ProfilePlanProNeoBgVariant } from "./profilePlanProNeoBgVariants";

const W = 300;
const H = 430;

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function wrapSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
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

/** 文字ゾーンだけ薄い暗幕。柄は縁・下・右に残す */
function centerDim(op = 0.28): string {
  return (
    `<defs><radialGradient id="ndim" cx="0.4" cy="0.36" r="0.52">` +
    `<stop offset="0" stop-color="#000" stop-opacity="${op}"/>` +
    `<stop offset="0.6" stop-color="#000" stop-opacity="${(op * 0.3).toFixed(2)}"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<ellipse cx="112" cy="152" rx="108" ry="118" fill="url(#ndim)"/>`
  );
}

function base(color: string): string {
  return `<rect width="${W}" height="${H}" fill="${color}"/>`;
}

/* ─── 1. Liquid Chrome — 等高線状の金属波紋柄 ─── */
function buildChrome(): string {
  const parts: string[] = [base("#0c121c")];
  // 等高線メッシュ（歪んだ楕円の入れ子）
  for (let i = 0; i < 22; i += 1) {
    const cx = 210 + Math.sin(i * 0.7) * 18;
    const cy = 200 + Math.cos(i * 0.55) * 22;
    const rx = 28 + i * 11;
    const ry = 18 + i * 8.5;
    const rot = ((i * 7) % 40) - 20;
    parts.push(
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#c8d6e8" stroke-width="${(1.4 - i * 0.03).toFixed(2)}" stroke-opacity="${(0.55 - i * 0.015).toFixed(2)}" transform="rotate(${rot} ${cx} ${cy})"/>`
    );
  }
  // ハイライト稜線
  for (let i = 0; i < 8; i += 1) {
    const y = 40 + i * 50;
    parts.push(
      `<path d="M20 ${y} Q150 ${y - 18 + i * 2} 280 ${y + 8}" fill="none" stroke="#eef4ff" stroke-width="1.2" stroke-opacity="0.35"/>`
    );
  }
  parts.push(centerDim(0.3));
  return wrapSvg(parts.join(""));
}

/* ─── 2. Oil Iridis — 指紋／渦巻きの干渉柄 ─── */
function buildIridis(): string {
  const parts: string[] = [base("#0e0a16")];
  const centers: [number, number, string][] = [
    [230, 90, "#e879f9"],
    [200, 230, "#22d3ee"],
    [250, 350, "#a3e635"],
    [70, 380, "#a78bfa"],
    [80, 80, "#fbbf24"],
  ];
  for (const [cx, cy, col] of centers) {
    for (let r = 6; r < 90; r += 5) {
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="1.15" stroke-opacity="${(0.55 - r / 220).toFixed(2)}"/>`
      );
    }
  }
  // 交差を強調する短弧
  for (let i = 0; i < 16; i += 1) {
    const a = hash01(i, 1) * Math.PI * 2;
    const x = 150 + Math.cos(a) * 90;
    const y = 215 + Math.sin(a) * 120;
    parts.push(
      `<path d="M${x.toFixed(1)} ${y.toFixed(1)} a12 8 0 0 1 18 4" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.28"/>`
    );
  }
  parts.push(centerDim(0.28));
  return wrapSvg(parts.join(""));
}

/* ─── 3. Caustics — 網目状の水中光柄（明確なセル） ─── */
function buildCaustics(): string {
  const parts: string[] = [base("#034550")];
  // 歪みセル網（菱形＋曲線）
  for (let row = 0; row < 14; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const x = 8 + col * 36 + (row % 2) * 18;
      const y = 10 + row * 32;
      const jx = (hash01(row, col) - 0.5) * 10;
      const jy = (hash01(col, row) - 0.5) * 8;
      const cx = x + jx;
      const cy = y + jy;
      // セル輪郭
      const s = 14 + hash01(row + 1, col) * 6;
      parts.push(
        `<path d="M${cx.toFixed(1)} ${(cy - s).toFixed(1)} Q${(cx + s).toFixed(1)} ${cy.toFixed(1)} ${cx.toFixed(1)} ${(cy + s).toFixed(1)} Q${(cx - s).toFixed(1)} ${cy.toFixed(1)} ${cx.toFixed(1)} ${(cy - s).toFixed(1)}" fill="none" stroke="#b8f8ff" stroke-width="1.35" stroke-opacity="0.72"/>`
      );
      if (hash01(row, col + 3) > 0.55) {
        parts.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="#eaffff" opacity="0.7"/>`
        );
      }
    }
  }
  // 明るい筋
  for (let i = 0; i < 7; i += 1) {
    const x = 40 + i * 38;
    parts.push(
      `<path d="M${x} 0 Q${x + 20} 200 ${x - 10} 430" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.22"/>`
    );
  }
  parts.push(centerDim(0.26));
  return wrapSvg(parts.join(""));
}

/* ─── 4. Plasma Storm — 稲妻＋雲の輪郭線柄 ─── */
function buildPlasma(): string {
  const parts: string[] = [base("#1a0a30")];
  // 雲の輪郭（閉じた歪みポリゴン）
  for (let c = 0; c < 6; c += 1) {
    const cx = 40 + hash01(c, 1) * 220;
    const cy = 40 + hash01(c, 2) * 360;
    const n = 10;
    const r0 = 36 + hash01(c, 3) * 40;
    let d = "";
    for (let k = 0; k <= n; k += 1) {
      const a = (Math.PI * 2 * k) / n;
      const rr = r0 * (0.7 + hash01(c * 10 + k, 1) * 0.55);
      d += `${k === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
    }
    parts.push(
      `<path d="${d}Z" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-opacity="0.55"/>` +
        `<path d="${d}Z" fill="rgba(139,92,246,0.08)" stroke="#f5d0fe" stroke-width="0.7" stroke-opacity="0.4" transform="translate(3 2)"/>`
    );
  }
  // 稲妻（太くはっきり）
  for (let b = 0; b < 4; b += 1) {
    let x = 40 + b * 70;
    let y = hash01(b, 5) * 80;
    let d = `M${x} ${y}`;
    for (let s = 0; s < 10; s += 1) {
      x += (hash01(b, s) - 0.45) * 28;
      y += 28 + hash01(b, s + 2) * 20;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="#fce7ff" stroke-width="3.2" stroke-opacity="0.55" stroke-linejoin="miter"/>` +
        `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.95"/>`
    );
  }
  parts.push(centerDim(0.28));
  return wrapSvg(parts.join(""));
}

/* ─── 5. Signal Break — 走査線＋断裂ブロック柄 ─── */
function buildGlitch(): string {
  const parts: string[] = [base("#101018")];
  // 密な走査線
  for (let y = 0; y < H; y += 4) {
    parts.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff" stroke-width="1" stroke-opacity="${y % 8 === 0 ? 0.14 : 0.06}"/>`
    );
  }
  // 断裂バー（柄として明確）
  const bars: [number, number, number, string][] = [
    [0, 72, 18, "#22d3ee"],
    [40, 118, 14, "#f43f5e"],
    [-20, 168, 22, "#ffffff"],
    [60, 210, 10, "#22d3ee"],
    [-10, 248, 16, "#f43f5e"],
    [30, 300, 12, "#a3e635"],
    [-30, 348, 20, "#22d3ee"],
    [50, 390, 14, "#f43f5e"],
  ];
  for (const [x, y, h, c] of bars) {
    parts.push(
      `<rect x="${x}" y="${y}" width="${W + 40}" height="${h}" fill="${c}" opacity="0.28"/>` +
        `<rect x="${x + 8}" y="${y + 2}" width="${W + 40}" height="${Math.max(2, h - 6)}" fill="${c === "#ffffff" ? "#22d3ee" : "#ffffff"}" opacity="0.18"/>`
    );
  }
  // ドット行列（データ柄）
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 14; c += 1) {
      if (hash01(r, c) < 0.35) continue;
      parts.push(
        `<rect x="${(180 + c * 7.5).toFixed(1)}" y="${(40 + r * 9).toFixed(1)}" width="4.5" height="4.5" fill="${hash01(c, r) > 0.7 ? "#22d3ee" : "#ffffff"}" opacity="${(0.45 + hash01(r, c) * 0.4).toFixed(2)}"/>`
      );
    }
  }
  // RGB ずれの縁取り線
  parts.push(
    `<line x1="0" y1="236" x2="${W}" y2="236" stroke="#f43f5e" stroke-width="2" opacity="0.7"/>` +
      `<line x1="0" y1="239" x2="${W}" y2="239" stroke="#22d3ee" stroke-width="2" opacity="0.7"/>` +
      `<line x1="0" y1="242" x2="${W}" y2="242" stroke="#ffffff" stroke-width="1.2" opacity="0.85"/>`
  );
  parts.push(centerDim(0.22));
  return wrapSvg(parts.join(""));
}

/* ─── 6. Flux Field — 密な流線柄 ─── */
function fieldAngle(x: number, y: number): number {
  return (
    Math.sin(x * 0.014 + 1.7) * 1.5 +
    Math.cos(y * 0.011 - 0.6) * 1.3 +
    Math.sin((x + y) * 0.007) * 0.7
  );
}

function buildFlux(): string {
  const parts: string[] = [base("#071428")];
  const cols = ["#22d3ee", "#818cf8", "#c084fc", "#60a5fa"];
  for (let i = 0; i < 64; i += 1) {
    let x = hash01(i, 1) * 340 - 20;
    let y = hash01(i, 2) * 460 - 20;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let s = 0; s < 28; s += 1) {
      const a = fieldAngle(x, y);
      x += Math.cos(a) * 6.5;
      y += Math.sin(a) * 6.5;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const c = cols[i % cols.length]!;
    parts.push(
      `<path d="${d}" fill="none" stroke="${c}" stroke-width="${(1.1 + hash01(i, 4) * 0.9).toFixed(2)}" stroke-opacity="${(0.45 + hash01(i, 5) * 0.35).toFixed(2)}" stroke-linecap="round"/>`
    );
  }
  parts.push(centerDim(0.26));
  return wrapSvg(parts.join(""));
}

/* ─── 7. Impact Glass — 放射クラック柄 ─── */
function buildShatter(): string {
  const ix = 228;
  const iy = 150;
  const parts: string[] = [
    base("#0c1830"),
    `<circle cx="${ix}" cy="${iy}" r="8" fill="#ffffff" opacity="0.9"/>`,
    `<circle cx="${ix}" cy="${iy}" r="18" fill="none" stroke="#e0f2fe" stroke-width="1.6" stroke-opacity="0.7"/>`,
  ];
  for (let i = 0; i < 16; i += 1) {
    const a0 = (Math.PI * 2 * i) / 16 + hash01(i, 1) * 0.2;
    let x = ix;
    let y = iy;
    let a = a0;
    let d = `M${x} ${y}`;
    const segs = 5 + Math.floor(hash01(i, 2) * 3);
    for (let s = 0; s < segs; s += 1) {
      const len = 22 + hash01(i, s + 3) * 42;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      a += (hash01(i, s + 9) - 0.5) * 0.45;
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="#e0f2fe" stroke-width="1.8" stroke-opacity="0.8" stroke-linecap="round"/>`
    );
    // 枝
    const bx = ix + Math.cos(a0) * 55;
    const by = iy + Math.sin(a0) * 55;
    const ba = a0 + (i % 2 === 0 ? 0.75 : -0.75);
    parts.push(
      `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(ba) * 40).toFixed(1)}" y2="${(by + Math.sin(ba) * 40).toFixed(1)}" stroke="#7dd3fc" stroke-width="1.2" stroke-opacity="0.65"/>`
    );
  }
  // 破断リング
  for (const r of [40, 85, 140, 200]) {
    let d = "";
    for (let k = 0; k <= 16; k += 1) {
      const a = (Math.PI * 2 * k) / 16;
      const rr = r * (0.88 + hash01(r, k) * 0.24);
      d += `${k === 0 ? "M" : "L"}${(ix + Math.cos(a) * rr).toFixed(1)} ${(iy + Math.sin(a) * rr).toFixed(1)} `;
    }
    parts.push(
      `<path d="${d}Z" fill="none" stroke="#bae6fd" stroke-width="1.2" stroke-opacity="0.5"/>`
    );
  }
  parts.push(centerDim(0.24));
  return wrapSvg(parts.join(""));
}

/* ─── 8. Velocity Trails — 平行カーブの光跡柄 ─── */
function buildVelocity(): string {
  const parts: string[] = [base("#140a1e")];
  const palette = ["#22d3ee", "#ec4899", "#f59e0b", "#a78bfa", "#ffffff"];
  for (let i = 0; i < 18; i += 1) {
    const y0 = 10 + i * 24;
    const amp = 30 + (i % 5) * 12;
    const d = `M-20 ${y0} C 80 ${y0 - amp}, 200 ${y0 + amp}, 320 ${y0 - amp * 0.4}`;
    const c = palette[i % palette.length]!;
    parts.push(
      `<path d="${d}" fill="none" stroke="${c}" stroke-width="${(2.2 + (i % 3) * 0.8).toFixed(1)}" stroke-opacity="0.7" stroke-linecap="round"/>`
    );
  }
  // クロス方向の短いストリーク
  for (let i = 0; i < 20; i += 1) {
    const x = hash01(i, 1) * W;
    const y = hash01(i, 2) * H;
    const len = 20 + hash01(i, 3) * 40;
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${(y - len * 0.25).toFixed(1)}" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.35"/>`
    );
  }
  parts.push(centerDim(0.26));
  return wrapSvg(parts.join(""));
}

/* ─── 9. Ferrofluid — 棘シルエットの連続柄 ─── */
function ferroBlob(
  cx: number,
  cy: number,
  r: number,
  spikes: number,
  seed: number
): string {
  let d = "";
  const n = spikes * 2;
  for (let k = 0; k <= n; k += 1) {
    const a = (Math.PI * 2 * k) / n - Math.PI / 2;
    const spike = k % 2 === 0;
    const rr = spike
      ? r * (1.6 + hash01(seed, k) * 0.9)
      : r * (0.55 + hash01(seed, k + 50) * 0.2);
    d += `${k === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return `${d}Z`;
}

function buildFerro(): string {
  const parts: string[] = [base("#0a1018")];
  // 格子ガイド（柄の下地）
  for (let x = 20; x < W; x += 28) {
    parts.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#1e293b" stroke-width="1" opacity="0.5"/>`
    );
  }
  for (let y = 20; y < H; y += 28) {
    parts.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#1e293b" stroke-width="1" opacity="0.5"/>`
    );
  }
  const blobs: [number, number, number, number][] = [
    [240, 320, 36, 10],
    [160, 390, 28, 8],
    [270, 200, 30, 9],
    [210, 70, 24, 8],
    [70, 340, 22, 7],
    [90, 120, 20, 7],
    [50, 220, 16, 6],
    [280, 380, 18, 7],
  ];
  blobs.forEach(([cx, cy, r, sp], i) => {
    const d = ferroBlob(cx, cy, r, sp, i * 7 + 3);
    parts.push(
      `<path d="${d}" fill="#05070c" stroke="#22d3ee" stroke-width="1.8" stroke-opacity="0.9"/>` +
        `<path d="${d}" fill="none" stroke="#a78bfa" stroke-width="0.8" stroke-opacity="0.5" transform="translate(2 1)"/>`
    );
  });
  parts.push(centerDim(0.22));
  return wrapSvg(parts.join(""));
}

/* ─── 10. Moiré Bloom — 二重同心円の干渉柄（太線） ─── */
function buildMoire(): string {
  const parts: string[] = [base("#0c1424")];
  const ring = (cx: number, cy: number, step: number, color: string) => {
    for (let r = 5; r < 340; r += step) {
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.35" stroke-opacity="0.5"/>`
      );
    }
  };
  ring(140, 210, 7, "#22d3ee");
  ring(175, 190, 7.5, "#e879f9");
  ring(120, 250, 8, "#ffffff");
  parts.push(centerDim(0.26));
  return wrapSvg(parts.join(""));
}

function buildSkinSvg(variant: ProfilePlanProNeoBgVariant): string {
  switch (variant) {
    case "neo-chrome":
      return buildChrome();
    case "neo-iridis":
      return buildIridis();
    case "neo-caustics":
      return buildCaustics();
    case "neo-plasma":
      return buildPlasma();
    case "neo-glitch":
      return buildGlitch();
    case "neo-flux":
      return buildFlux();
    case "neo-shatter":
      return buildShatter();
    case "neo-velocity":
      return buildVelocity();
    case "neo-ferro":
      return buildFerro();
    case "neo-moire":
      return buildMoire();
    default:
      return wrapSvg("");
  }
}

export function getProfilePlanProNeoSkinSvg(
  variant: ProfilePlanProNeoBgVariant
): string {
  return cachedSvg(`neo:skin:svg:${variant}:v3`, () => buildSkinSvg(variant));
}

export function getProfilePlanProNeoSkinUrl(
  variant: ProfilePlanProNeoBgVariant
): string {
  return cachedUrl(`neo:skin:${variant}:v3`, () => buildSkinSvg(variant));
}

export const PROFILE_PLAN_PRO_NEO_CANVAS = {
  width: W,
  height: H,
} as const;
