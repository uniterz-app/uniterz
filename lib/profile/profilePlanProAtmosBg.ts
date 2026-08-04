/**
 * PRO 背景「Atmos」— 疎な六角 + 微細 HUD（accent 連動・キャッシュ付き）
 *
 * 図形色は枠 accent に合わせて tier ごとに固定生成し、切替時のみ URL を差し替える。
 */

import type { KinetikProfileAccentKey } from "@/app/component/profile/edit/kinetikRankBadge";
import {
  getAtmosShapePalette,
  type AtmosShapePalette,
} from "@/lib/profile/profilePlanProAtmosAccentPalettes";

// モバイル（縦長カード相当）
const CANVAS_W = 300;
const CANVAS_H = 430;

// Web（横長 2 カラム相当）
const CANVAS_W_WEB = 960;
const CANVAS_H_WEB = 380;

/** 図形全体の不透明度スケール（個数は変えず弱める） */
export const PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE = 1.28;
/** Web 横長 — 引き伸ばしで薄く見える分を補う */
export const PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE_WEB = 1.4;

function scaleShapeOpacity(raw: number, scale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE): number {
  return Math.min(1, Math.round(raw * scale * 1000) / 1000);
}

/** 六角 1 個分の stroke-opacity（決定論的） */
function hexStrokeOpacity(
  col: number,
  row: number,
  opacityScale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE
): number {
  let op = 0.07 + hash01(col * 0.6 + 7, row * 1.3 + 2) * 0.11;
  if (hash01(col + 5, row + 9) > 0.86) op += 0.18;
  return scaleShapeOpacity(op, opacityScale);
}

/** HUD 要素の opacity */
function hudOpacity(raw: number, opacityScale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE): number {
  return scaleShapeOpacity(raw, opacityScale);
}

/** 座標から決まる 0..1 の疑似乱数（決定論的＝毎回同じ） */
function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** ポインティトップ六角のパス */
function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

type DensityFn = (nx: number, ny: number) => number;

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

function densityWideAt(nx: number, ny: number): number {
  const dx = Math.min(nx, 1 - nx);
  const dy = Math.min(ny, 1 - ny);
  const ex = 1 - Math.min(1, dx / 0.3);
  const ey = 1 - Math.min(1, dy / 0.24);
  const perimeter = Math.max(ex * 0.95, ey * 1.0);
  const top = (1 - ny) * 0.25;
  const base = 0.12;
  return Math.min(1.4, perimeter + top + base);
}

/** 疎な六角の SVG 文字列 */
function buildSparseHexSvg(
  w: number,
  h: number,
  density: DensityFn,
  hexStrokes: readonly string[],
  opacityScale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE
): string {
  const r = 13;
  const colStep = Math.sqrt(3) * r;
  const rowStep = 1.5 * r;
  const cols = Math.ceil(w / colStep) + 2;
  const rows = Math.ceil(h / rowStep) + 2;
  const paths: string[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      if (cx < -r || cy < -r || cx > w + r || cy > h + r) continue;

      const nx = cx / w;
      const ny = cy / h;
      const dens = density(nx, ny);
      if (hash01(col + 1, row + 2) > dens * 0.72) continue;

      const rr = r * (0.7 + hash01(col * 1.7 + 3, row * 0.9 + 5) * 0.7);
      const op = hexStrokeOpacity(col, row, opacityScale);
      const sw = (0.6 + hash01(col + 2, row + 4) * 0.8).toFixed(2);
      const color =
        hexStrokes[Math.floor(hash01(col * 2.1, row * 1.4) * hexStrokes.length)] ??
        hexStrokes[0];

      paths.push(
        `<path d="${hexPath(cx, cy, rr)}" fill="none" stroke="rgba(${color},${op.toFixed(3)})" stroke-width="${sw}"/>`
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${paths.join("")}</svg>`;
}

/* —————————————————————————————— 微細 HUD —————————————————————————————— */

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
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.7" fill="${fillPrefix}${op})"/>`);
    }
  }
  return dots.join("");
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

function plusMark(cx: number, cy: number, s: number, op: number, strokePrefix: string): string {
  return (
    `<line x1="${(cx - s).toFixed(1)}" y1="${cy}" x2="${(cx + s).toFixed(1)}" y2="${cy}" stroke="${strokePrefix}${op})" stroke-width="0.8"/>` +
    `<line x1="${cx}" y1="${(cy - s).toFixed(1)}" x2="${cx}" y2="${(cy + s).toFixed(1)}" stroke="${strokePrefix}${op})" stroke-width="0.8"/>`
  );
}

function buildHudSvg(palette: AtmosShapePalette, opacityScale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE): string {
  const g: string[] = [];
  const { hudPrimary, hudSecondary } = palette;

  g.push(dotGrid(210, 20, 70, 34, 8, hudOpacity(0.12, opacityScale), hudPrimary));
  g.push(tickRow(196, 66, 12, 7.5, 3, hudOpacity(0.22, opacityScale), hudSecondary));
  g.push(plusMark(276, 40, 3, hudOpacity(0.3, opacityScale), hudPrimary));
  g.push(plusMark(288, 190, 2.6, hudOpacity(0.26, opacityScale), hudPrimary));
  g.push(tickRow(286, 150, 8, 6, 2.4, hudOpacity(0.18, opacityScale), hudSecondary));
  g.push(dotGrid(24, 372, 60, 40, 9, hudOpacity(0.1, opacityScale), hudPrimary));
  g.push(tickRow(150, 420, 16, 6, 2.2, hudOpacity(0.16, opacityScale), hudSecondary));
  g.push(plusMark(280, 400, 3, hudOpacity(0.24, opacityScale), hudPrimary));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" preserveAspectRatio="none">${g.join("")}</svg>`;
}

function buildHudSvgWeb(
  palette: AtmosShapePalette,
  opacityScale = PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE_WEB
): string {
  const W = CANVAS_W_WEB;
  const H = CANVAS_H_WEB;
  const g: string[] = [];
  const { hudPrimary, hudSecondary } = palette;

  g.push(dotGrid(24, 22, 74, 30, 9, hudOpacity(0.1, opacityScale), hudPrimary));
  g.push(plusMark(20, 20, 3, hudOpacity(0.28, opacityScale), hudPrimary));
  g.push(dotGrid(W - 110, 22, 80, 30, 9, hudOpacity(0.1, opacityScale), hudPrimary));
  g.push(tickRow(W - 150, 20, 14, 8, 3, hudOpacity(0.2, opacityScale), hudSecondary));
  g.push(plusMark(W - 22, 22, 3, hudOpacity(0.3, opacityScale), hudPrimary));
  g.push(tickRow(W - 150, H - 24, 14, 8, 2.6, hudOpacity(0.16, opacityScale), hudSecondary));
  g.push(plusMark(W - 22, H - 22, 3, hudOpacity(0.26, opacityScale), hudPrimary));
  g.push(dotGrid(24, H - 46, 66, 30, 9, hudOpacity(0.09, opacityScale), hudPrimary));
  g.push(plusMark(20, H - 22, 3, hudOpacity(0.24, opacityScale), hudPrimary));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${g.join("")}</svg>`;
}

/* —————————————————————————————— data URL + キャッシュ —————————————————————————————— */

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

/** Native SvgXml 用 — 疎な六角（モバイル縦長） */
export function getProfilePlanProAtmosHexSvg(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return buildSparseHexSvg(CANVAS_W, CANVAS_H, densityAt, palette.hexStrokes);
}

/** Native SvgXml 用 — 微細 HUD（モバイル縦長） */
export function getProfilePlanProAtmosHudSvg(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return buildHudSvg(palette);
}

/** 疎な六角レイヤー（モバイル縦長） */
export function getProfilePlanProAtmosHexUrl(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return cachedUrl(`${accent}:hex:mobile:v4`, () =>
    buildSparseHexSvg(CANVAS_W, CANVAS_H, densityAt, palette.hexStrokes)
  );
}

/** 微細 HUD レイヤー（モバイル縦長） */
export function getProfilePlanProAtmosHudUrl(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return cachedUrl(`${accent}:hud:mobile:v4`, () => buildHudSvg(palette));
}

/** 疎な六角レイヤー（Web 横長） */
export function getProfilePlanProAtmosHexUrlWeb(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return cachedUrl(`${accent}:hex:web:v4`, () =>
    buildSparseHexSvg(
      CANVAS_W_WEB,
      CANVAS_H_WEB,
      densityWideAt,
      palette.hexStrokes,
      PROFILE_PLAN_PRO_ATMOS_OPACITY_SCALE_WEB
    )
  );
}

/** 微細 HUD レイヤー（Web 横長） */
export function getProfilePlanProAtmosHudUrlWeb(
  accent: KinetikProfileAccentKey = "default"
): string {
  const palette = getAtmosShapePalette(accent);
  return cachedUrl(`${accent}:hud:web:v4`, () => buildHudSvgWeb(palette));
}

/** 六角セル配列（Native の SVG 描画用） */
export type AtmosHexCell = {
  d: string;
  stroke: string;
  strokeWidth: number;
};

const cellsCache = new Map<string, AtmosHexCell[]>();

export function getProfilePlanProAtmosHexCells(
  accent: KinetikProfileAccentKey = "default"
): AtmosHexCell[] {
  const hit = cellsCache.get(accent);
  if (hit !== undefined) return hit;

  const palette = getAtmosShapePalette(accent);
  const r = 13;
  const colStep = Math.sqrt(3) * r;
  const rowStep = 1.5 * r;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;
  const cells: AtmosHexCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      if (cx < -r || cy < -r || cx > CANVAS_W + r || cy > CANVAS_H + r) continue;

      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny);
      if (hash01(col + 1, row + 2) > dens * 0.72) continue;

      const rr = r * (0.7 + hash01(col * 1.7 + 3, row * 0.9 + 5) * 0.7);
      const op = hexStrokeOpacity(col, row);
      const sw = Number((0.6 + hash01(col + 2, row + 4) * 0.8).toFixed(2));
      const color =
        palette.hexStrokes[Math.floor(hash01(col * 2.1, row * 1.4) * palette.hexStrokes.length)] ??
        palette.hexStrokes[0];

      cells.push({
        d: hexPath(cx, cy, rr),
        stroke: `rgba(${color},${op.toFixed(3)})`,
        strokeWidth: sw,
      });
    }
  }

  cellsCache.set(accent, cells);
  return cells;
}

export const PROFILE_PLAN_PRO_ATMOS_CANVAS = { width: CANVAS_W, height: CANVAS_H } as const;
