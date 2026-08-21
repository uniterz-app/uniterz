/**
 * 大会フェーズ遷移（運営）。許可された遷移のみ。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { GroupBattlePhase } from "@/lib/groupBattles/types";
import {
  battleRef,
  getBattle,
  lockEligibleSquads,
} from "@/lib/groupBattles/server/firestore";

const ALLOWED: Record<GroupBattlePhase, GroupBattlePhase[]> = {
  announced: ["recruiting"],
  recruiting: ["locking"],
  locking: ["battle"],
  battle: ["settling"],
  settling: ["final"],
  final: ["closed"],
  closed: [],
};

export function canTransitionPhase(
  from: GroupBattlePhase,
  to: GroupBattlePhase
): boolean {
  return ALLOWED[from]?.includes(to) === true;
}

export async function setGroupBattlePhase(
  db: Firestore,
  battleId: string,
  next: GroupBattlePhase
): Promise<
  | { ok: true; phase: GroupBattlePhase; lock?: Awaited<ReturnType<typeof lockEligibleSquads>> }
  | { ok: false; error: string; status?: number }
> {
  const battle = await getBattle(db, battleId);
  if (!battle) return { ok: false, error: "not_found", status: 404 };

  if (next === "locking" || (battle.phase === "recruiting" && next === "battle")) {
    // 募集締切 → ロック一式（locking 経由で battle まで）
    if (battle.phase !== "recruiting" && battle.phase !== "locking") {
      return { ok: false, error: "invalid_phase", status: 409 };
    }
    await battleRef(db, battleId).update({
      phase: "locking",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const lock = await lockEligibleSquads(db, battleId);
    return { ok: true, phase: "battle", lock };
  }

  if (!canTransitionPhase(battle.phase, next)) {
    return { ok: false, error: "invalid_transition", status: 409 };
  }

  await battleRef(db, battleId).update({
    phase: next,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, phase: next };
}
