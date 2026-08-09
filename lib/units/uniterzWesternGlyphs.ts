/**
 * UNITERZ ウェスタン調ロゴタイポ — 読みやすさ優先。
 * ・牙は控えめ
 * ・重ねは「隙間」ではなく「食い込み」にして黒線を防ぐ
 * ・字間はコンポーネント側で広め
 *
 * グリフ viewBox: 0 0 88 210
 */

export type UniterzWesternVariantId = "a" | "b" | "c";

export type UniterzWesternVariantMeta = {
  id: UniterzWesternVariantId;
  name: string;
  note: string;
  recommended?: boolean;
};

export const UNITERZ_WESTERN_VARIANTS: UniterzWesternVariantMeta[] = [
  {
    id: "a",
    name: "A · Clean Tusks",
    note: "読みやすさ優先。牙は残しつつ輪郭と字間を整理。",
    recommended: true,
  },
  {
    id: "b",
    name: "B · Soft Feet",
    note: "牙を短く、さらにすっきり。",
  },
  {
    id: "c",
    name: "C · Bold Condensed",
    note: "太め。アクセント強め。",
  },
];

type WesternParams = {
  stem: number;
  flare: number;
  flareH: number;
  spur: number;
  arm: number;
  tip: number;
};

const PARAMS: Record<UniterzWesternVariantId, WesternParams> = {
  a: { stem: 24, flare: 9, flareH: 11, spur: 4, arm: 18, tip: 8 },
  b: { stem: 22, flare: 6, flareH: 9, spur: 0, arm: 17, tip: 6 },
  c: { stem: 28, flare: 11, flareH: 12, spur: 5, arm: 20, tip: 9 },
};

const GLYPH_W = 88;
const GLYPH_H = 210;
const TOP = 12;
const BOT = 198;

function poly(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return (
    `M ${first![0].toFixed(1)} ${first![1].toFixed(1)} ` +
    rest.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
    " Z"
  );
}

/** 単一輪郭の牙ステム */
function stemAt(
  cx: number,
  p: WesternParams,
  opts?: { spur?: boolean }
): string {
  const hw = p.stem / 2;
  const L = cx - hw;
  const R = cx + hw;
  const mid = (TOP + BOT) / 2;
  const s = opts?.spur === false ? 0 : p.spur;
  const pts: Array<[number, number]> = [
    [L - p.flare, TOP],
    [L, TOP + p.flareH],
  ];
  if (s > 0) {
    pts.push([L, mid - s], [L - s, mid], [L, mid + s]);
  }
  pts.push(
    [L, BOT - p.flareH],
    [L - p.flare, BOT],
    [R + p.flare, BOT],
    [R, BOT - p.flareH]
  );
  if (s > 0) {
    pts.push([R, mid + s], [R + s, mid], [R, mid - s]);
  }
  pts.push([R, TOP + p.flareH], [R + p.flare, TOP]);
  return poly(pts);
}

function glyphI(p: WesternParams): string {
  return stemAt(GLYPH_W / 2, p);
}

function glyphU(p: WesternParams): string {
  const inset = 14;
  const L = inset;
  const R = GLYPH_W - inset;
  const iL = L + p.stem;
  const iR = R - p.stem;
  const bowl = BOT - p.stem * 1.2;
  const f = p.flare;
  const fh = p.flareH;

  const outer = poly([
    [L - f, TOP],
    [L, TOP + fh],
    [L, BOT - fh],
    [L - f * 0.2, BOT],
    [R + f * 0.2, BOT],
    [R, BOT - fh],
    [R, TOP + fh],
    [R + f, TOP],
  ]);
  const inner = poly([
    [iL, TOP],
    [iR, TOP],
    [iR, bowl],
    [iL, bowl],
  ]);
  return `${outer} ${inner}`;
}

function glyphN(p: WesternParams): string {
  const inset = 13;
  const leftCx = inset + p.stem / 2;
  const rightCx = GLYPH_W - inset - p.stem / 2;
  // ステム同士が離れすぎないよう斜線は両端に食い込ませる
  const left = stemAt(leftCx, p, { spur: false });
  const right = stemAt(rightCx, p, { spur: false });
  const x0 = leftCx + p.stem * 0.15;
  const x1 = rightCx - p.stem * 0.15;
  const y0 = TOP + p.flareH + 6;
  const y1 = BOT - p.flareH - 6;
  const t = p.stem * 0.78;
  // 平行四辺形（左右ステムに 3px 食い込み）
  const diag = poly([
    [x0 - 3, y0],
    [x0 - 3 + t, y0],
    [x1 + 3, y1],
    [x1 + 3 - t, y1],
  ]);
  return `${left} ${diag} ${right}`;
}

function glyphT(p: WesternParams): string {
  const cx = GLYPH_W / 2;
  const stem = stemAt(cx, { ...p, spur: 0 }, { spur: false });
  // バーをステムに食い込ませる
  const y0 = TOP;
  const y1 = TOP + p.arm;
  const x0 = 8;
  const x1 = GLYPH_W - 8;
  const tip = p.tip;
  const bar = poly([
    [x0 + tip * 0.15, y0],
    [x1 - tip * 0.15, y0],
    [x1, y0 + tip * 0.25],
    [x1 - tip * 0.25, y0 + tip * 0.65],
    [x1 - tip * 0.4, y1],
    [x0 + tip * 0.4, y1],
    [x0 + tip * 0.25, y0 + tip * 0.65],
    [x0, y0 + tip * 0.25],
  ]);
  return `${stem} ${bar}`;
}

function glyphE(p: WesternParams): string {
  const inset = 14;
  const cx = inset + p.stem / 2;
  const stem = stemAt(cx, p, { spur: false });
  const x0 = cx + p.stem / 2 - 3; // 食い込み
  const x1 = GLYPH_W - 9;
  const tip = p.tip;
  const arm = p.arm;
  const mkArm = (cy: number, right: number) => {
    const hh = arm / 2;
    return poly([
      [x0, cy - hh],
      [right - tip * 0.35, cy - hh],
      [right, cy - hh + tip * 0.2],
      [right - tip * 0.2, cy],
      [right, cy + hh - tip * 0.2],
      [right - tip * 0.35, cy + hh],
      [x0, cy + hh],
    ]);
  };
  return `${stem} ${mkArm(TOP + arm / 2 + 2, x1)} ${mkArm((TOP + BOT) / 2, x1 - 7)} ${mkArm(BOT - arm / 2 - 2, x1)}`;
}

function glyphR(p: WesternParams): string {
  const inset = 13;
  const cx = inset + p.stem / 2;
  const stem = stemAt(cx, p, { spur: false });
  const x0 = cx + p.stem / 2 - 3;
  const bowlR = GLYPH_W - 11;
  const bowlBot = TOP + 88;
  const mid = TOP + 44;

  const bowl = poly([
    [x0, TOP + 4],
    [bowlR - 6, TOP + 4],
    [bowlR, TOP + 10],
    [bowlR - 2, mid],
    [bowlR, bowlBot - 8],
    [bowlR - 10, bowlBot],
    [x0, bowlBot],
  ]);
  const hole = poly([
    [x0 + 4, TOP + 16],
    [bowlR - 14, TOP + 16],
    [bowlR - 12, mid],
    [bowlR - 14, bowlBot - 14],
    [x0 + 4, bowlBot - 14],
  ]);
  const leg = poly([
    [x0 + 1, bowlBot - 8],
    [x0 + p.stem * 0.65, bowlBot - 8],
    [GLYPH_W - 9 + p.flare * 0.3, BOT],
    [GLYPH_W - 9 - p.stem * 0.5, BOT],
    [x0 + 1, bowlBot + 14],
  ]);
  return `${stem} ${bowl} ${hole} ${leg}`;
}

function glyphZ(p: WesternParams): string {
  const x0 = 10;
  const x1 = GLYPH_W - 10;
  const arm = p.arm;
  const tip = p.tip;
  const t = p.stem * 0.85;
  const top = poly([
    [x0 + tip * 0.15, TOP],
    [x1 - tip * 0.15, TOP],
    [x1, TOP + tip * 0.25],
    [x1 - tip * 0.25, TOP + tip * 0.65],
    [x1 - tip * 0.4, TOP + arm],
    [x0 + tip * 0.3, TOP + arm],
    [x0, TOP + arm - tip * 0.15],
    [x0 + tip * 0.2, TOP + arm / 2],
  ]);
  const bot = poly([
    [x0 + tip * 0.4, BOT - arm],
    [x1 - tip * 0.3, BOT - arm],
    [x1, BOT - arm + tip * 0.15],
    [x1 - tip * 0.2, BOT - arm / 2],
    [x1, BOT - tip * 0.15],
    [x1 - tip * 0.35, BOT],
    [x0 + tip * 0.15, BOT],
    [x0, BOT - tip * 0.25],
    [x0 + tip * 0.25, BOT - tip * 0.65],
  ]);
  // 斜線は上下バーに食い込み
  const diag = poly([
    [x1 - 2, TOP + arm - 2],
    [x1 - 2 - t, TOP + arm - 2],
    [x0 + 2, BOT - arm + 2],
    [x0 + 2 + t, BOT - arm + 2],
  ]);
  return `${top} ${diag} ${bot}`;
}

const BUILDERS: Record<string, (p: WesternParams) => string> = {
  U: glyphU,
  N: glyphN,
  I: glyphI,
  T: glyphT,
  E: glyphE,
  R: glyphR,
  Z: glyphZ,
};

export const UNITERZ_WESTERN_GLYPH_VIEW = {
  width: GLYPH_W,
  height: GLYPH_H,
} as const;

export function uniterzWesternGlyphPath(
  char: string,
  variant: UniterzWesternVariantId
): string {
  const builder = BUILDERS[char.toUpperCase()];
  if (!builder) return "";
  return builder(PARAMS[variant]);
}

export function uniterzWesternWordPaths(
  variant: UniterzWesternVariantId
): Array<{ char: string; d: string }> {
  return Array.from("UNITERZ").map((char) => ({
    char,
    d: uniterzWesternGlyphPath(char, variant),
  }));
}

export function uniterzWesternRecommendedVariant(): UniterzWesternVariantId {
  return UNITERZ_WESTERN_VARIANTS.find((v) => v.recommended)?.id ?? "a";
}
