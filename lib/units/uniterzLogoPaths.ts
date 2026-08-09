/**
 * UNITERZ サイバーロゴ — 各文字のアウトラインとアーチ配置。
 * Web / Native 共通データ（描画は各面の SVG コンポーネント）。
 *
 * グリフ局所座標系: 幅 100 × 高さ 140（原点は左上）
 */

export const UNITERZ_LOGO_VIEW = {
  /** グロー用パディング込み。Z が見切れないよう右に余裕 */
  width: 780,
  height: 220,
  glyphW: 100,
  glyphH: 140,
} as const;

export type UniterzLogoGlyphId =
  | "U"
  | "N"
  | "I"
  | "T"
  | "E"
  | "R"
  | "Z";

/**
 * 各文字パス。U / R は fill-rule="evenodd" でカウンターあり。
 */
export const UNITERZ_LOGO_GLYPH_PATHS: Record<UniterzLogoGlyphId, string> = {
  /** U — 角張り、上左右スパイク */
  U: [
    "M 8 10",
    "L 30 10",
    "L 30 20",
    "L 36 20",
    "L 36 96",
    "L 64 96",
    "L 64 20",
    "L 70 20",
    "L 70 10",
    "L 92 10",
    "L 92 22",
    "L 80 22",
    "L 80 104",
    "L 70 116",
    "L 30 116",
    "L 20 104",
    "L 20 22",
    "L 8 22",
    "Z",
    "M 44 34",
    "L 56 34",
    "L 56 84",
    "L 44 84",
    "Z",
  ].join(" "),

  /** N — 斜線太め、上外角スパイク */
  N: [
    // 左ステム
    "M 6 10",
    "L 30 10",
    "L 30 20",
    "L 36 20",
    "L 36 120",
    "L 14 120",
    "L 14 22",
    "L 6 22",
    "Z",
    // 斜線（食い込み）
    "M 28 18",
    "L 50 18",
    "L 90 114",
    "L 68 114",
    "Z",
    // 右ステム
    "M 70 10",
    "L 94 10",
    "L 94 22",
    "L 86 22",
    "L 86 120",
    "L 64 120",
    "L 64 20",
    "L 70 20",
    "Z",
  ].join(" "),

  /** I — 太い縦棒、上端左右に短いスパイク */
  I: [
    "M 24 10",
    "L 42 10",
    "L 42 20",
    "L 58 20",
    "L 58 10",
    "L 76 10",
    "L 76 24",
    "L 64 24",
    "L 64 120",
    "L 36 120",
    "L 36 24",
    "L 24 24",
    "Z",
  ].join(" "),

  /** T — バー端はわずかに下向き、中央ステム */
  T: [
    "M 4 16",
    "L 18 8",
    "L 82 8",
    "L 96 16",
    "L 88 32",
    "L 60 32",
    "L 60 120",
    "L 40 120",
    "L 40 32",
    "L 12 32",
    "Z",
  ].join(" "),

  /** E — 中腕短め */
  E: [
    // ステム + 上下の厚みを含む一塊（evenodd で腕間を抜く）
    "M 12 10",
    "L 34 10",
    "L 34 20",
    "L 40 20",
    "L 40 120",
    "L 34 120",
    "L 34 130",
    "L 12 130",
    "L 12 118",
    "L 22 118",
    "L 22 22",
    "L 12 22",
    "Z",
    "M 36 10",
    "L 94 10",
    "L 94 32",
    "L 36 32",
    "Z",
    "M 36 56",
    "L 84 56",
    "L 84 76",
    "L 36 76",
    "Z",
    "M 36 98",
    "L 94 98",
    "L 94 120",
    "L 36 120",
    "Z",
  ].join(" "),

  /** R — 角ボウル + 脚 */
  R: [
    "M 10 10",
    "L 34 10",
    "L 34 20",
    "L 40 20",
    "L 40 120",
    "L 18 120",
    "L 18 22",
    "L 10 22",
    "Z",
    // ボウル（穴付き evenodd）
    "M 36 10",
    "L 80 10",
    "L 90 18",
    "L 90 64",
    "L 80 74",
    "L 40 74",
    "L 40 32",
    "L 36 32",
    "Z",
    "M 48 28",
    "L 74 28",
    "L 76 34",
    "L 76 54",
    "L 70 60",
    "L 48 60",
    "Z",
    // 脚
    "M 46 68",
    "L 68 68",
    "L 98 120",
    "L 74 120",
    "Z",
  ].join(" "),

  /** Z */
  Z: [
    "M 6 10",
    "L 94 10",
    "L 94 34",
    "L 46 34",
    "L 94 96",
    "L 94 120",
    "L 6 120",
    "L 6 96",
    "L 54 96",
    "L 6 34",
    "Z",
  ].join(" "),
};

/** evenodd が必要な文字 */
export const UNITERZ_LOGO_EVENODD: ReadonlySet<UniterzLogoGlyphId> = new Set([
  "U",
  "R",
]);

export type UniterzLogoLetterLayout = {
  id: UniterzLogoGlyphId;
  d: string;
  /** 変形の基準点（グリフ底辺中央） */
  cx: number;
  cy: number;
  rotate: number;
  scale: number;
};

/**
 * 緩やかな上凸アーチ。外側ほど傾き、Z 側に余白。
 */
export function uniterzLogoLetterLayouts(): UniterzLogoLetterLayout[] {
  const word: UniterzLogoGlyphId[] = ["U", "N", "I", "T", "E", "R", "Z"];
  const { width, height } = UNITERZ_LOGO_VIEW;

  const radius = 980;
  const spanDeg = 24;
  const startDeg = -spanDeg / 2;
  const cx = width / 2;
  const cy = height + radius - 128;

  // 文字ごとの相対トラッキング（合計で正規化）
  const tracks = [1.02, 1.0, 0.9, 1.1, 1.02, 1.04, 1.12];
  const trackSum = tracks.reduce((a, b) => a + b, 0);

  let acc = 0;
  return word.map((id, i) => {
    const w = tracks[i]!;
    const center = (acc + w / 2) / trackSum;
    acc += w;

    const aDeg = startDeg + spanDeg * center;
    const aRad = (aDeg * Math.PI) / 180;
    // 端をわずかに小さく
    const scale = 1.04 - Math.abs(center - 0.5) * 0.1;

    const px = cx + radius * Math.sin(aRad);
    const py = cy - radius * Math.cos(aRad);

    return {
      id,
      d: UNITERZ_LOGO_GLYPH_PATHS[id],
      cx: px,
      cy: py,
      rotate: aDeg,
      scale,
    };
  });
}

export const UNITERZ_LOGO_GLOW = {
  core: "#8AF7FF",
  soft: "#00E8FF",
  rimBlur: 1.1,
  softBlur: 3.4,
  rimOpacity: 0.85,
  softOpacity: 0.4,
} as const;

export const UNITERZ_LOGO_GLYPH_SIZE = {
  w: UNITERZ_LOGO_VIEW.glyphW,
  h: UNITERZ_LOGO_VIEW.glyphH,
} as const;
