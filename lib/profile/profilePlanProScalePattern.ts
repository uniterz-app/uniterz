/**
 * PRO 背景 — 爬虫類スキン × サイバー
 * atmos と同じ配置思想: 疎な図形・中央空け・端に寄せ・微細 HUD
 */

import type { ProfilePlanProScaleBgVariant } from "./profilePlanProScaleBgVariants";

const CANVAS_W = 300;
const CANVAS_H = 430;

export const PROFILE_PLAN_PRO_SCALE_OPACITY_SCALE = 0.95;

type ScalePalette = {
  strokes: readonly string[];
  fills: readonly string[];
  hudPrimary: string;
  hudSecondary: string;
  ridge?: string;
  /** 皮としての密さ（1 = 標準） */
  densityMul?: number;
  /** 塗りを濃くして爬虫類感を出す */
  fillBoost?: number;
  /** ストロークを少し強く */
  strokeBoost?: number;
  /** 採用候補など — 全体の追加ブースト */
  opacityMul?: number;
};

const PALETTES: Record<ProfilePlanProScaleBgVariant, ScalePalette> = {
  "scale-mamba": {
    // ブラックマンバ — 実際は銃鉄色〜オリーブグレーの平滑鱗
    strokes: ["100,116,139", "148,163,184", "203,213,225", "82,94,72"],
    fills: ["30,41,59", "51,65,85", "24,32,28"],
    hudPrimary: "rgba(203,213,225,",
    hudSecondary: "rgba(56,189,248,",
    densityMul: 1.2,
    fillBoost: 2.2,
    strokeBoost: 1.65,
    opacityMul: 1.45,
  },
  "scale-king": {
    // キングコブラ — 黒＋琥珀バンド
    strokes: ["245,158,11", "251,191,36", "217,119,6", "41,37,36"],
    fills: ["69,26,3", "120,53,15", "28,25,23"],
    hudPrimary: "rgba(251,191,36,",
    hudSecondary: "rgba(245,158,11,",
    densityMul: 1.12,
    fillBoost: 1.65,
    strokeBoost: 1.28,
    opacityMul: 1.08,
  },
  "scale-diamondback": {
    strokes: ["214,211,209", "168,162,158", "120,113,108", "231,229,228"],
    fills: ["68,64,60", "41,37,36", "28,25,23"],
    hudPrimary: "rgba(231,229,228,",
    hudSecondary: "rgba(214,211,209,",
    ridge: "245,245,244",
    densityMul: 1.18,
    fillBoost: 1.7,
    strokeBoost: 1.25,
    opacityMul: 1.08,
  },
  "scale-anaconda": {
    strokes: ["77,124,15", "101,163,13", "54,83,20", "163,230,53"],
    fills: ["26,46,5", "20,83,45", "15,32,8"],
    hudPrimary: "rgba(163,230,53,",
    hudSecondary: "rgba(101,163,13,",
    densityMul: 1.25,
    fillBoost: 1.7,
    strokeBoost: 1.1,
  },
  "scale-bushmaster": {
    strokes: ["194,65,12", "234,88,12", "154,52,18", "251,146,60"],
    fills: ["69,26,3", "124,45,18", "40,16,8"],
    hudPrimary: "rgba(251,146,60,",
    hudSecondary: "rgba(194,65,12,",
    ridge: "253,186,116",
    densityMul: 1.08,
    fillBoost: 1.55,
    strokeBoost: 1.2,
  },
  "scale-gaboon": {
    strokes: ["161,98,7", "202,138,4", "113,63,18", "253,224,71"],
    fills: ["66,32,6", "120,53,15", "41,37,36"],
    hudPrimary: "rgba(253,224,71,",
    hudSecondary: "rgba(161,98,7,",
    ridge: "254,240,138",
    densityMul: 1.12,
    fillBoost: 1.65,
    strokeBoost: 1.2,
  },
  "scale-python": {
    strokes: ["34,211,238", "103,232,249", "6,182,212", "165,243,252"],
    fills: ["14,116,144", "8,47,73", "22,78,99"],
    hudPrimary: "rgba(103,232,249,",
    hudSecondary: "rgba(34,211,238,",
    densityMul: 1.15,
    fillBoost: 1.7,
    strokeBoost: 1.35,
    opacityMul: 1.12,
  },
  "scale-gecko": {
    strokes: ["52,211,153", "16,185,129", "110,231,183"],
    fills: ["6,78,59", "4,47,46"],
    hudPrimary: "rgba(52,211,153,",
    hudSecondary: "rgba(110,231,183,",
  },
  "scale-cobra": {
    strokes: ["167,139,250", "192,132,252", "34,211,238"],
    fills: ["46,16,101", "76,29,149"],
    hudPrimary: "rgba(167,139,250,",
    hudSecondary: "rgba(192,132,252,",
  },
  "scale-dragon": {
    strokes: ["245,158,11", "251,191,36", "217,119,6", "180,83,9"],
    fills: ["67,20,7", "120,53,15", "41,12,4"],
    hudPrimary: "rgba(251,191,36,",
    hudSecondary: "rgba(245,158,11,",
    ridge: "251,191,36",
    densityMul: 1.18,
    fillBoost: 2.25,
    strokeBoost: 1.75,
    opacityMul: 1.45,
  },
  "scale-viper": {
    strokes: ["132,204,22", "163,230,53", "74,222,128"],
    fills: ["20,83,45", "26,46,5"],
    hudPrimary: "rgba(163,230,53,",
    hudSecondary: "rgba(132,204,22,",
    ridge: "190,242,100",
  },
  "scale-shed": {
    strokes: ["34,211,238", "56,189,248", "167,139,250"],
    fills: ["8,47,73", "30,27,75"],
    hudPrimary: "rgba(34,211,238,",
    hudSecondary: "rgba(167,139,250,",
  },
  "scale-chrome": {
    strokes: ["148,163,184", "203,213,225", "56,189,248"],
    fills: ["51,65,85", "30,41,59"],
    hudPrimary: "rgba(148,163,184,",
    hudSecondary: "rgba(56,189,248,",
    ridge: "226,232,240",
  },
  "scale-biolume": {
    strokes: ["6,182,212", "167,139,250", "236,72,153"],
    fills: ["8,47,73", "49,46,129"],
    hudPrimary: "rgba(6,182,212,",
    hudSecondary: "rgba(167,139,250,",
  },
};

function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let activeOpacityMul = 1;

function scaleOp(raw: number): number {
  return Math.min(
    1,
    Math.round(raw * PROFILE_PLAN_PRO_SCALE_OPACITY_SCALE * activeOpacityMul * 1000) /
      1000
  );
}

/** atmos と同系 — 右・下・隅に寄せ、中央は空ける */
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

/** 有機的な腹側鱗（U字・重なり）— 最も爬虫類らしい基本形 */
function organicScalePath(cx: number, cy: number, w: number, h: number): string {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h * 0.55;
  const bottom = cy + h * 0.62;
  return [
    `M${left.toFixed(1)} ${cy.toFixed(1)}`,
    `Q${cx.toFixed(1)} ${top.toFixed(1)} ${right.toFixed(1)} ${cy.toFixed(1)}`,
    `Q${cx.toFixed(1)} ${bottom.toFixed(1)} ${left.toFixed(1)} ${cy.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/** 菱形寄り蛇鱗（角を少し丸めたダイヤモンド） */
function diamondScalePath(cx: number, cy: number, rx: number, ry: number): string {
  const top = cy - ry;
  const bot = cy + ry;
  const left = cx - rx;
  const right = cx + rx;
  const soft = Math.min(rx, ry) * 0.18;
  return [
    `M${cx.toFixed(1)} ${top.toFixed(1)}`,
    `Q${(cx + soft).toFixed(1)} ${(top + soft * 0.4).toFixed(1)} ${right.toFixed(1)} ${cy.toFixed(1)}`,
    `Q${(cx + soft).toFixed(1)} ${(bot - soft * 0.4).toFixed(1)} ${cx.toFixed(1)} ${bot.toFixed(1)}`,
    `Q${(cx - soft).toFixed(1)} ${(bot - soft * 0.4).toFixed(1)} ${left.toFixed(1)} ${cy.toFixed(1)}`,
    `Q${(cx - soft).toFixed(1)} ${(top + soft * 0.4).toFixed(1)} ${cx.toFixed(1)} ${top.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/** 竜鱗 — 先の尖った盾形 */
function armorScalePath(cx: number, cy: number, w: number, h: number): string {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const tip = cy + h * 0.72;
  const top = cy - h * 0.45;
  return [
    `M${left.toFixed(1)} ${(cy - h * 0.1).toFixed(1)}`,
    `Q${cx.toFixed(1)} ${top.toFixed(1)} ${right.toFixed(1)} ${(cy - h * 0.1).toFixed(1)}`,
    `L${(cx + w * 0.12).toFixed(1)} ${(cy + h * 0.35).toFixed(1)}`,
    `L${cx.toFixed(1)} ${tip.toFixed(1)}`,
    `L${(cx - w * 0.12).toFixed(1)} ${(cy + h * 0.35).toFixed(1)}`,
    "Z",
  ].join(" ");
}

type ScaleKind = "organic" | "diamond" | "armor" | "keeled" | "patchy";

function variantKind(id: ProfilePlanProScaleBgVariant): ScaleKind {
  switch (id) {
    case "scale-mamba":
    case "scale-anaconda":
    case "scale-gecko":
    case "scale-cobra":
    case "scale-biolume":
      return "organic";
    case "scale-king":
    case "scale-diamondback":
    case "scale-gaboon":
    case "scale-python":
      return "diamond";
    case "scale-dragon":
    case "scale-chrome":
      return "armor";
    case "scale-bushmaster":
    case "scale-viper":
      return "keeled";
    case "scale-shed":
      return "patchy";
    default:
      return "organic";
  }
}

/** Native / Web 共通の描画要素 */
export type ProfilePlanProScaleDrawItem =
  | {
      t: "path";
      d: string;
      fill: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      t: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
    }
  | {
      t: "circle";
      cx: number;
      cy: number;
      r: number;
      fill: string;
    };

function itemsToSvgMarkup(items: ProfilePlanProScaleDrawItem[]): string {
  return items
    .map((item) => {
      if (item.t === "path") {
        return `<path d="${item.d}" fill="${item.fill}" stroke="${item.stroke}" stroke-width="${item.strokeWidth}"/>`;
      }
      if (item.t === "line") {
        return `<line x1="${item.x1}" y1="${item.y1}" x2="${item.x2}" y2="${item.y2}" stroke="${item.stroke}" stroke-width="${item.strokeWidth}"/>`;
      }
      return `<circle cx="${item.cx}" cy="${item.cy}" r="${item.r}" fill="${item.fill}"/>`;
    })
    .join("");
}

function buildSparseScaleItems(
  variant: ProfilePlanProScaleBgVariant
): ProfilePlanProScaleDrawItem[] {
  const palette = PALETTES[variant];
  activeOpacityMul = palette.opacityMul ?? 1;
  try {
    return buildSparseScaleSvgInner(variant, palette);
  } finally {
    activeOpacityMul = 1;
  }
}

function buildSparseScaleSvgInner(
  variant: ProfilePlanProScaleBgVariant,
  palette: ScalePalette
): ProfilePlanProScaleDrawItem[] {
  const kind = variantKind(variant);
  const items: ProfilePlanProScaleDrawItem[] = [];
  const densityMul = palette.densityMul ?? 1;
  const fillBoost = palette.fillBoost ?? 1;
  const strokeBoost = palette.strokeBoost ?? 1;

  const colStep =
    variant === "scale-mamba"
      ? 15
      : variant === "scale-anaconda"
        ? 24
        : kind === "diamond"
          ? 18
          : kind === "armor"
            ? 26
            : 20;
  const rowStep =
    variant === "scale-mamba"
      ? 11
      : variant === "scale-anaconda"
        ? 17
        : kind === "diamond"
          ? 16
          : kind === "armor"
            ? 22
            : 14;
  const cols = Math.ceil(CANVAS_W / colStep) + 2;
  const rows = Math.ceil(CANVAS_H / rowStep) + 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = col * colStep + (row % 2) * (colStep / 2);
      const cy = row * rowStep;
      if (cx < -colStep || cy < -rowStep || cx > CANVAS_W + colStep || cy > CANVAS_H + rowStep) {
        continue;
      }

      const nx = cx / CANVAS_W;
      const ny = cy / CANVAS_H;
      const dens = densityAt(nx, ny) * densityMul;

      const keep = dens * (kind === "patchy" ? 0.58 : 0.82);
      if (hash01(col + 1.1, row + 2.3) > keep) continue;

      if (kind === "patchy" && hash01(col * 3.1, row * 2.7) > 0.62) continue;

      const sizeJitter = 0.72 + hash01(col * 1.7, row * 0.9) * 0.55;

      const bandOn =
        variant === "scale-king" && Math.floor(cy / 28) % 2 === 0;
      const diamondMark =
        (variant === "scale-diamondback" || variant === "scale-gaboon") &&
        hash01(col * 0.5, row * 0.5) > 0.55;

      let strokeRgb =
        palette.strokes[
          Math.floor(hash01(col * 2.1, row * 1.4) * palette.strokes.length)
        ] ?? palette.strokes[0]!;
      let fillRgb =
        palette.fills[
          Math.floor(hash01(col * 0.8, row * 1.9) * palette.fills.length)
        ] ?? palette.fills[0]!;

      if (bandOn) {
        strokeRgb = palette.strokes[1] ?? strokeRgb;
        fillRgb = palette.fills[1] ?? fillRgb;
      } else if (variant === "scale-king") {
        strokeRgb = palette.strokes[3] ?? strokeRgb;
        fillRgb = palette.fills[0] ?? fillRgb;
      }

      if (diamondMark) {
        strokeRgb = palette.strokes[0] ?? strokeRgb;
        fillRgb = palette.fills[1] ?? fillRgb;
      }

      let op = (0.07 + hash01(col + 5, row + 9) * 0.14) * strokeBoost;
      if (hash01(col + 11, row + 3) > 0.88) op += 0.12 * strokeBoost;
      if (bandOn || diamondMark) op *= 1.25;
      op = scaleOp(op);

      const fillOp = scaleOp(
        (0.035 + hash01(col * 0.4, row * 1.2) * 0.08) * fillBoost
      );
      const sw = Number((0.55 + hash01(col + 2, row + 4) * 0.75).toFixed(2));

      let d: string;
      let ww: number;
      let hh: number;

      if (kind === "diamond") {
        ww = (diamondMark ? 11 : 9) * sizeJitter;
        hh = (diamondMark ? 13 : 11) * sizeJitter;
        d = diamondScalePath(cx, cy, ww, hh);
      } else if (kind === "armor") {
        ww = 22 * sizeJitter;
        hh = 16 * sizeJitter;
        d = armorScalePath(cx, cy, ww, hh);
      } else {
        const baseW =
          variant === "scale-mamba" ? 13 : variant === "scale-anaconda" ? 20 : 16;
        const baseH =
          variant === "scale-mamba" ? 10 : variant === "scale-anaconda" ? 14 : 12;
        ww = (kind === "keeled" ? 14 : baseW) * sizeJitter;
        hh = (kind === "keeled" ? 11 : baseH) * sizeJitter;
        d = organicScalePath(cx, cy, ww, hh);
      }

      items.push({
        t: "path",
        d,
        fill: `rgba(${fillRgb},${fillOp.toFixed(3)})`,
        stroke: `rgba(${strokeRgb},${op.toFixed(3)})`,
        strokeWidth: sw,
      });

      if (
        (kind === "keeled" ||
          variant === "scale-chrome" ||
          variant === "scale-diamondback" ||
          variant === "scale-gaboon") &&
        palette.ridge
      ) {
        if (hash01(col + 7, row + 1) > 0.35) {
          const ridgeOp = scaleOp(op * 1.4);
          items.push({
            t: "line",
            x1: cx,
            y1: cy - hh * 0.28,
            x2: cx,
            y2: cy + hh * 0.42,
            stroke: `rgba(${palette.ridge},${ridgeOp.toFixed(3)})`,
            strokeWidth: 0.55,
          });
        }
      }

      if (variant === "scale-mamba" && hash01(col * 2.2, row * 3.1) > 0.7) {
        items.push({
          t: "path",
          d: organicScalePath(cx, cy - 0.8, ww * 0.72, hh * 0.55),
          fill: "none",
          stroke: `rgba(203,213,225,${scaleOp(0.14).toFixed(3)})`,
          strokeWidth: 0.4,
        });
      }

      if (variant === "scale-biolume" && hash01(col * 4, row * 5) > 0.72) {
        const glow =
          palette.strokes[Math.floor(hash01(col, row) * palette.strokes.length)]!;
        items.push({
          t: "circle",
          cx,
          cy,
          r: 1.2 + hash01(col, row) * 1.4,
          fill: `rgba(${glow},${scaleOp(0.22).toFixed(3)})`,
        });
      }

      if (kind === "patchy" && hash01(col * 5.5, row * 3.2) > 0.78) {
        const hx = cx + 4;
        const hy = cy - 3;
        items.push({
          t: "line",
          x1: cx,
          y1: cy,
          x2: hx,
          y2: hy,
          stroke: `${palette.hudSecondary}${scaleOp(0.28)})`,
          strokeWidth: 0.6,
        });
        items.push({
          t: "circle",
          cx: hx,
          cy: hy,
          r: 0.9,
          fill: `${palette.hudPrimary}${scaleOp(0.35)})`,
        });
      }
    }
  }

  return items;
}

function buildSparseScaleSvg(variant: ProfilePlanProScaleBgVariant): string {
  const markup = itemsToSvgMarkup(buildSparseScaleItems(variant));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" preserveAspectRatio="none">${markup}</svg>`;
}

function buildHudItems(
  variant: ProfilePlanProScaleBgVariant
): ProfilePlanProScaleDrawItem[] {
  const palette = PALETTES[variant];
  const { hudPrimary, hudSecondary } = palette;
  activeOpacityMul = palette.opacityMul ?? 1;
  const items: ProfilePlanProScaleDrawItem[] = [];

  const pushDots = (
    x0: number,
    y0: number,
    w: number,
    h: number,
    gap: number,
    op: number,
    fillPrefix: string
  ) => {
    for (let y = y0; y <= y0 + h; y += gap) {
      for (let x = x0; x <= x0 + w; x += gap) {
        items.push({
          t: "circle",
          cx: x,
          cy: y,
          r: 0.7,
          fill: `${fillPrefix}${op})`,
        });
      }
    }
  };

  const pushTicks = (
    x: number,
    y: number,
    count: number,
    gap: number,
    len: number,
    op: number,
    strokePrefix: string
  ) => {
    for (let i = 0; i < count; i += 1) {
      const tx = x + i * gap;
      const tl = i % 4 === 0 ? len * 1.8 : len;
      items.push({
        t: "line",
        x1: tx,
        y1: y,
        x2: tx,
        y2: y + tl,
        stroke: `${strokePrefix}${op})`,
        strokeWidth: 0.8,
      });
    }
  };

  const pushPlus = (
    cx: number,
    cy: number,
    s: number,
    op: number,
    strokePrefix: string
  ) => {
    items.push({
      t: "line",
      x1: cx - s,
      y1: cy,
      x2: cx + s,
      y2: cy,
      stroke: `${strokePrefix}${op})`,
      strokeWidth: 0.8,
    });
    items.push({
      t: "line",
      x1: cx,
      y1: cy - s,
      x2: cx,
      y2: cy + s,
      stroke: `${strokePrefix}${op})`,
      strokeWidth: 0.8,
    });
  };

  pushDots(210, 20, 70, 34, 8, scaleOp(0.12), hudPrimary);
  pushTicks(196, 66, 12, 7.5, 3, scaleOp(0.22), hudSecondary);
  pushPlus(276, 40, 3, scaleOp(0.3), hudPrimary);
  pushPlus(288, 190, 2.6, scaleOp(0.26), hudPrimary);
  pushTicks(286, 150, 8, 6, 2.4, scaleOp(0.18), hudSecondary);
  pushDots(24, 372, 60, 40, 9, scaleOp(0.1), hudPrimary);
  pushTicks(150, 420, 16, 6, 2.2, scaleOp(0.16), hudSecondary);
  pushPlus(280, 400, 3, scaleOp(0.24), hudPrimary);

  activeOpacityMul = 1;
  return items;
}

function buildHudSvg(variant: ProfilePlanProScaleBgVariant): string {
  const markup = itemsToSvgMarkup(buildHudItems(variant));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" preserveAspectRatio="none">${markup}</svg>`;
}

const skinItemsCache = new Map<string, ProfilePlanProScaleDrawItem[]>();
const hudItemsCache = new Map<string, ProfilePlanProScaleDrawItem[]>();

/** Native 描画用 — 疎な爬虫類鱗 */
export function getProfilePlanProScaleSkinItems(
  variant: ProfilePlanProScaleBgVariant
): ProfilePlanProScaleDrawItem[] {
  const hit = skinItemsCache.get(variant);
  if (hit) return hit;
  const items = buildSparseScaleItems(variant);
  skinItemsCache.set(variant, items);
  return items;
}

/** Native 描画用 — 微細 HUD */
export function getProfilePlanProScaleHudItems(
  variant: ProfilePlanProScaleBgVariant
): ProfilePlanProScaleDrawItem[] {
  const hit = hudItemsCache.get(variant);
  if (hit) return hit;
  const items = buildHudItems(variant);
  hudItemsCache.set(variant, items);
  return items;
}

/** Native SvgXml 用 — 疎な爬虫類鱗 */
export function getProfilePlanProScaleSkinSvg(
  variant: ProfilePlanProScaleBgVariant
): string {
  return buildSparseScaleSvg(variant);
}

/** Native SvgXml 用 — 微細 HUD */
export function getProfilePlanProScaleHudSvg(
  variant: ProfilePlanProScaleBgVariant
): string {
  return buildHudSvg(variant);
}

/** 疎な爬虫類鱗レイヤー（atmos 配置） */
export function getProfilePlanProScaleSkinUrl(
  variant: ProfilePlanProScaleBgVariant
): string {
  return cachedUrl(`scale:skin:${variant}:v7`, () => buildSparseScaleSvg(variant));
}

/** 微細 HUD（atmos と同配置） */
export function getProfilePlanProScaleHudUrl(
  variant: ProfilePlanProScaleBgVariant
): string {
  return cachedUrl(`scale:hud:${variant}:v7`, () => buildHudSvg(variant));
}

export const PROFILE_PLAN_PRO_SCALE_CANVAS = {
  width: CANVAS_W,
  height: CANVAS_H,
} as const;
