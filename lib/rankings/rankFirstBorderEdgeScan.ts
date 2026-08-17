/** 1位行 — 旧エッジ光を枠一周で流す */

export const RANK_FIRST_LOOP_DURATION_MS = 3600;
/** 横ビーム幅（枠幅に対する比率）— 旧 EDGE SCAN と同じ */
export const RANK_FIRST_EDGE_H_BEAM_RATIO = 0.38;
/** 縦ビーム高さ比率 — 旧 EDGE SCAN と同じ */
export const RANK_FIRST_EDGE_V_BEAM_RATIO = 0.34;
/** 角で横・縦ビームが重なる距離 */
export const RANK_FIRST_LOOP_CORNER_BLEND = 42;

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

export type RankFirstLoopBeam = { pos: number; opacity: number };

export type RankFirstLoopBeams = {
  top: RankFirstLoopBeam;
  right: RankFirstLoopBeam;
  bottom: RankFirstLoopBeam;
  left: RankFirstLoopBeam;
};

function edgeBeam(
  d: number,
  peri: number,
  start: number,
  len: number,
  blend: number,
  reverse: boolean
): RankFirstLoopBeam {
  let best: RankFirstLoopBeam = { pos: 0, opacity: 0 };
  for (const shift of [-peri, 0, peri]) {
    const local = d + shift - start;
    if (local < -blend || local > len + blend) continue;
    const clamped = Math.max(0, Math.min(len, local));
    const pos = reverse ? len - clamped : clamped;
    let opacity = 1;
    if (local < 0) opacity = 1 + local / blend;
    else if (local > len) opacity = 1 - (local - len) / blend;
    opacity = Math.max(0, Math.min(1, opacity));
    if (opacity > best.opacity) best = { pos, opacity };
  }
  return best;
}

/** 各辺の光線位置。角では横・縦が重なって曲がる */
export function rankFirstLoopBeams(
  progress: number,
  width: number,
  height: number
): RankFirstLoopBeams {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const peri = 2 * (w + h);
  const d = (((progress % 1) + 1) % 1) * peri;
  const blend = Math.min(RANK_FIRST_LOOP_CORNER_BLEND, h * 0.55, w * 0.14);
  return {
    top: edgeBeam(d, peri, 0, w, blend, false),
    right: edgeBeam(d, peri, w, h, blend, false),
    bottom: edgeBeam(d, peri, w + h, w, blend, true),
    left: edgeBeam(d, peri, 2 * w + h, h, blend, true),
  };
}
