/**
 * グループバトル Firestore 読み書きヘルパ（Admin SDK）。
 */

import {
  FieldValue,
  Timestamp,
  type Firestore,
  type QuerySnapshot,
  type Transaction,
} from "firebase-admin/firestore";
import {
  GROUP_BATTLE_COLLECTION,
  GROUP_BATTLE_MAX_MEMBERS,
  GROUP_BATTLE_MAX_PENDING_APPLICATIONS,
  GROUP_BATTLE_MIN_MEMBERS,
  GROUP_BATTLE_NAME_MAX_LEN,
  GROUP_BATTLE_SNAPSHOTS_COLLECTION,
} from "@/lib/groupBattles/constants";
import { canMutateSquadMembers } from "@/lib/groupBattles/phases";
import type {
  GroupBattleDoc,
  GroupBattleJoinRequestDoc,
  GroupBattlePeriod,
  GroupBattlePeriodSnapshotDoc,
  GroupBattlePhase,
  GroupBattleSquadDoc,
  GroupBattleSquadInviteDoc,
  SquadStatus,
} from "@/lib/groupBattles/types";
import { periodSnapshotDocId } from "@/lib/groupBattles/dailyPoints";
import { openInviteCode } from "@/lib/security/sealInviteCode";

export function battleRef(db: Firestore, battleId: string) {
  return db.collection(GROUP_BATTLE_COLLECTION).doc(battleId);
}

export function squadsCol(db: Firestore, battleId: string) {
  return battleRef(db, battleId).collection("squads");
}

export function squadMembersCol(db: Firestore, battleId: string) {
  return battleRef(db, battleId).collection("squad_members");
}

export function joinRequestsCol(db: Firestore, battleId: string) {
  return battleRef(db, battleId).collection("join_requests");
}

export function squadInvitesCol(db: Firestore, battleId: string) {
  return battleRef(db, battleId).collection("squad_invites");
}

export function snapshotRef(
  db: Firestore,
  battleId: string,
  period: GroupBattlePeriod,
  label: string
) {
  return db
    .collection(GROUP_BATTLE_SNAPSHOTS_COLLECTION)
    .doc(periodSnapshotDocId(battleId, period, label));
}

function tsMs(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v) {
    try {
      return (v as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

export function parseBattleDoc(
  id: string,
  data: Record<string, unknown>
): GroupBattleDoc & { id: string } {
  const monthly = (data.monthlyRange ?? {}) as Record<string, unknown>;
  const unitRewards = (data.unitRewards ?? {}) as {
    weekly?: { maxRank?: number; unitsPerMemberByRank?: number[] };
    monthly?: { maxRank?: number; unitsPerMemberByRank?: number[] };
  };
  return {
    id,
    name: String(data.name ?? ""),
    phase: data.phase as GroupBattlePhase,
    recruitStartAtMs: tsMs(data.recruitStartAt),
    recruitEndAtMs: tsMs(data.recruitEndAt),
    battleStartAtMs: tsMs(data.battleStartAt),
    battleEndAtMs: tsMs(data.battleEndAt),
    weeklyLabels: Array.isArray(data.weeklyLabels)
      ? data.weeklyLabels.map(String)
      : [],
    monthlyRange: {
      startKey: String(monthly.startKey ?? ""),
      endKey: String(monthly.endKey ?? ""),
      label: String(monthly.label ?? "battle"),
    },
    league: "nba",
    seasonKey: String(data.seasonKey ?? ""),
    tieRule: "same_rank_same_unit",
    unitRewards: {
      weekly: {
        maxRank: Number(unitRewards.weekly?.maxRank ?? 0),
        unitsPerMemberByRank: Array.isArray(
          unitRewards.weekly?.unitsPerMemberByRank
        )
          ? unitRewards.weekly!.unitsPerMemberByRank!.map(Number)
          : [],
      },
      monthly: {
        maxRank: Number(unitRewards.monthly?.maxRank ?? 0),
        unitsPerMemberByRank: Array.isArray(
          unitRewards.monthly?.unitsPerMemberByRank
        )
          ? unitRewards.monthly!.unitsPerMemberByRank!.map(Number)
          : [],
      },
    },
    rulesVersion: String(data.rulesVersion ?? "1"),
  };
}

export function parseSquadDoc(
  id: string,
  data: Record<string, unknown>
): GroupBattleSquadDoc & { id: string } {
  const memberUids = Array.isArray(data.memberUids)
    ? data.memberUids.map(String)
    : [];
  return {
    id,
    name: String(data.name ?? ""),
    ownerUid: String(data.ownerUid ?? ""),
    memberUids,
    memberCount: Number(data.memberCount ?? memberUids.length) || 0,
    status: data.status as SquadStatus,
    inviteCodeHash:
      data.inviteCodeHash == null ? null : String(data.inviteCodeHash),
    inviteCodeLast4:
      data.inviteCodeLast4 == null ? null : String(data.inviteCodeLast4),
    inviteCodePlain:
      openInviteCode(data.inviteCodeEnc) ??
      (typeof data.inviteCodePlain === "string" && data.inviteCodePlain.trim()
        ? data.inviteCodePlain.trim()
        : null),
    rulesAcceptedAtMs: data.rulesAcceptedAt
      ? tsMs(data.rulesAcceptedAt)
      : null,
    rulesAcceptedByUid:
      data.rulesAcceptedByUid == null
        ? null
        : String(data.rulesAcceptedByUid),
  };
}

/** API 応答用。ハッシュは常に隠す。平文コードはオーナーのみ。 */
export function serializeSquadForClient(
  squad: GroupBattleSquadDoc & { id: string },
  opts: { viewerUid: string; includeInvitePlain?: boolean }
): Omit<
  GroupBattleSquadDoc & { id: string },
  "inviteCodeHash" | "inviteCodePlain"
> & {
  inviteCodeHash: null;
  inviteCodePlain: string | null;
  inviteCode?: string | null;
} {
  const isOwner = opts.viewerUid === squad.ownerUid;
  const plain =
    opts.includeInvitePlain !== false &&
    isOwner &&
    typeof squad.inviteCodePlain === "string" &&
    squad.inviteCodePlain.trim()
      ? squad.inviteCodePlain.trim()
      : null;
  return {
    id: squad.id,
    name: squad.name,
    ownerUid: squad.ownerUid,
    memberUids: squad.memberUids,
    memberCount: squad.memberCount,
    status: squad.status,
    inviteCodeLast4: squad.inviteCodeLast4 ?? null,
    inviteCodeHash: null,
    inviteCodePlain: plain,
    inviteCode: plain,
    rulesAcceptedAtMs: squad.rulesAcceptedAtMs ?? null,
    rulesAcceptedByUid: squad.rulesAcceptedByUid ?? null,
  };
}

export async function getBattle(
  db: Firestore,
  battleId: string
): Promise<(GroupBattleDoc & { id: string }) | null> {
  const snap = await battleRef(db, battleId).get();
  if (!snap.exists) return null;
  return parseBattleDoc(snap.id, snap.data() as Record<string, unknown>);
}

/** phase が運用中の大会を1件（更新が新しいもの優先） */
export async function getCurrentBattle(
  db: Firestore
): Promise<(GroupBattleDoc & { id: string }) | null> {
  const activePhases: GroupBattlePhase[] = [
    "announced",
    "recruiting",
    "locking",
    "battle",
    "settling",
    "final",
  ];
  const snap = await db
    .collection(GROUP_BATTLE_COLLECTION)
    .where("phase", "in", activePhases)
    .limit(10)
    .get();
  if (snap.empty) return null;
  const battles = snap.docs.map((d) =>
    parseBattleDoc(d.id, d.data() as Record<string, unknown>)
  );
  battles.sort((a, b) => b.battleStartAtMs - a.battleStartAtMs);
  return battles[0] ?? null;
}

export function sanitizeSquadName(raw: unknown): string | null {
  const name = String(raw ?? "").trim();
  if (name.length < 1 || name.length > GROUP_BATTLE_NAME_MAX_LEN) return null;
  return name;
}

export function assertRecruitingOrThrow(phase: GroupBattlePhase): void {
  if (!canMutateSquadMembers(phase)) {
    const err = new Error("phase_locked");
    (err as Error & { code: string }).code = "phase_locked";
    throw err;
  }
}

export async function getMembership(
  db: Firestore,
  battleId: string,
  uid: string
): Promise<{ squadId: string; role: "owner" | "member" } | null> {
  const snap = await squadMembersCol(db, battleId).doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    squadId: String(d.squadId ?? ""),
    role: d.role === "owner" ? "owner" : "member",
  };
}

export async function countPendingApplications(
  db: Firestore,
  battleId: string,
  uid: string
): Promise<number> {
  const snap = await joinRequestsCol(db, battleId)
    .where("applicantUid", "==", uid)
    .where("status", "==", "pending")
    .get();
  return snap.size;
}

/** トランザクション内 — 書き込みより前に呼ぶ */
export function getPendingJoinRequestsTx(
  tx: Transaction,
  db: Firestore,
  battleId: string,
  applicantUid: string
) {
  return tx.get(
    joinRequestsCol(db, battleId)
      .where("applicantUid", "==", applicantUid)
      .where("status", "==", "pending")
  );
}

/** 所属が決まった申請者の、残りの pending 申請を cancelled にする */
export function cancelPendingJoinRequestsTx(
  tx: Transaction,
  pendingSnap: QuerySnapshot,
  exceptRequestId?: string | null
): void {
  for (const doc of pendingSnap.docs) {
    if (exceptRequestId && doc.id === exceptRequestId) continue;
    tx.update(doc.ref, {
      status: "cancelled",
      resolvedAt: FieldValue.serverTimestamp(),
    });
  }
}

export function deriveSquadStatusAfterMemberChange(
  memberCount: number,
  rulesAccepted: boolean
): SquadStatus {
  if (
    memberCount >= GROUP_BATTLE_MIN_MEMBERS &&
    memberCount <= GROUP_BATTLE_MAX_MEMBERS &&
    rulesAccepted
  ) {
    return "entered";
  }
  return "forming";
}

export async function lockEligibleSquads(
  db: Firestore,
  battleId: string
): Promise<{ locked: number; rejected: number }> {
  const snap = await squadsCol(db, battleId).get();
  let locked = 0;
  let rejected = 0;
  const batch = db.batch();
  for (const doc of snap.docs) {
    const squad = parseSquadDoc(doc.id, doc.data() as Record<string, unknown>);
    const eligible =
      squad.status === "entered" &&
      squad.memberCount >= GROUP_BATTLE_MIN_MEMBERS &&
      squad.memberCount <= GROUP_BATTLE_MAX_MEMBERS;
    if (eligible) {
      batch.update(doc.ref, {
        status: "locked",
        updatedAt: FieldValue.serverTimestamp(),
      });
      locked += 1;
    } else if (squad.status !== "disqualified") {
      batch.update(doc.ref, {
        status: "disbanded",
        updatedAt: FieldValue.serverTimestamp(),
      });
      rejected += 1;
    }
  }
  batch.update(battleRef(db, battleId), {
    phase: "battle",
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  await cancelPendingJoinActivity(db, battleId);
  return { locked, rejected };
}

/** ロック後に残る pending 申請・招待を一括キャンセル */
export async function cancelPendingJoinActivity(
  db: Firestore,
  battleId: string
): Promise<{ requests: number; invites: number }> {
  const [reqSnap, invSnap] = await Promise.all([
    joinRequestsCol(db, battleId).where("status", "==", "pending").get(),
    squadInvitesCol(db, battleId).where("status", "==", "pending").get(),
  ]);

  const CHUNK = 400;
  let requests = 0;
  let invites = 0;
  type DocSnap = (typeof reqSnap.docs)[number];

  const cancelDocs = async (docs: DocSnap[], kind: "requests" | "invites") => {
    for (let i = 0; i < docs.length; i += CHUNK) {
      const slice = docs.slice(i, i + CHUNK);
      const b = db.batch();
      for (const d of slice) {
        b.update(d.ref, {
          status: "cancelled",
          resolvedAt: FieldValue.serverTimestamp(),
        });
      }
      await b.commit();
      if (kind === "requests") requests += slice.length;
      else invites += slice.length;
    }
  };

  await cancelDocs(reqSnap.docs, "requests");
  await cancelDocs(invSnap.docs, "invites");
  return { requests, invites };
}

export function parseSnapshotDoc(
  id: string,
  data: Record<string, unknown>
): GroupBattlePeriodSnapshotDoc & { id: string } {
  return {
    id,
    battleId: String(data.battleId ?? ""),
    period: data.period as GroupBattlePeriod,
    label: String(data.label ?? ""),
    status: data.status === "final" ? "final" : "live",
    range: {
      startKey: String((data.range as { startKey?: string })?.startKey ?? ""),
      endKey: String((data.range as { endKey?: string })?.endKey ?? ""),
    },
    rows: Array.isArray(data.rows) ? (data.rows as GroupBattlePeriodSnapshotDoc["rows"]) : [],
    metrics: data.metrics as GroupBattlePeriodSnapshotDoc["metrics"],
    builtAtMs: tsMs(data.builtAt),
    finalizedAtMs: data.finalizedAt ? tsMs(data.finalizedAt) : null,
  };
}

export type Tx = Transaction;

export function parseJoinRequest(
  id: string,
  data: Record<string, unknown>
): GroupBattleJoinRequestDoc & { id: string } {
  return {
    id,
    squadId: String(data.squadId ?? ""),
    applicantUid: String(data.applicantUid ?? ""),
    status: data.status as GroupBattleJoinRequestDoc["status"],
    createdAtMs: tsMs(data.createdAt),
    resolvedAtMs: data.resolvedAt ? tsMs(data.resolvedAt) : null,
  };
}

export function parseSquadInvite(
  id: string,
  data: Record<string, unknown>
): GroupBattleSquadInviteDoc & { id: string } {
  return {
    id,
    squadId: String(data.squadId ?? ""),
    fromUid: String(data.fromUid ?? ""),
    toUid: String(data.toUid ?? ""),
    status: data.status as GroupBattleSquadInviteDoc["status"],
    source: data.source === "reform" ? "reform" : "manual",
    sourceBattleId:
      data.sourceBattleId == null ? null : String(data.sourceBattleId),
    sourceSquadId:
      data.sourceSquadId == null ? null : String(data.sourceSquadId),
    createdAtMs: tsMs(data.createdAt),
    resolvedAtMs: data.resolvedAt ? tsMs(data.resolvedAt) : null,
  };
}

export { GROUP_BATTLE_MAX_PENDING_APPLICATIONS, GROUP_BATTLE_MAX_MEMBERS };
