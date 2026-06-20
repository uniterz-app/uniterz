/** Web `.rank-first-flow--edge-scan` / `--edge-scan-v` のタイミング */
export const RANK_FIRST_EDGE_H_DURATION_MS = 2400;
export const RANK_FIRST_EDGE_V_DURATION_MS = 3000;

/** 横ビーム幅（枠幅に対する比率） */
export const RANK_FIRST_EDGE_H_BEAM_RATIO = 0.38;
/** 横ビーム開始オフセット（枠外） */
export const RANK_FIRST_EDGE_H_START_RATIO = -0.4;
/** 横ビーム終了位置 */
export const RANK_FIRST_EDGE_H_END_RATIO = 1;

/** 縦ビーム高さ比率 */
export const RANK_FIRST_EDGE_V_BEAM_RATIO = 0.34;
/** 縦ビーム開始オフセット（枠外） */
export const RANK_FIRST_EDGE_V_START_RATIO = -0.36;
/** 縦ビーム終了位置 */
export const RANK_FIRST_EDGE_V_END_RATIO = 1;

export const RANK_FIRST_EDGE_DIM_BORDER = "rgba(184,255,60,0.32)";

export const RANK_FIRST_EDGE_H_GRADIENT = [
  "transparent",
  "rgba(184, 255, 60, 0.15)",
  "rgba(255, 214, 90, 0.95)",
  "rgba(0, 245, 255, 0.75)",
  "transparent",
] as const;

export const RANK_FIRST_EDGE_V_GRADIENT = [
  "transparent",
  "rgba(255, 214, 90, 0.85)",
  "rgba(184, 255, 60, 0.5)",
  "transparent",
] as const;
