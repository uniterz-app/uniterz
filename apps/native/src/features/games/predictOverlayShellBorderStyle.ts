import type { ResultCardBadge } from "../../../../../lib/result/resultGlass";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";
import {
  resultStreakBorderSweepVariant,
  type ResultFrameBorderSweepVariant,
} from "../../../../../lib/result/resultFrameBorderSweep";
import { nativeStreakFrameColors } from "../results/resultCyberFrameNativeTokens";
import { RESULT_CYBER_FRAME_STROKE_WIDTH } from "../results/resultCyberFrameNativeMetrics";

/** Web `.predict-overlay-cyber-card` 既定 border */
export const PREDICT_OVERLAY_SHELL_BORDER_DEFAULT = "rgba(0,245,255,0.2)";

export function hasPredictOverlayResultCyberFrame(
  badge: ResultCardBadge | null | undefined
): boolean {
  return (
    badge === "hit" ||
    badge === "perfect" ||
    badge === "streak" ||
    badge === "upset"
  );
}

/** 結果バッジに応じた外シェル枠色（Web 内枠 `frameBorder` / stroke 相当） */
export function predictOverlayShellBorderColor(
  badge: ResultCardBadge | null | undefined,
  activeWinStreak: unknown
): string {
  if (badge === "perfect") return "rgba(167,139,250,0.8)";
  if (badge === "hit") return "rgba(250,204,21,0.76)";
  if (badge === "upset") return "rgba(248,113,113,0.84)";
  if (badge === "streak") {
    const tier = resultStreakTier(activeWinStreak);
    if (tier) return nativeStreakFrameColors(tier).stroke;
  }
  return PREDICT_OVERLAY_SHELL_BORDER_DEFAULT;
}

/** 結果枠あり時は `RESULT_CYBER_FRAME_STROKE_WIDTH` */
export function predictOverlayShellBorderWidth(
  badge: ResultCardBadge | null | undefined
): number {
  return hasPredictOverlayResultCyberFrame(badge) ? RESULT_CYBER_FRAME_STROKE_WIDTH : 1;
}

/** Predict オーバーレイで枠を走る走査光（Web `ResultStreakCyberFrame` / `ResultPerfectCyberFrame`） */
export function predictOverlayShellSweepVariant(
  badge: ResultCardBadge | null | undefined,
  activeWinStreak: unknown
): ResultFrameBorderSweepVariant | null {
  if (badge === "perfect") return "perfect";
  if (badge === "upset") return "upset";
  if (badge === "streak") {
    const tier = resultStreakTier(activeWinStreak);
    if (tier) return resultStreakBorderSweepVariant(tier);
  }
  return null;
}
