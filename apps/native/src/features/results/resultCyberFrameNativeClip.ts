import {
  chamferedRectPathD,
  PREDICT_OVERLAY_CYBER_CUT,
} from "../games/matchListCyberClipPath";
import { RESULT_HIT_CYBER_CLIP_CUT } from "./resultHitCyberClipPath";
import type { ResultCyberFrameClipShape } from "./ResultCyberFrameBorderSweepNative";

/** 結果サイバー枠の描画コンテキスト */
export type ResultCyberFrameShellContext = "default" | "predictOverlay";

export function resultCyberFrameShellContextCut(
  context: ResultCyberFrameShellContext
): number {
  return context === "predictOverlay"
    ? PREDICT_OVERLAY_CYBER_CUT
    : RESULT_HIT_CYBER_CLIP_CUT;
}

export function resultCyberFrameShellClipShape(
  _context: ResultCyberFrameShellContext
): ResultCyberFrameClipShape {
  /** リザルト枠は四隅 chamfer（左上・右下の直角を出さない） */
  return "chamfer";
}

/** 枠線パス — オーバーレイは外シェル border に任せて null */
export function resultCyberFrameStrokePathD(
  width: number,
  height: number,
  context: ResultCyberFrameShellContext
): string | null {
  if (context === "predictOverlay") return null;
  return chamferedRectPathD(width, height, RESULT_HIT_CYBER_CLIP_CUT);
}

/** グロー clip 用 — 四隅 chamfer */
export function resultCyberFrameGlowClipPathD(
  width: number,
  height: number,
  context: ResultCyberFrameShellContext
): string {
  const cut = resultCyberFrameShellContextCut(context);
  return chamferedRectPathD(width, height, cut);
}
