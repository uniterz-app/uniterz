/**
 * スクワッドバトル起動用の一括読み。
 * 全員共通の部分は `loadGroupBattleSharedView`（キャッシュ）、ユーザー固有の部分だけ毎回読む。
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  getCurrentBattle,
  getMembership,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { entryProfileOrFallback } from "@/lib/groupBattles/server/loadEntryProfiles";
import { listIncomingPendingInvites } from "@/lib/groupBattles/server/invites";
import { listJoinRequestsForUser } from "@/lib/groupBattles/server/joinRequests";
import { listPastLockedSquadsForUser } from "@/lib/groupBattles/server/pastSquads";
import {
  entryProfilesFromSharedView,
  loadGroupBattleSharedView,
  type GroupBattleSharedView,
} from "@/lib/groupBattles/server/sharedViewCache";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";

export type GroupBattleBootstrap = {
  battle: ReturnType<typeof mapBattle> | null;
  membership: { squadId: string; role: "owner" | "member" } | null;
  mySquad: Record<string, unknown> | null;
  rankings: GroupBattleSharedView["rankings"];
  openSquads: Array<Record<string, unknown>>;
  pastSquads: Awaited<ReturnType<typeof listPastLockedSquadsForUser>>;
  invites: Awaited<ReturnType<typeof listIncomingPendingInvites>>;
  joinRequests: Awaited<ReturnType<typeof listJoinRequestsForUser>> | {
    incoming: [];
    outgoing: [];
  };
};

function mapBattle(
  battle: NonNullable<Awaited<ReturnType<typeof getCurrentBattle>>>
) {
  return {
    id: battle.id,
    name: battle.name,
    phase: battle.phase,
    weeklyLabels: battle.weeklyLabels,
    monthlyRange: battle.monthlyRange,
    recruitEndAtMs: battle.recruitEndAtMs,
    battleStartAtMs: battle.battleStartAtMs,
    battleEndAtMs: battle.battleEndAtMs,
  };
}

/** 自分のスクワッド（オーナーだけ招待コード平文） */
export async function loadMySquadForViewer(
  db: Firestore,
  shared: GroupBattleSharedView,
  battleId: string,
  membership: { squadId: string; role: "owner" | "member" }
): Promise<Record<string, unknown> | null> {
  const snap = await squadsCol(db, battleId).doc(membership.squadId).get();
  if (!snap.exists) return null;
  const squad = parseSquadDoc(snap.id, snap.data() as Record<string, unknown>);
  const profiles = await entryProfilesFromSharedView(
    db,
    shared,
    squad.memberUids
  );
  const inviteCode =
    membership.role === "owner" &&
    typeof squad.inviteCodePlain === "string" &&
    squad.inviteCodePlain.trim()
      ? squad.inviteCodePlain.trim()
      : null;
  return {
    id: squad.id,
    name: squad.name,
    memberUids: squad.memberUids,
    memberCount: squad.memberCount,
    status: squad.status,
    ownerUid: squad.ownerUid,
    inviteCode,
    members: squad.memberUids.map((memberUid, i) =>
      entryProfileOrFallback(memberUid, profiles, i)
    ),
  };
}

export async function loadGroupBattleBootstrap(
  db: Firestore,
  uid: string | null,
  opts: {
    battleId?: string | null;
    period?: GroupBattlePeriod;
    label?: string | null;
    weekIndex?: number | null;
  } = {}
): Promise<GroupBattleBootstrap> {
  const emptyJoin: { incoming: []; outgoing: [] } = {
    incoming: [],
    outgoing: [],
  };
  const shared = await loadGroupBattleSharedView(db, opts);
  const battle = shared.battle;

  if (!battle) {
    return {
      battle: null,
      membership: null,
      mySquad: null,
      rankings: null,
      openSquads: [],
      pastSquads: [],
      invites: [],
      joinRequests: emptyJoin,
    };
  }

  const membership = uid ? await getMembership(db, battle.id, uid) : null;
  const [pastSquads, invites, joinRequests] = await Promise.all([
    uid ? listPastLockedSquadsForUser(db, uid) : Promise.resolve([]),
    uid
      ? listIncomingPendingInvites(db, battle.id, uid)
      : Promise.resolve([]),
    uid
      ? listJoinRequestsForUser(db, battle.id, uid, membership)
      : Promise.resolve(emptyJoin),
  ]);

  const mySquad =
    uid && membership?.squadId
      ? await loadMySquadForViewer(db, shared, battle.id, membership)
      : null;

  return {
    battle: mapBattle(battle),
    membership,
    mySquad,
    rankings: shared.rankings,
    openSquads: shared.openSquads,
    pastSquads,
    invites,
    joinRequests,
  };
}
