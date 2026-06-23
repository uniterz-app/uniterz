import { chamferedCornerRevealPathsD } from "../games/matchListCyberClipPath";

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
  const c = Math.min(cut, w / 2, h / 2);
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

/** hit-clip の角三角マスク（右上・左下のみ） */
export function resultHitCyberCornerRevealPathsD(
  width: number,
  height: number,
  cut: number,
  overlap = 1
): readonly [string, string] {
  const [, tr, , bl] = chamferedCornerRevealPathsD(width, height, cut, overlap);
  return [tr, bl];
}

/** 四隅 L 字アクセント（clip 内に描画 — Web の border-l/t 角飾り相当） */
export function resultHitCyberCornerAccentPathsD(
  width: number,
  height: number,
  cut = RESULT_HIT_CYBER_CLIP_CUT,
  len = 10
): string[] {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const l = Math.min(len, w / 2, h / 2);
  if (l <= 0 || w <= 0 || h <= 0) return [];
  return [
    `M 0 ${l} L 0 0 L ${l} 0`,
    `M ${w - l} 0 L ${w} 0 L ${w} ${l}`,
    `M ${w} ${h - l} L ${w} ${h} L ${w - l} ${h}`,
    `M ${l} ${h} L 0 ${h} L 0 ${h - l}`,
  ];
}

/** 枠走査光用 — 内側へ inset px した hit-clip */
export function insetResultHitCyberClipPathD(
  width: number,
  height: number,
  inset: number,
  cut = RESULT_HIT_CYBER_CLIP_CUT
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const p = Math.max(0, inset);
  if (w <= p * 2 || h <= p * 2) return "";
  const c = Math.min(cut, w / 2, h / 2);
  const ic = Math.max(0, c - p);
  return [
    `M ${p} ${p}`,
    `L ${w - p - ic} ${p}`,
    `L ${w - p} ${p + ic}`,
    `L ${w - p} ${h - p}`,
    `L ${p + ic} ${h - p}`,
    `L ${p} ${h - p - ic}`,
    "Z",
  ].join(" ");
}
