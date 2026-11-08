/**
 * 参加申請の一覧（代表者向け incoming / 自分の outgoing）。
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  getMembership,
  joinRequestsCol,
  parseJoinRequest,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import {
  entryProfileOrFallback,
  loadGroupBattleEntryProfiles,
} from "@/lib/groupBattles/server/loadEntryProfiles";
import type { GroupBattleJoinRequestApiItem } from "@/lib/groupBattles/types";

function toApiItem(
  row: {
    id: string;
    squadId: string;
    applicantUid: string;
    status: string;
    createdAtMs: number;
  },
  squadName: string,
  applicant: GroupBattleJoinRequestApiItem["applicant"]
): GroupBattleJoinRequestApiItem {
  return {
    id: row.id,
    squadId: row.squadId,
    squadName,
    status: row.status,
    createdAtMs: row.createdAtMs,
    applicant,
  };
}

export async function listJoinRequestsForUser(
  db: Firestore,
  battleId: string,
  uid: string,
  /** 呼び出し側で読んであれば渡す（undefined のときだけ読む） */
  knownMembership?: Awaited<ReturnType<typeof getMembership>>
): Promise<{
  incoming: GroupBattleJoinRequestApiItem[];
  outgoing: GroupBattleJoinRequestApiItem[];
}> {
  const membership =
    knownMembership !== undefined
      ? knownMembership
      : await getMembership(db, battleId, uid);
  const mySquadId =
    membership?.role === "owner" ? membership.squadId : null;

  const pending = joinRequestsCol(db, battleId).where("status", "==", "pending");
  const parseAll = (snap: FirebaseFirestore.QuerySnapshot) =>
    snap.docs.map((d) =>
      parseJoinRequest(d.id, d.data() as Record<string, unknown>)
    );
  const [incomingRows, outgoingRows] = await Promise.all([
    mySquadId
      ? pending.where("squadId", "==", mySquadId).limit(80).get().then(parseAll)
      : Promise.resolve([] as ReturnType<typeof parseJoinRequest>[]),
    pending.where("applicantUid", "==", uid).limit(80).get().then(parseAll),
  ]);

  const squadIds = [
    ...new Set([...incomingRows, ...outgoingRows].map((r) => r.squadId)),
  ];
  const applicantUids = [
    ...new Set([...incomingRows, ...outgoingRows].map((r) => r.applicantUid)),
  ];

  const [squadSnaps, profiles] = await Promise.all([
    Promise.all(squadIds.map((id) => squadsCol(db, battleId).doc(id).get())),
    loadGroupBattleEntryProfiles(db, applicantUids),
  ]);

  const squadNameById = new Map<string, string>();
  for (const snap of squadSnaps) {
    if (!snap.exists) continue;
    const squad = parseSquadDoc(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    squadNameById.set(squad.id, squad.name);
  }

  const mapRow = (
    row: ReturnType<typeof parseJoinRequest>
  ): GroupBattleJoinRequestApiItem => {
    const p = entryProfileOrFallback(row.applicantUid, profiles);
    return toApiItem(row, squadNameById.get(row.squadId) ?? "SQUAD", {
      uid: p.uid,
      handle: p.handle ?? "",
      displayName: p.displayName,
      photoURL: p.photoURL,
      plan: p.plan,
      points: p.points,
      winRate: p.winRate,
      activeWinStreak: p.activeWinStreak,
      totalPosts: p.totalPosts,
      thisWeekRank: p.thisWeekRank,
      lastWeekRank: p.lastWeekRank,
      lastMonthRank: p.lastMonthRank,
    });
  };

  return {
    incoming: incomingRows.map(mapRow),
    outgoing: outgoingRows.map(mapRow),
  };
}
