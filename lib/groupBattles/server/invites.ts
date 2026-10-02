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
  cancelPendingJoinRequestsTx,
  getPendingJoinRequestsTx,
} from "@/lib/groupBattles/server/firestore";
import {
  isInviteeEligible,
  loadUserMemberSummaries,
} from "@/lib/groupBattles/server/pastSquads";
import type {
  GroupBattlePastMemberSummary,
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

export type IncomingPendingInviteItem = GroupBattleSquadInviteDoc & {
  id: string;
  squadName: string;
  fromDisplayName: string;
  members: GroupBattlePastMemberSummary[];
  openSlots: number;
};

export async function listIncomingPendingInvites(
  db: Firestore,
  battleId: string,
  uid: string
): Promise<IncomingPendingInviteItem[]> {
  const snap = await squadInvitesCol(db, battleId)
    .where("toUid", "==", uid)
    .where("status", "==", "pending")
    .get();

  if (snap.empty) return [];

  const invites = snap.docs.map((doc) =>
    parseSquadInvite(doc.id, doc.data() as Record<string, unknown>)
  );

  const squadIds = [...new Set(invites.map((i) => i.squadId).filter(Boolean))];
  const squadSnaps = await Promise.all(
    squadIds.map((id) => squadsCol(db, battleId).doc(id).get())
  );
  const squadById = new Map(
    squadSnaps.map((s, i) => {
      const id = squadIds[i]!;
      if (!s.exists) {
        return [id, null] as const;
      }
      return [
        id,
        parseSquadDoc(s.id, s.data() as Record<string, unknown>),
      ] as const;
    })
  );

  const allMemberUids = [
    ...new Set(
      [...squadById.values()].flatMap((s) => (s ? s.memberUids : []))
    ),
  ];
  const fromUids = [...new Set(invites.map((i) => i.fromUid).filter(Boolean))];
  const profileUids = [...new Set([...allMemberUids, ...fromUids])];
  const summaries = await loadUserMemberSummaries(db, profileUids);
  const summaryByUid = new Map(summaries.map((m) => [m.uid, m]));

  const items: IncomingPendingInviteItem[] = invites.map((invite) => {
    const squad = squadById.get(invite.squadId) ?? null;
    const members = (squad?.memberUids ?? [])
      .map((memberUid) => summaryByUid.get(memberUid))
      .filter((m): m is GroupBattlePastMemberSummary => m != null);
    const memberCount = squad?.memberCount ?? members.length;
    const openSlots = Math.max(0, GROUP_BATTLE_MAX_MEMBERS - memberCount);
    const fromSummary = summaryByUid.get(invite.fromUid);
    return {
      ...invite,
      squadName: squad?.name ?? "",
      fromDisplayName: fromSummary?.displayName ?? "User",
      members,
      openSlots,
    };
  });

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

    const pendingSnap = await getPendingJoinRequestsTx(
      tx,
      db,
      battleId,
      uid
    );

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
    cancelPendingJoinRequestsTx(tx, pendingSnap);
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
