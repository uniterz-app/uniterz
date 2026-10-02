/**
 * MATCHUP 衝突スコア（三段）。
 * - myRank: 攻撃側の得意（1 = 最良）
 * - oppWeakRank: 守備側の穴（1 = 最良守備 → 大きいほど穴）
 *
 * Tier1 = 上位6 × 下位6 / Tier2 = 上位8 × 下位8 / Tier3 = 差最大
 */
/** Tier1: 攻撃 上位6 */
export const CLASH_ATTACK_MAX_RANK = 6;
/** Tier1: 守備穴 下位6（25–30） */
export const CLASH_OPP_SOFT_MIN_RANK = 25;

/** Tier2: 攻撃 上位8 */
export const CLASH_NEAR_ATTACK_MAX_RANK = 8;
/** Tier2: 守備穴 下位8（23–30） */
export const CLASH_NEAR_OPP_MIN_RANK = 23;

/** Tier3: 攻めがこれより悪いと clearest edge にしない */
export const CLASH_EDGE_ATTACK_MAX_RANK = 12;

/** 両側が帯に入っていれば十分（score ≥ 2 = 両方ちょうど端） */
export const CLASH_SCORE_MIN = 2;

/** 後方互換エイリアス */
export const CLASH_OPP_VULNERABLE_MIN_RANK = CLASH_OPP_SOFT_MIN_RANK;

export function clashScore(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): number {
  if (myRank == null || oppWeakRank == null) return 0;
  const myBoost = Math.max(0, 7 - myRank);
  const oppBoost = Math.max(0, oppWeakRank - 24);
  return myBoost + oppBoost;
}

/** Tier2 用（Tier1 より低く保つ） */
export function nearClashScore(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): number {
  if (myRank == null || oppWeakRank == null) return 0;
  const myBoost = Math.max(0, 9 - myRank);
  const oppBoost = Math.max(0, oppWeakRank - 22);
  return Math.max(0, myBoost + oppBoost - 2);
}

/** gap = oppWeakRank − myRank（大きいほど相対差） */
export function edgeGap(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): number {
  if (myRank == null || oppWeakRank == null) return -Infinity;
  return oppWeakRank - myRank;
}

/** Tier3 表示用スコア（常に Tier2 未満帯） */
export function edgeClashScore(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): number {
  const gap = edgeGap(myRank, oppWeakRank);
  if (!Number.isFinite(gap) || gap <= 0) return 0;
  return Math.min(6, Math.max(1, Math.floor(gap / 2)));
}

/** Tier1: 優秀 × 脆い */
export function isTrueClash(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): boolean {
  if (myRank == null || oppWeakRank == null) return false;
  if (myRank > CLASH_ATTACK_MAX_RANK) return false;
  if (oppWeakRank < CLASH_OPP_SOFT_MIN_RANK) return false;
  return clashScore(myRank, oppWeakRank) >= CLASH_SCORE_MIN;
}

/** Tier2: Tier1 ではない近接衝突 */
export function isNearClash(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): boolean {
  if (myRank == null || oppWeakRank == null) return false;
  if (isTrueClash(myRank, oppWeakRank)) return false;
  if (myRank > CLASH_NEAR_ATTACK_MAX_RANK) return false;
  if (oppWeakRank < CLASH_NEAR_OPP_MIN_RANK) return false;
  return nearClashScore(myRank, oppWeakRank) >= 1;
}

/** Tier3 候補になりうるか */
export function isEdgeClashCandidate(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): boolean {
  if (myRank == null || oppWeakRank == null) return false;
  if (myRank > CLASH_EDGE_ATTACK_MAX_RANK) return false;
  if (isTrueClash(myRank, oppWeakRank) || isNearClash(myRank, oppWeakRank)) {
    return false;
  }
  return edgeGap(myRank, oppWeakRank) > 0;
}

export type ClashTier = 1 | 2 | 3;

export function classifyClashTier(
  myRank: number | undefined,
  oppWeakRank: number | undefined
): ClashTier | null {
  if (isTrueClash(myRank, oppWeakRank)) return 1;
  if (isNearClash(myRank, oppWeakRank)) return 2;
  if (isEdgeClashCandidate(myRank, oppWeakRank)) return 3;
  return null;
}
