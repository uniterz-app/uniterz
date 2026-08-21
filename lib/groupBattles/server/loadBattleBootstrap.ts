/**
 * スクワッドバトル起動用の一括読み。プロフィールは uid 集合をまとめて 1 回。
 */

import type { Firestore } from "firebase-admin/firestore";
import { GROUP_BATTLE_MAX_MEMBERS } from "@/lib/groupBattles/constants";
import {
  getBattle,
  getCurrentBattle,
  getMembership,
  parseSnapshotDoc,
  parseSquadDoc,
  snapshotRef,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import {
  entryProfileOrFallback,
  loadGroupBattleEntryProfiles,
} from "@/lib/groupBattles/server/loadEntryProfiles";
import { listIncomingPendingInvites } from "@/lib/groupBattles/server/invites";
import { listJoinRequestsForUser } from "@/lib/groupBattles/server/joinRequests";
import { listPastLockedSquadsForUser } from "@/lib/groupBattles/server/pastSquads";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";

export type GroupBattleBootstrap = {
  battle: ReturnType<typeof mapBattle> | null;
  membership: { squadId: string; role: "owner" | "member" } | null;
  mySquad: Record<string, unknown> | null;
  rankings: {
    battleId: string;
    period: GroupBattlePeriod;
    label: string;
    snapshot: Record<string, unknown> | null;
  } | null;
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
  const emptyJoin = { incoming: [] as const, outgoing: [] as const };
  const battle = opts.battleId
    ? await getBattle(db, opts.battleId)
    : await getCurrentBattle(db);

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

  const period: GroupBattlePeriod =
    opts.period === "monthly" ? "monthly" : "weekly";
  let label = (opts.label ?? "").trim();
  if (!label && period === "weekly") {
    const idx = Math.floor(Number(opts.weekIndex ?? 0));
    if (idx >= 1) {
      label = battle.weeklyLabels[idx - 1] ?? "";
    }
  }
  if (!label) {
    label =
      period === "weekly"
        ? battle.weeklyLabels[battle.weeklyLabels.length - 1] ?? ""
        : battle.monthlyRange.label;
  }

  const membership = uid
    ? await getMembership(db, battle.id, uid)
    : null;

  const [openSnap, snapshotSnap, pastSquads, invites, joinRequests] =
    await Promise.all([
      squadsCol(db, battle.id)
        .where("status", "in", ["forming", "entered"])
        .limit(80)
        .get(),
      label
        ? snapshotRef(db, battle.id, period, label).get()
        : Promise.resolve(null),
      uid ? listPastLockedSquadsForUser(db, uid) : Promise.resolve([]),
      uid
        ? listIncomingPendingInvites(db, battle.id, uid)
        : Promise.resolve([]),
      uid
        ? listJoinRequestsForUser(db, battle.id, uid)
        : Promise.resolve(emptyJoin),
    ]);

  const openParsed = openSnap.docs
    .map((d) => parseSquadDoc(d.id, d.data() as Record<string, unknown>))
    .filter((s) => s.memberCount < GROUP_BATTLE_MAX_MEMBERS);

  let mySquadRaw: ReturnType<typeof parseSquadDoc> | null = null;
  if (membership?.squadId) {
    const snap = await squadsCol(db, battle.id).doc(membership.squadId).get();
    if (snap.exists) {
      mySquadRaw = parseSquadDoc(
        snap.id,
        snap.data() as Record<string, unknown>
      );
    }
  }

  const rankingUids =
    snapshotSnap && snapshotSnap.exists
      ? parseSnapshotDoc(
          snapshotSnap.id,
          snapshotSnap.data() as Record<string, unknown>
        ).rows.flatMap((r) => r.memberScores.map((m) => m.uid))
      : [];

  const profileUids = [
    ...new Set([
      ...openParsed.flatMap((s) => s.memberUids),
      ...(mySquadRaw?.memberUids ?? []),
      ...rankingUids,
    ]),
  ];
  const profiles = await loadGroupBattleEntryProfiles(db, profileUids);

  const openSquads = openParsed.map((s) => ({
    id: s.id,
    name: s.name,
    memberCount: s.memberCount,
    openSlots: GROUP_BATTLE_MAX_MEMBERS - s.memberCount,
    status: s.status,
    memberUids: s.memberUids,
    members: s.memberUids.map((memberUid, i) =>
      entryProfileOrFallback(memberUid, profiles, i)
    ),
  }));

  let rankings: GroupBattleBootstrap["rankings"] = null;
  if (label) {
    if (!snapshotSnap || !snapshotSnap.exists) {
      rankings = {
        battleId: battle.id,
        period,
        label,
        snapshot: null,
      };
    } else {
      const snapshot = parseSnapshotDoc(
        snapshotSnap.id,
        snapshotSnap.data() as Record<string, unknown>
      );
      const rows = snapshot.rows.map((row) => ({
        ...row,
        memberScores: row.memberScores.map((m) => {
          const p = profiles.get(m.uid);
          return {
            ...m,
            displayName: p?.displayName,
            handle: p?.handle ?? null,
            photoURL: p?.photoURL ?? null,
            plan: p?.plan,
            seasonPoints: p?.points,
            winRate: p?.winRate,
            activeWinStreak: p?.activeWinStreak,
            totalPosts: p?.totalPosts,
            thisWeekRank: p?.thisWeekRank ?? null,
            lastWeekRank: p?.lastWeekRank ?? null,
            lastMonthRank: p?.lastMonthRank ?? null,
          };
        }),
      }));
      rankings = {
        battleId: battle.id,
        period,
        label,
        snapshot: { ...snapshot, rows },
      };
    }
  }

  let mySquad: Record<string, unknown> | null = null;
  if (mySquadRaw && uid) {
    const inviteCode =
      membership?.role === "owner" &&
      typeof mySquadRaw.inviteCodePlain === "string" &&
      mySquadRaw.inviteCodePlain.trim()
        ? mySquadRaw.inviteCodePlain.trim()
        : null;
    mySquad = {
      id: mySquadRaw.id,
      name: mySquadRaw.name,
      memberUids: mySquadRaw.memberUids,
      memberCount: mySquadRaw.memberCount,
      status: mySquadRaw.status,
      ownerUid: mySquadRaw.ownerUid,
      inviteCode,
      members: mySquadRaw.memberUids.map((memberUid, i) =>
        entryProfileOrFallback(memberUid, profiles, i)
      ),
    };
  }

  return {
    battle: mapBattle(battle),
    membership,
    mySquad,
    rankings,
    openSquads,
    pastSquads,
    invites,
    joinRequests,
  };
}
