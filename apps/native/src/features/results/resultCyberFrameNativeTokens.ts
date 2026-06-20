import type { ResultStreakTier } from "../../../../../lib/result/resultGlass";

/** Web `resultStreakFrameTokens` の RN 描画用 */
export function nativeStreakFrameColors(tier: ResultStreakTier) {
  if (tier === "gold") {
    return {
      stroke: "rgba(251,191,36,0.88)",
      corner: "rgba(252,211,77,0.92)",
      shadow: "rgba(251,191,36,0.48)",
      topLine: [
        "transparent",
        "rgba(255,255,255,0.92)",
        "rgba(253,224,71,0.95)",
        "transparent",
      ] as const,
      topGlow: [
        "rgba(251,191,36,0.2)",
        "rgba(249,115,22,0.1)",
        "transparent",
      ] as const,
    };
  }
  if (tier === "platinum") {
    return {
      stroke: "rgba(34,211,238,0.86)",
      corner: "rgba(103,232,249,0.9)",
      shadow: "rgba(34,211,238,0.44)",
      topLine: [
        "transparent",
        "rgba(255,255,255,0.9)",
        "rgba(125,211,252,0.95)",
        "transparent",
      ] as const,
      topGlow: [
        "rgba(34,211,238,0.18)",
        "rgba(8,145,178,0.1)",
        "transparent",
      ] as const,
    };
  }
  return {
    stroke: "rgba(203,213,225,0.82)",
    corner: "rgba(226,232,240,0.88)",
    shadow: "rgba(148,163,184,0.38)",
    topLine: [
      "transparent",
      "rgba(255,255,255,0.88)",
      "rgba(226,232,240,0.92)",
      "transparent",
    ] as const,
    topGlow: [
      "rgba(148,163,184,0.16)",
      "rgba(71,85,105,0.08)",
      "transparent",
    ] as const,
  };
}
