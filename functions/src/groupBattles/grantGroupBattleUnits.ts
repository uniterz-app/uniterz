/**
 * グループバトル Unit 冪等付与（Cloud Functions）。
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { admin } from "../firebase";

function unitsForRank(table: number[], rank: number): number | null {
  if (rank < 1) return null;
  const amount = table[rank - 1];
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export async function grantGroupBattleUnits(input: {
  battleId: string;
  period: "weekly" | "monthly";
  label: string;
}): Promise<{ granted: number; skipped: number }> {
  const db = getFirestore(admin.app());
  const battleSnap = await db.collection("group_battles").doc(input.battleId).get();
  if (!battleSnap.exists) throw new Error("battle_not_found");
  const battle = battleSnap.data()!;

  const snapId = `${input.battleId}_${input.period}_${input.label}`;
  const snap = await db.collection("group_battle_period_snapshots").doc(snapId).get();
  if (!snap.exists) throw new Error("snapshot_not_found");
  const snapshot = snap.data()!;
  if (snapshot.status !== "final") return { granted: 0, skipped: 0 };

  const rewards = (battle.unitRewards ?? {}) as {
    weekly?: { maxRank?: number; unitsPerMemberByRank?: number[] };
    monthly?: { maxRank?: number; unitsPerMemberByRank?: number[] };
  };
  const table =
    input.period === "weekly"
      ? rewards.weekly?.unitsPerMemberByRank ?? []
      : rewards.monthly?.unitsPerMemberByRank ?? [];
  const maxRank =
    input.period === "weekly"
      ? Number(rewards.weekly?.maxRank ?? 0)
      : Number(rewards.monthly?.maxRank ?? 0);

  const reason =
    input.period === "weekly"
      ? "group_battle_weekly"
      : "group_battle_monthly";

  let granted = 0;
  let skipped = 0;
  const rows = (snapshot.rows as Array<{
    rank: number;
    memberScores: Array<{ uid: string }>;
  }>) ?? [];

  for (const row of rows) {
    if (row.rank > maxRank) continue;
    const amount = unitsForRank(table, row.rank);
    if (amount == null) continue;
    for (const member of row.memberScores ?? []) {
      const key = `gb:${input.battleId}:${input.period}:${input.label}:rank${row.rank}:uid${member.uid}`;
      const ledgerRef = db.collection("unit_ledger").doc(key);
      const userRef = db.collection("users").doc(member.uid);
      const did = await db.runTransaction(async (tx) => {
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
      if (did) {
        granted += 1;
        try {
          const { syncUserCareerGroupBattleRank, syncUserCareerUnitsEarned } =
            await import("../profile/syncUserCareer");
          await syncUserCareerUnitsEarned(member.uid, amount);
          await syncUserCareerGroupBattleRank({
            uid: member.uid,
            battleId: input.battleId,
            period: input.period,
            label: input.label,
            rank: row.rank,
          });
        } catch (err) {
          console.warn("[grantGroupBattleUnits] career sync failed", err);
        }
      } else skipped += 1;
    }
  }

  return { granted, skipped };
}

/** final スナップを走査して未付与分を付与 */
export async function grantAllFinalGroupBattleUnits(): Promise<number> {
  const db = getFirestore(admin.app());
  const snap = await db
    .collection("group_battle_period_snapshots")
    .where("status", "==", "final")
    .limit(50)
    .get();

  let total = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const result = await grantGroupBattleUnits({
      battleId: String(d.battleId),
      period: d.period === "monthly" ? "monthly" : "weekly",
      label: String(d.label),
    });
    total += result.granted;
  }
  console.log(`[grantAllFinalGroupBattleUnits] granted=${total}`);
  return total;
}
