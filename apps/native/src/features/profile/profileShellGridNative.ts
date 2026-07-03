/**
 * プロフィール概要タブのカード背景格子（Web `lib/profile/profileShellGrid.ts` の方眼に準拠）。
 * RN では `rgba(148,163,184,0.14)` × `opacity 0.36` だとほぼ見えないため、線とレイヤーをやや強めにしている。
 */
export const PROFILE_SHELL_GRID_NATIVE = {
  cellPx: 22,
  stroke: "rgba(0, 245, 255, 0.14)",
  strokeWidth: 1,
  layerOpacity: 0.72,
} as const;

export function profileShellGridPathD(cellPx: number): string {
  return `M ${cellPx} 0 L 0 0 0 ${cellPx}`;
}
