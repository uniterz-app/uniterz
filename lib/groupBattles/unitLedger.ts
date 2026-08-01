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
