import type { GroupBattlePhase } from "./types";

/** メンバー参加・脱退・入れ替えが許可される大会フェーズ */
export function canMutateSquadMembers(phase: GroupBattlePhase): boolean {
  return phase === "recruiting";
}

/** ランキング暫定更新の対象フェーズ */
export function canBuildLiveSnapshots(phase: GroupBattlePhase): boolean {
  return (
    phase === "battle" ||
    phase === "settling" ||
    phase === "final"
  );
}

/**
 * Unit 付与可能なフェーズ。
 * 週間スナップは battle 中に final 化するため CF と同様 battle/settling も許可。
 */
export function canGrantUnits(phase: GroupBattlePhase): boolean {
  return (
    phase === "battle" ||
    phase === "settling" ||
    phase === "final" ||
    phase === "closed"
  );
}

export function isRecruitingPhase(phase: GroupBattlePhase): boolean {
  return phase === "recruiting";
}
