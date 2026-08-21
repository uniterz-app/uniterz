/**
 * オーナーによるスクワッド解散（募集中のみ）。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  assertRecruitingOrThrow,
  getBattle,
  joinRequestsCol,
  parseSquadDoc,
  squadMembersCol,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";

export async function dissolveSquad(
  db: Firestore,
  battleId: string,
  squadId: string,
  uid: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const battle = await getBattle(db, battleId);
  if (!battle) return { ok: false, error: "not_found", status: 404 };
  try {
    assertRecruitingOrThrow(battle.phase);
  } catch {
    return { ok: false, error: "phase_locked", status: 409 };
  }

  const squadRef = squadsCol(db, battleId).doc(squadId);
  const snap = await squadRef.get();
  if (!snap.exists) return { ok: false, error: "squad_not_found", status: 404 };
  const squad = parseSquadDoc(snap.id, snap.data() as Record<string, unknown>);
  if (squad.ownerUid !== uid) return { ok: false, error: "forbidden", status: 403 };
  if (squad.status !== "forming" && squad.status !== "entered") {
    return { ok: false, error: "not_dissolvable", status: 409 };
  }

  const pending = await joinRequestsCol(db, battleId)
    .where("squadId", "==", squadId)
    .where("status", "==", "pending")
    .get();

  const batch = db.batch();
  for (const doc of pending.docs) {
    batch.update(doc.ref, {
      status: "cancelled",
      resolvedAt: FieldValue.serverTimestamp(),
    });
  }
  for (const memberUid of squad.memberUids) {
    batch.delete(squadMembersCol(db, battleId).doc(memberUid));
  }
  batch.update(squadRef, {
    memberUids: [],
    memberCount: 0,
    status: "disbanded",
    inviteCodeHash: null,
    inviteCodePlain: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { ok: true };
}
