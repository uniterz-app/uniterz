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

/**
 * Web 角飾り相当の L 字（バウンディング四隅）。
 * 斜め角そのものはシェルの枠リングが担うので、ここでは重ね描きしない。
 * 直角コーナー（左上・右下）だけ強調する。
 */
export function resultHitCyberCornerAccentPathsD(
  width: number,
  height: number,
  _cut = RESULT_HIT_CYBER_CLIP_CUT,
  len = 10
): string[] {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const l = Math.min(len, w / 2, h / 2);
  if (l <= 0 || w <= 0 || h <= 0) return [];
  return [
    // 左上（直角）
    `M 0 ${l} L 0 0 L ${l} 0`,
    // 右下（直角）
    `M ${w} ${h - l} L ${w} ${h} L ${w - l} ${h}`,
  ];
}

/** 全角 chamfer（8 角）用の四隅アクセント — 外形に沿う */
export function chamferedCornerAccentPathsD(
  width: number,
  height: number,
  cut: number,
  len = 10
): string[] {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const c = Math.min(cut, w / 2, h / 2);
  const l = Math.min(len, w / 2, h / 2);
  if (l <= 0 || c <= 0 || w <= 0 || h <= 0) return [];
  return [
    `M 0 ${Math.min(h, c + l)} L 0 ${c} L ${c} 0 L ${Math.min(w, c + l)} 0`,
    `M ${Math.max(0, w - c - l)} 0 L ${w - c} 0 L ${w} ${c} L ${w} ${Math.min(h, c + l)}`,
    `M ${w} ${Math.max(0, h - c - l)} L ${w} ${h - c} L ${w - c} ${h} L ${Math.max(0, w - c - l)} ${h}`,
    `M ${Math.min(w, c + l)} ${h} L ${c} ${h} L 0 ${h - c} L 0 ${Math.max(0, h - c - l)}`,
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
