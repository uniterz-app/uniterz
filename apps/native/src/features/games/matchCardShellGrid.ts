/**
 * ネイティブ試合カードの方眼（中央縦線＝カード水平中央・24px 格子）。
 * 試合一覧はカード背景が**上白〜下黒**の縦グラデのため、格子も縦位置で線色を変える（上は暗め線、下は明るめ線）。
 * モーダル `PredictMatchPreview` でも方眼を最下層にし、**シェル全面**にベース＋グラデを敷く。
 */

/** 1マス（縦横同間隔）px */
export const SHELL_GRID_STEP_PX = 24;

/** 一覧・予想モーダル `MatchPreview` 共用 */
export const CARD_SHELL_GRID_LINE_COLOR = "rgba(184, 220, 252, 0.48)";
export const CARD_SHELL_GRID_LAYER_OPACITY = 0.76;

/** 一覧カード（GameCardList）— 無地線用フォールバック・レイヤー不透明度 */
export const LIST_CARD_GRID_LINE_COLOR = CARD_SHELL_GRID_LINE_COLOR;
export const LIST_CARD_GRID_LAYER_OPACITY = 0.82;

/** 一覧：上（明い領域）〜下（黒に近い）で格子のコントラストを取る（t=0 が上端） */
export function listCardShellGridLineColorAtY(normalizedY: number): string {
  const t = Math.max(0, Math.min(1, normalizedY));
  const r0 = 10;
  const g0 = 12;
  const b0 = 18;
  const a0 = 0.34;
  const r1 = 230;
  const g1 = 234;
  const b1 = 242;
  const a1 = 0.12;
  const r = Math.round(r0 + (r1 - r0) * t);
  const g = Math.round(g0 + (g1 - g0) * t);
  const b = Math.round(b0 + (b1 - b0) * t);
  const a = a0 + (a1 - a0) * t;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

/**
 * リザルト一覧カード（`ResultHomeScreen`）・詳細 `ShellCard`（`tone="resultList"`）。
 * 試合一覧よりは控えめ、以前よりやや濃く見えるよう線アルファとレイヤー不透明度を少し上げる。
 */
export const RESULT_LIST_CARD_GRID_LINE_COLOR = "rgba(184, 220, 252, 0.48)";
export const RESULT_LIST_CARD_GRID_LAYER_OPACITY = 0.66;

/** リザルト詳細の `ShellCard` 内方眼（ガラス上では格子がやや強く見えるため薄め） */
export const RESULT_DETAIL_SHELL_GRID_LINE_COLOR = "rgba(184, 220, 252, 0.22)";
export const RESULT_DETAIL_SHELL_GRID_LAYER_OPACITY = 0.36;

/** 予想モーダル先頭プレビュー（PredictModal）— 上記と同一値 */
export const MODAL_PREVIEW_GRID_LINE_COLOR = CARD_SHELL_GRID_LINE_COLOR;
export const MODAL_PREVIEW_GRID_LAYER_OPACITY = CARD_SHELL_GRID_LAYER_OPACITY;

/**
 * 縦線: **カード幅の中央**を必ず1本通す。
 */
export function shellGridVerticalLineLeftsCentered(widthPx: number): number[] {
  const step = SHELL_GRID_STEP_PX;
  if (widthPx < step) return [];
  const cx = widthPx / 2;
  const seen = new Set<number>();
  const maxK = Math.ceil(widthPx / step) + 2;
  for (let k = -maxK; k <= maxK; k++) {
    const x = Math.round(cx + k * step);
    if (x > 0 && x < widthPx) seen.add(x);
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * 横線: **高さの中央**を基準に ±step。
 */
export function shellGridHorizontalLineTopsCentered(heightPx: number): number[] {
  const step = SHELL_GRID_STEP_PX;
  if (heightPx < step) return [];
  const cy = heightPx / 2;
  const seen = new Set<number>();
  const maxK = Math.ceil(heightPx / step) + 2;
  for (let k = -maxK; k <= maxK; k++) {
    const y = Math.round(cy + k * step);
    if (y > 0 && y < heightPx) seen.add(y);
  }
  return [...seen].sort((a, b) => a - b);
}
