/**
 * グループバトル Unit 冪等付与。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { UNIT_LEDGER_COLLECTION } from "@/lib/groupBattles/constants";
import { canGrantUnits } from "@/lib/groupBattles/phases";
import {
  groupBattleUnitIdempotencyKey,
  unitReasonForPeriod,
  unitsForRank,
} from "@/lib/groupBattles/unitLedger";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";
import { getBattle, parseSnapshotDoc, snapshotRef } from "@/lib/groupBattles/server/firestore";

export type GrantResult = {
  granted: number;
  skipped: number;
};

export async function grantGroupBattleUnitsForSnapshot(
  db: Firestore,
  input: {
    battleId: string;
    period: GroupBattlePeriod;
    label: string;
  }
): Promise<GrantResult> {
  const battle = await getBattle(db, input.battleId);
  if (!battle) throw new Error("battle_not_found");
  if (!canGrantUnits(battle.phase) && battle.phase !== "settling") {
    // settling 中は final スナップのみ許可
  }

  const snap = await snapshotRef(
    db,
    input.battleId,
    input.period,
    input.label
  ).get();
  if (!snap.exists) throw new Error("snapshot_not_found");
  const snapshot = parseSnapshotDoc(
    snap.id,
    snap.data() as Record<string, unknown>
  );
  if (snapshot.status !== "final") {
    return { granted: 0, skipped: 0 };
  }

  const table =
    input.period === "weekly"
      ? battle.unitRewards.weekly
      : battle.unitRewards.monthly;

  let granted = 0;
  let skipped = 0;
  const reason = unitReasonForPeriod(input.period);

  for (const row of snapshot.rows) {
    if (row.rank > table.maxRank) continue;
    const amount = unitsForRank(table.unitsPerMemberByRank, row.rank);
    if (amount == null) continue;

    for (const member of row.memberScores) {
      const key = groupBattleUnitIdempotencyKey({
        battleId: input.battleId,
        period: input.period,
        label: input.label,
        rank: row.rank,
        uid: member.uid,
      });
      const ledgerRef = db.collection(UNIT_LEDGER_COLLECTION).doc(key);
      const userRef = db.collection("users").doc(member.uid);

      const didGrant = await db.runTransaction(async (tx) => {
        const existing = await tx.get(ledgerRef);
        if (existing.exists) return false;
        tx.set(ledgerRef, {
          uid: member.uid,
          amount,
          reason,
          idempotencyKey: key,
          battleId: input.battleId,
          period: input.period,
          label: input.label,
          rank: row.rank,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(
          userRef,
          {
            unitBalance: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return true;
      });

      if (didGrant) granted += 1;
      else skipped += 1;
    }
  }

  return { granted, skipped };
}
