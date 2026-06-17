/** Web `match-list-cyber-card` の角切り（モバイル dense = 10px） */
export const MATCH_LIST_CYBER_CUT_DENSE = 10;
export const MATCH_LIST_CYBER_CUT_STAT_BOX = 7;
export const MATCH_LIST_CYBER_CUT_MARKET_BAR = 5;

/** Skia / SVG 用の閉じたパス（左上から時計回り） */
export function chamferedRectPathD(width: number, height: number, cut: number): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  if (c <= 0 || w <= 0 || h <= 0) return "";
  return [
    `M ${c} 0`,
    `L ${w - c} 0`,
    `L ${w} ${c}`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L ${c} ${h}`,
    `L 0 ${h - c}`,
    `L 0 ${c}`,
    "Z",
  ].join(" ");
}
