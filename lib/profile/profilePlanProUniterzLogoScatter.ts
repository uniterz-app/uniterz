/**
 * wave-uniterz-logo 背景のまばら配置。
 * 主役1枚 + 薄いエコーを画面のあちこちに散らす（すべて背景層）。
 */

export type UniterzLogoScatterMark = {
  id: string;
  /** コンテナ幅に対するロゴ幅 */
  widthPct: number;
  /** コンテナ高さに対する top（ロゴ中心） */
  cyPct: number;
  /** コンテナ幅に対する left（ロゴ中心） */
  cxPct: number;
  opacity: number;
  blurPx: number;
  rotateDeg: number;
};

/**
 * プロフィール縦カード用。
 * 主役はカード内に収まる大きさ。残りはサイズ・不透明度・ぼかしを変えて散らす。
 */
export const PROFILE_UNITERZ_LOGO_SCATTER: readonly UniterzLogoScatterMark[] = [
  {
    id: "hero",
    // 128% だと左右が切れ、中央を食いすぎる
    widthPct: 0.78,
    cyPct: 0.277,
    cxPct: 0.5,
    opacity: 0.92,
    blurPx: 0,
    rotateDeg: 0,
  },
  {
    id: "nw",
    widthPct: 0.3,
    cyPct: 0.12,
    cxPct: 0.08,
    opacity: 0.12,
    blurPx: 11,
    rotateDeg: 22,
  },
  {
    id: "ne",
    widthPct: 0.26,
    cyPct: 0.18,
    cxPct: 0.94,
    opacity: 0.1,
    blurPx: 13,
    rotateDeg: -18,
  },
  {
    id: "west",
    widthPct: 0.36,
    cyPct: 0.42,
    cxPct: -0.04,
    opacity: 0.16,
    blurPx: 8,
    rotateDeg: 14,
  },
  {
    id: "east",
    widthPct: 0.42,
    cyPct: 0.48,
    cxPct: 0.96,
    opacity: 0.18,
    blurPx: 7,
    rotateDeg: -11,
  },
  {
    id: "sw",
    widthPct: 0.34,
    cyPct: 0.72,
    cxPct: 0.1,
    opacity: 0.14,
    blurPx: 9,
    rotateDeg: -15,
  },
  {
    id: "se",
    widthPct: 0.4,
    cyPct: 0.78,
    cxPct: 0.86,
    opacity: 0.2,
    blurPx: 6,
    rotateDeg: 9,
  },
  {
    id: "south",
    widthPct: 0.28,
    cyPct: 0.92,
    cxPct: 0.48,
    opacity: 0.11,
    blurPx: 12,
    rotateDeg: 6,
  },
] as const;

/**
 * ランキング横帯用。
 */
export const RANKING_UNITERZ_LOGO_SCATTER: readonly UniterzLogoScatterMark[] = [
  {
    id: "hero",
    widthPct: 0.72,
    cyPct: 0.42,
    cxPct: 0.82,
    opacity: 0.82,
    blurPx: 0,
    rotateDeg: -4,
  },
  {
    id: "west",
    widthPct: 0.36,
    cyPct: 0.68,
    cxPct: 0.22,
    opacity: 0.16,
    blurPx: 8,
    rotateDeg: 12,
  },
  {
    id: "nw",
    widthPct: 0.26,
    cyPct: 0.2,
    cxPct: 0.1,
    opacity: 0.12,
    blurPx: 11,
    rotateDeg: -16,
  },
  {
    id: "sw",
    widthPct: 0.3,
    cyPct: 0.85,
    cxPct: 0.55,
    opacity: 0.1,
    blurPx: 10,
    rotateDeg: 8,
  },
] as const;
