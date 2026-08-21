/**
 * Unit 台帳の冪等キー。
 * 正: docs/group-battle-tech-design.md §4.6
 */

import type { GroupBattlePeriod, UnitLedgerReason } from "./types";

export function groupBattleUnitIdempotencyKey(input: {
  battleId: string;
  period: GroupBattlePeriod;
  label: string;
  rank: number;
  uid: string;
}): string {
  return `gb:${input.battleId}:${input.period}:${input.label}:rank${input.rank}:uid${input.uid}`;
}

export function unitReasonForPeriod(
  period: GroupBattlePeriod
): UnitLedgerReason {
  return period === "weekly"
    ? "group_battle_weekly"
    : "group_battle_monthly";
}

export function unitsForRank(
  unitsPerMemberByRank: readonly number[],
  rank: number
): number | null {
  if (rank < 1) return null;
  const amount = unitsPerMemberByRank[rank - 1];
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/**
 * 推奨配布表（docs/unit-reward-design.md §4）。
 * 開催ごとの `unitRewards` が空のときの推定表示に使う。
 */
export const GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER = [
  30, 25, 20, 16, 14, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3, 2,
] as const;

export const GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER = [
  100, 80, 64, 50, 42, 36, 30, 26, 22, 20, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5,
] as const;

/** いまの順位で、メンバー1人あたりの推定 Unit（確定前） */
export function estimatedGroupBattleUnitsPerMember(
  period: GroupBattlePeriod,
  rank: number,
  table?: readonly number[] | null
): number | null {
  const fallback =
    period === "weekly"
      ? GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER
      : GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER;
  const used = table && table.length > 0 ? table : fallback;
  return unitsForRank(used, rank);
}
