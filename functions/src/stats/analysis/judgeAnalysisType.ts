// functions/src/stats/analysis/judgeAnalysisType.ts
import type { LevelSummary } from "./judgeLevel";
import type { AnalysisTypeId } from "./types";

/**
 * 分析タイプは勝率・投稿量・Upset・耐性の 4 軸のみで判定する（pointsV3 は含めない）。
 */
export function judgeAnalysisType(summary: LevelSummary): AnalysisTypeId {
  const { levels } = summary;
  const W = levels.winRate === "S";
  const V = levels.volume === "S";
  const U = levels.upset === "S";
  const T = levels.streak === "S";

  const sCount = [W, V, U, T].filter(Boolean).length;

  if (sCount === 4) {
    return "COMPLETE_PLAYER";
  }

  if (sCount === 3) {
    if (W && V && U) return "GIANT_SLAYER";
    if (W && U && T) return "GIANT_SLAYER";
    if (V && U && T) return "GIANT_SLAYER";
    if (W && V && T) return "SWISS_ARMY_KNIFE";
    return "PROSPECT";
  }

  if (sCount === 2) {
    if (W && V) return "WALKING_BUCKET";
    if (W && U) return "BIG_GAME_HUNTER";
    if (W && T) return "BULLDOG";
    if (V && U) return "CHAOS_RUNNER";
    if (V && T) return "SPARK_PLUG";
    if (U && T) return "SCRAPPER";
    return "PROSPECT";
  }

  if (sCount === 1) {
    if (W) return "FINISHER";
    if (V) return "HIGH_MOTOR";
    if (U) return "CHAOS_TAKER";
    if (T) return "IRON_MAN";
    return "PROSPECT";
  }

  return "PROSPECT";
}
