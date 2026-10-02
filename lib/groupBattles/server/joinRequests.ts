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
  uid: string
): Promise<{
  incoming: GroupBattleJoinRequestApiItem[];
  outgoing: GroupBattleJoinRequestApiItem[];
}> {
  const pendingSnap = await joinRequestsCol(db, battleId)
    .where("status", "==", "pending")
    .limit(80)
    .get();

  const parsed = pendingSnap.docs.map((d) =>
    parseJoinRequest(d.id, d.data() as Record<string, unknown>)
  );

  const membership = await getMembership(db, battleId, uid);
  const mySquadId =
    membership?.role === "owner" ? membership.squadId : null;

  const incomingRows = mySquadId
    ? parsed.filter((r) => r.squadId === mySquadId)
    : [];
  const outgoingRows = parsed.filter((r) => r.applicantUid === uid);

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
    row: (typeof parsed)[number]
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
