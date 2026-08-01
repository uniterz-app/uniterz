/**
 * 過去スクワッド履歴（再招集用）。既存 squads / squad_members から導出。
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  GROUP_BATTLE_COLLECTION,
  GROUP_BATTLE_PAST_SQUAD_LIMIT,
} from "@/lib/groupBattles/constants";
import {
  parseBattleDoc,
  parseSquadDoc,
  squadMembersCol,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import type {
  GroupBattlePastMemberSummary,
  GroupBattlePastSquadItem,
} from "@/lib/groupBattles/types";

function isLockedOrDisbanded(status: string): boolean {
  return status === "locked" || status === "disbanded";
}

export async function loadUserMemberSummaries(
  db: Firestore,
  uids: string[]
): Promise<GroupBattlePastMemberSummary[]> {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return [];

  const snaps = await Promise.all(
    unique.map((uid) => db.collection("users").doc(uid).get())
  );

  const out: GroupBattlePastMemberSummary[] = [];
  for (let i = 0; i < snaps.length; i++) {
    const snap = snaps[i]!;
    const uid = unique[i]!;
    if (!snap.exists) continue;
    const d = snap.data() as Record<string, unknown>;
    if (d.deletedAt) continue;
    const handleRaw =
      typeof d.handle === "string" ? d.handle.trim() : "";
    if (handleRaw.startsWith("deleted_")) continue;
    out.push({
      uid,
      displayName:
        typeof d.displayName === "string" && d.displayName.trim()
          ? d.displayName.trim()
          : "User",
      handle: handleRaw || null,
    });
  }
  return out;
}

export async function isInviteeEligible(
  db: Firestore,
  battleId: string,
  targetUid: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const userSnap = await db.collection("users").doc(targetUid).get();
  if (!userSnap.exists) return { ok: false, reason: "user_not_found" };
  const d = userSnap.data() as Record<string, unknown>;
  if (d.deletedAt) return { ok: false, reason: "user_deleted" };
  const handle =
    typeof d.handle === "string" ? d.handle.trim() : "";
  if (handle.startsWith("deleted_")) return { ok: false, reason: "user_deleted" };

  const mem = await squadMembersCol(db, battleId).doc(targetUid).get();
  if (mem.exists) return { ok: false, reason: "already_in_squad" };
  return { ok: true };
}

/** 新しい大会から最大 PAST_SQUAD_LIMIT 件の locked/disbanded 履歴 */
export async function listPastLockedSquadsForUser(
  db: Firestore,
  uid: string
): Promise<GroupBattlePastSquadItem[]> {
  let battleSnaps;
  try {
    battleSnaps = await db
      .collection(GROUP_BATTLE_COLLECTION)
      .orderBy("battleStartAt", "desc")
      .limit(24)
      .get();
  } catch {
    battleSnaps = await db.collection(GROUP_BATTLE_COLLECTION).limit(40).get();
  }

  const battles = battleSnaps.docs
    .map((d) => parseBattleDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.battleStartAtMs - a.battleStartAtMs);

  const items: GroupBattlePastSquadItem[] = [];

  for (const battle of battles) {
    if (items.length >= GROUP_BATTLE_PAST_SQUAD_LIMIT) break;

    const memSnap = await squadMembersCol(db, battle.id).doc(uid).get();
    if (!memSnap.exists) continue;
    const mem = memSnap.data() as Record<string, unknown>;
    const squadId = String(mem.squadId ?? "");
    if (!squadId) continue;

    const squadSnap = await squadsCol(db, battle.id).doc(squadId).get();
    if (!squadSnap.exists) continue;
    const squad = parseSquadDoc(
      squadSnap.id,
      squadSnap.data() as Record<string, unknown>
    );
    if (!isLockedOrDisbanded(squad.status)) continue;

    const members = await loadUserMemberSummaries(db, squad.memberUids);
    const role: "owner" | "member" =
      mem.role === "owner" || squad.ownerUid === uid ? "owner" : "member";

    items.push({
      battleId: battle.id,
      battleName: battle.name || battle.id,
      battleStartAtMs: battle.battleStartAtMs,
      squadId: squad.id,
      squadName: squad.name,
      role,
      members,
    });
  }

  return items;
}

/** ソーススクワッドが履歴対象か・呼び出しユーザーが所属していたか検証 */
export async function loadSourcePastSquad(
  db: Firestore,
  uid: string,
  sourceBattleId: string,
  sourceSquadId: string
): Promise<
  | {
      ok: true;
      battleName: string;
      squad: ReturnType<typeof parseSquadDoc>;
      role: "owner" | "member";
      memberUids: string[];
    }
  | { ok: false; reason: string }
> {
  const battleSnap = await db
    .collection(GROUP_BATTLE_COLLECTION)
    .doc(sourceBattleId)
    .get();
  if (!battleSnap.exists) return { ok: false, reason: "source_not_found" };
  const battle = parseBattleDoc(
    battleSnap.id,
    battleSnap.data() as Record<string, unknown>
  );

  const memSnap = await squadMembersCol(db, sourceBattleId).doc(uid).get();
  if (!memSnap.exists) return { ok: false, reason: "not_past_member" };
  const mem = memSnap.data() as Record<string, unknown>;
  if (String(mem.squadId ?? "") !== sourceSquadId) {
    return { ok: false, reason: "not_past_member" };
  }

  const squadSnap = await squadsCol(db, sourceBattleId).doc(sourceSquadId).get();
  if (!squadSnap.exists) return { ok: false, reason: "source_not_found" };
  const squad = parseSquadDoc(
    squadSnap.id,
    squadSnap.data() as Record<string, unknown>
  );
  if (!isLockedOrDisbanded(squad.status)) {
    return { ok: false, reason: "source_not_locked" };
  }

  const role: "owner" | "member" =
    mem.role === "owner" || squad.ownerUid === uid ? "owner" : "member";

  return {
    ok: true,
    battleName: battle.name || battle.id,
    squad,
    role,
    memberUids: squad.memberUids,
  };
}
