/**
 * スケジュールに応じた大会フェーズ自動進行。
 */

import type { Firestore } from "firebase-admin/firestore";
import { GROUP_BATTLE_COLLECTION } from "@/lib/groupBattles/constants";
import { setGroupBattlePhase } from "@/lib/groupBattles/server/setPhase";
import { parseBattleDoc } from "@/lib/groupBattles/server/firestore";

export type AdvanceDuePhasesResult = {
  advanced: Array<{ battleId: string; from: string; to: string }>;
  errors: Array<{ battleId: string; error: string }>;
};

/**
 * - announced → recruiting（recruitStart 到達）
 * - recruiting → battle（recruitEnd 到達、ロック込み）
 * - battle → settling（battleEnd 到達）
 */
export async function advanceDueGroupBattlePhases(
  db: Firestore,
  nowMs: number = Date.now()
): Promise<AdvanceDuePhasesResult> {
  const advanced: AdvanceDuePhasesResult["advanced"] = [];
  const errors: AdvanceDuePhasesResult["errors"] = [];

  const snap = await db.collection(GROUP_BATTLE_COLLECTION).limit(80).get();
  const battles = snap.docs.map((d) =>
    parseBattleDoc(d.id, d.data() as Record<string, unknown>)
  );

  for (const battle of battles) {
    try {
      if (
        battle.phase === "announced" &&
        battle.recruitStartAtMs > 0 &&
        nowMs >= battle.recruitStartAtMs
      ) {
        const res = await setGroupBattlePhase(db, battle.id, "recruiting");
        if (res.ok) {
          advanced.push({
            battleId: battle.id,
            from: "announced",
            to: res.phase,
          });
        } else {
          errors.push({ battleId: battle.id, error: res.error });
        }
        continue;
      }

      if (
        battle.phase === "recruiting" &&
        battle.recruitEndAtMs > 0 &&
        nowMs >= battle.recruitEndAtMs
      ) {
        const res = await setGroupBattlePhase(db, battle.id, "battle");
        if (res.ok) {
          advanced.push({
            battleId: battle.id,
            from: "recruiting",
            to: res.phase,
          });
        } else {
          errors.push({ battleId: battle.id, error: res.error });
        }
        continue;
      }

      if (
        battle.phase === "battle" &&
        battle.battleEndAtMs > 0 &&
        nowMs >= battle.battleEndAtMs
      ) {
        const res = await setGroupBattlePhase(db, battle.id, "settling");
        if (res.ok) {
          advanced.push({
            battleId: battle.id,
            from: "battle",
            to: res.phase,
          });
        } else {
          errors.push({ battleId: battle.id, error: res.error });
        }
      }
    } catch (e) {
      errors.push({
        battleId: battle.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { advanced, errors };
}
