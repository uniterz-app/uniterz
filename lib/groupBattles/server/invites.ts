/**
 * スクワッド招待（再招集・個別）。相手の自動加入はしない。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  GROUP_BATTLE_INVITE_MAX_PER_TARGET,
  GROUP_BATTLE_MAX_MEMBERS,
} from "@/lib/groupBattles/constants";
import {
  deriveSquadStatusAfterMemberChange,
  parseSquadDoc,
  parseSquadInvite,
  squadInvitesCol,
  squadMembersCol,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { isInviteeEligible } from "@/lib/groupBattles/server/pastSquads";
import type {
  GroupBattleSquadInviteDoc,
  GroupBattleSquadInviteSource,
} from "@/lib/groupBattles/types";

export async function countInvitesToTarget(
  db: Firestore,
  battleId: string,
  toUid: string
): Promise<number> {
  const snap = await squadInvitesCol(db, battleId)
    .where("toUid", "==", toUid)
    .get();
  return snap.size;
}

export async function hasPendingInvite(
  db: Firestore,
  battleId: string,
  squadId: string,
  toUid: string
): Promise<boolean> {
  const snap = await squadInvitesCol(db, battleId)
    .where("toUid", "==", toUid)
    .where("squadId", "==", squadId)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  return !snap.empty;
}

export type InviteCreateResult =
  | { status: "created"; inviteId: string }
  | { status: "skipped"; reason: string };

export async function createSquadInvite(params: {
  db: Firestore;
  battleId: string;
  squadId: string;
  fromUid: string;
  toUid: string;
  source: GroupBattleSquadInviteSource;
  sourceBattleId?: string | null;
  sourceSquadId?: string | null;
}): Promise<InviteCreateResult> {
  const {
    db,
    battleId,
    squadId,
    fromUid,
    toUid,
    source,
    sourceBattleId = null,
    sourceSquadId = null,
  } = params;

  if (toUid === fromUid) {
    return { status: "skipped", reason: "self" };
  }

  const eligible = await isInviteeEligible(db, battleId, toUid);
  if (!eligible.ok) {
    return { status: "skipped", reason: eligible.reason };
  }

  const sent = await countInvitesToTarget(db, battleId, toUid);
  if (sent >= GROUP_BATTLE_INVITE_MAX_PER_TARGET) {
    return { status: "skipped", reason: "invite_limit" };
  }

  if (await hasPendingInvite(db, battleId, squadId, toUid)) {
    return { status: "skipped", reason: "already_pending" };
  }

  const ref = squadInvitesCol(db, battleId).doc();
  await ref.set({
    squadId,
    fromUid,
    toUid,
    status: "pending",
    source,
    sourceBattleId,
    sourceSquadId,
    createdAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
  });

  return { status: "created", inviteId: ref.id };
}

export async function createSquadInvitesBulk(params: {
  db: Firestore;
  battleId: string;
  squadId: string;
  fromUid: string;
  targetUids: string[];
  source: GroupBattleSquadInviteSource;
  sourceBattleId?: string | null;
  sourceSquadId?: string | null;
}): Promise<{
  created: string[];
  skipped: Array<{ uid: string; reason: string }>;
}> {
  const created: string[] = [];
  const skipped: Array<{ uid: string; reason: string }> = [];
  for (const toUid of params.targetUids) {
    const r = await createSquadInvite({
      ...params,
      toUid,
    });
    if (r.status === "created") created.push(r.inviteId);
    else skipped.push({ uid: toUid, reason: r.reason });
  }
  return { created, skipped };
}

export async function listIncomingPendingInvites(
  db: Firestore,
  battleId: string,
  uid: string
): Promise<
  Array<
    GroupBattleSquadInviteDoc & {
      id: string;
      squadName: string;
      fromDisplayName: string;
    }
  >
> {
  const snap = await squadInvitesCol(db, battleId)
    .where("toUid", "==", uid)
    .where("status", "==", "pending")
    .get();

  const items: Array<
    GroupBattleSquadInviteDoc & {
      id: string;
      squadName: string;
      fromDisplayName: string;
    }
  > = [];

  for (const doc of snap.docs) {
    const invite = parseSquadInvite(
      doc.id,
      doc.data() as Record<string, unknown>
    );
    const squadSnap = await squadsCol(db, battleId).doc(invite.squadId).get();
    const squadName = squadSnap.exists
      ? String((squadSnap.data() as { name?: string })?.name ?? "")
      : "";
    const fromSnap = await db.collection("users").doc(invite.fromUid).get();
    const fromDisplayName =
      fromSnap.exists &&
      typeof (fromSnap.data() as { displayName?: string })?.displayName ===
        "string"
        ? String(
            (fromSnap.data() as { displayName?: string }).displayName
          ).trim() || "User"
        : "User";
    items.push({ ...invite, squadName, fromDisplayName });
  }

  items.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return items;
}

export async function acceptSquadInvite(params: {
  db: Firestore;
  battleId: string;
  inviteId: string;
  uid: string;
}): Promise<void> {
  const { db, battleId, inviteId, uid } = params;
  const inviteRef = squadInvitesCol(db, battleId).doc(inviteId);

  await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new Error("invite_not_found");
    const invite = parseSquadInvite(
      inviteSnap.id,
      inviteSnap.data() as Record<string, unknown>
    );
    if (invite.toUid !== uid) throw new Error("forbidden");
    if (invite.status !== "pending") throw new Error("not_pending");

    const memRef = squadMembersCol(db, battleId).doc(uid);
    const memSnap = await tx.get(memRef);
    if (memSnap.exists) throw new Error("already_in_squad");

    const squadRef = squadsCol(db, battleId).doc(invite.squadId);
    const squadSnap = await tx.get(squadRef);
    if (!squadSnap.exists) throw new Error("squad_not_found");
    const squad = parseSquadDoc(
      squadSnap.id,
      squadSnap.data() as Record<string, unknown>
    );
    if (squad.memberCount >= GROUP_BATTLE_MAX_MEMBERS) {
      throw new Error("squad_full");
    }
    if (squad.status !== "forming" && squad.status !== "entered") {
      throw new Error("squad_not_open");
    }

    const memberUids = [...squad.memberUids, uid];
    const memberCount = memberUids.length;
    const status = deriveSquadStatusAfterMemberChange(
      memberCount,
      Boolean(squad.rulesAcceptedAtMs)
    );

    tx.update(squadRef, {
      memberUids,
      memberCount,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(memRef, {
      squadId: invite.squadId,
      role: "member",
      joinedAt: FieldValue.serverTimestamp(),
    });
    tx.update(inviteRef, {
      status: "accepted",
      resolvedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function declineSquadInvite(params: {
  db: Firestore;
  battleId: string;
  inviteId: string;
  uid: string;
}): Promise<void> {
  const { db, battleId, inviteId, uid } = params;
  const inviteRef = squadInvitesCol(db, battleId).doc(inviteId);
  const snap = await inviteRef.get();
  if (!snap.exists) throw new Error("invite_not_found");
  const invite = parseSquadInvite(snap.id, snap.data() as Record<string, unknown>);
  if (invite.toUid !== uid) throw new Error("forbidden");
  if (invite.status !== "pending") throw new Error("not_pending");
  await inviteRef.update({
    status: "declined",
    resolvedAt: FieldValue.serverTimestamp(),
  });
}
