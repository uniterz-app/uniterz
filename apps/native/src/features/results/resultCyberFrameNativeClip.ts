import {
  chamferedRectPathD,
  PREDICT_OVERLAY_CYBER_CUT,
} from "../games/matchListCyberClipPath";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  resultHitCyberClipPathD,
} from "./resultHitCyberClipPath";
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
  context: ResultCyberFrameShellContext
): ResultCyberFrameClipShape {
  /** Predict オーバーレイは `.predict-overlay-cyber-card` の 8 角 chamfer */
  return context === "predictOverlay" ? "chamfer" : "hit";
}

/** 枠線パス — オーバーレイは外シェル border に任せて null */
export function resultCyberFrameStrokePathD(
  width: number,
  height: number,
  context: ResultCyberFrameShellContext
): string | null {
  if (context === "predictOverlay") return null;
  return resultHitCyberClipPathD(width, height);
}

/** グロー clip 用 — オーバーレイは 8 角 chamfer */
export function resultCyberFrameGlowClipPathD(
  width: number,
  height: number,
  context: ResultCyberFrameShellContext
): string {
  const cut = resultCyberFrameShellContextCut(context);
  if (context === "predictOverlay") {
    return chamferedRectPathD(width, height, cut);
  }
  return resultHitCyberClipPathD(width, height, cut);
}
