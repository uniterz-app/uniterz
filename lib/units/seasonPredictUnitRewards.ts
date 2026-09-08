/**
 * シーズン予想（順位 / アワード）Unit 配布表。
 * 設計: シーズン終了後・別ランキング・上位 20・1位 200（上位厚め、全体 2 倍はしない）。
 * 付与ジョブはゲート D（採点確定後）で実装。
 */

/** 各ランキングの付与対象人数 */
export const SEASON_PREDICT_UNIT_MAX_RANK = 20;

/**
 * 順位予想ランキング / アワード予想ランキングで共通。
 * index 0 = 1位。同点同順位のときは同額（既存ランキング Unit と同じ）。
 */
export const SEASON_PREDICT_UNITS_BY_RANK: readonly number[] = [
  200, // 1
  150, // 2
  120, // 3
  100, // 4
  90, // 5
  80, // 6
  72, // 7
  64, // 8
  56, // 9
  50, // 10
  44, // 11
  40, // 12
  36, // 13
  32, // 14
  28, // 15
  24, // 16
  20, // 17
  16, // 18
  12, // 19
  10, // 20
] as const;

export type SeasonPredictUnitRankingKind = "standings" | "awards";

/** 1-based rank → Unit。範囲外は 0 */
export function seasonPredictUnitsForRank(rank: number): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > SEASON_PREDICT_UNIT_MAX_RANK) {
    return 0;
  }
  return SEASON_PREDICT_UNITS_BY_RANK[rank - 1] ?? 0;
}

/** 1 ランキングあたりの合計（参考・監査用） */
export const SEASON_PREDICT_UNITS_POOL_PER_RANKING =
  SEASON_PREDICT_UNITS_BY_RANK.reduce((a, b) => a + b, 0);
