/**
 * ネイティブ試合カードの方眼（中央縦線＝カード水平中央・24px 格子）。
 * 「濃さ」は定数だけで決まらない。`GameCardList` は方眼を zIndex0 の下層に置き、
 * 上にベース色・Blur・白の薄いグラデを重ねている（線は下から透けて均一に見える）。
 * モーダル `PredictMatchPreview` でも同じく方眼を最下層にし、**シェル全面**にベース＋帯を敷く（親に
 * `padding` を置くと、絶対座標の方眼は余白まで伸び、グラデは中だけに乗るため、枠にだけ生グリットが出る）。
 */

/** 1マス（縦横同間隔）px */
export const SHELL_GRID_STEP_PX = 24;

/** 一覧・予想モーダル `MatchPreview` 共用 */
export const CARD_SHELL_GRID_LINE_COLOR = "rgba(184, 220, 252, 0.48)";
export const CARD_SHELL_GRID_LAYER_OPACITY = 0.76;

/** 一覧カード（GameCardList） */
export const LIST_CARD_GRID_LINE_COLOR = CARD_SHELL_GRID_LINE_COLOR;
export const LIST_CARD_GRID_LAYER_OPACITY = CARD_SHELL_GRID_LAYER_OPACITY;

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
