/** Web `.result-hit-cyber-clip`（右上・左下のみ 12px 角切り） */
export const RESULT_HIT_CYBER_CLIP_CUT = 12;

/** Web `.result-hit-cyber-clip-sm`（バッジ用 5px 角切り） */
export const RESULT_CYBER_BADGE_CLIP_CUT = 5;

/** Skia / SVG 用の閉じたパス */
export function resultHitCyberClipPathD(
  width: number,
  height: number,
  cut = RESULT_HIT_CYBER_CLIP_CUT
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w, h);
  if (c <= 0 || w <= 0 || h <= 0) return "";
  return [
    "M 0 0",
    `L ${w - c} 0`,
    `L ${w} ${c}`,
    `L ${w} ${h}`,
    `L ${c} ${h}`,
    `L 0 ${h - c}`,
    "Z",
  ].join(" ");
}
