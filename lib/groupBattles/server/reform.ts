/**
 * 過去スクワッドからの一括再招集（下書き作成 + 招待）。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/communities/inviteCode";
import {
  battleRef,
  getMembership,
  sanitizeSquadName,
  squadMembersCol,
  squadsCol,
  cancelPendingJoinRequestsTx,
  getPendingJoinRequestsTx,
} from "@/lib/groupBattles/server/firestore";
import { createSquadInvitesBulk } from "@/lib/groupBattles/server/invites";
import { loadSourcePastSquad } from "@/lib/groupBattles/server/pastSquads";

export async function reformSquadFromPast(params: {
  db: Firestore;
  battleId: string;
  uid: string;
  sourceBattleId: string;
  sourceSquadId: string;
  nameRaw?: unknown;
}): Promise<{
  squadId: string;
  inviteCode: string;
  invited: string[];
  skipped: Array<{ uid: string; reason: string }>;
}> {
  const { db, battleId, uid, sourceBattleId, sourceSquadId, nameRaw } = params;

  const existing = await getMembership(db, battleId, uid);
  if (existing) throw new Error("already_in_squad");

  const source = await loadSourcePastSquad(
    db,
    uid,
    sourceBattleId,
    sourceSquadId
  );
  if (!source.ok) throw new Error(source.reason);
  if (source.role !== "owner") throw new Error("owner_required");

  const name =
    sanitizeSquadName(nameRaw) ??
    sanitizeSquadName(source.squad.name) ??
    null;
  if (!name) throw new Error("invalid_name");

  let invitePlain = "";
  let hash = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    invitePlain = generateInviteCode();
    hash = hashInviteCode(invitePlain);
    const clash = await squadsCol(db, battleId)
      .where("inviteCodeHash", "==", hash)
      .limit(1)
      .get();
    if (clash.empty) break;
    invitePlain = "";
  }
  if (!invitePlain) throw new Error("invite_code_exhausted");

  const squadRef = squadsCol(db, battleId).doc();
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const memRef = squadMembersCol(db, battleId).doc(uid);
    const memSnap = await tx.get(memRef);
    if (memSnap.exists) throw new Error("already_in_squad");

    const pendingSnap = await getPendingJoinRequestsTx(
      tx,
      db,
      battleId,
      uid
    );

    tx.set(squadRef, {
      name,
      ownerUid: uid,
      memberUids: [uid],
      memberCount: 1,
      status: "forming",
      inviteCodeHash: hash,
      inviteCodeLast4: invitePlain.slice(-4),
      inviteCodePlain: invitePlain,
      rulesAcceptedAt: now,
      rulesAcceptedByUid: uid,
      reformedFromBattleId: sourceBattleId,
      reformedFromSquadId: sourceSquadId,
      createdAt: now,
      updatedAt: now,
    });
    tx.set(memRef, {
      squadId: squadRef.id,
      role: "owner",
      joinedAt: now,
    });
    tx.set(battleRef(db, battleId), { updatedAt: now }, { merge: true });
    cancelPendingJoinRequestsTx(tx, pendingSnap);
  });

  const targets = source.memberUids.filter((m) => m !== uid);
  const { created, skipped } = await createSquadInvitesBulk({
    db,
    battleId,
    squadId: squadRef.id,
    fromUid: uid,
    targetUids: targets,
    source: "reform",
    sourceBattleId,
    sourceSquadId,
  });

  return {
    squadId: squadRef.id,
    inviteCode: invitePlain,
    invited: created,
    skipped,
  };
}
