/**
 * 期間スナップショットの rows → Squad Battle UI の Squad[]。
 */

import type { GroupBattleEntryProfile } from "./entryProfileTypes";
import type { GroupBattleJoinRequestApiItem, GroupBattleRankRow } from "./types";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  type OpenSquadListing,
  type Squad,
  type SquadApplicantProfile,
  type SquadJoinRequest,
  type SquadMember,
} from "@/lib/squads/squadBattleMock";

function padMembers(
  scores: Array<{
    uid: string;
    points: number;
    displayName?: string;
    handle?: string | null;
    photoURL?: string | null;
    plan?: "free" | "pro";
    seasonPoints?: number;
    winRate?: number;
    activeWinStreak?: number;
    totalPosts?: number;
    thisWeekRank?: number | null;
    lastWeekRank?: number | null;
    lastMonthRank?: number | null;
  }>
): SquadMember[] {
  const members: SquadMember[] = scores.map((m, i) => {
    const hasLiveProfile =
      m.displayName != null ||
      m.winRate != null ||
      m.thisWeekRank !== undefined;
    return {
      uid: m.uid,
      handle: m.handle?.trim() || "",
      displayName:
        m.displayName?.trim() ||
        (m.handle?.trim() ? `@${m.handle.trim()}` : `M${i + 1}`),
      /** バトル期間スコア（スナップショット） */
      points: m.points,
      plan: m.plan,
      photoURL: m.photoURL ?? undefined,
      fromLive: hasLiveProfile,
      seasonPoints: m.seasonPoints,
      winRate: m.winRate,
      activeWinStreak: m.activeWinStreak,
      totalPosts: m.totalPosts,
      lastMonthRank: m.lastMonthRank ?? null,
      lastWeekRank: m.lastWeekRank ?? null,
      thisWeekRank: m.thisWeekRank ?? null,
    };
  });
  while (members.length < SQUAD_BATTLE_MAX_MEMBERS) {
    members.push({
      uid: `empty-${members.length}`,
      handle: "",
      displayName: "",
      points: 0,
      empty: true,
    });
  }
  return members;
}

/** API スナップショット行をランキングボード用 Squad に変換 */
export function mapGroupBattleSnapshotRowsToSquads(
  rows: GroupBattleRankRow[],
  mySquadId: string | null
): Squad[] {
  return rows.map((row) => ({
    id: row.squadId,
    name: row.name,
    members: padMembers(row.memberScores ?? []),
    avgPoints: row.groupScore,
    rank: row.rank,
    prevRank: row.prevRank ?? undefined,
    isMine: mySquadId != null && row.squadId === mySquadId,
  }));
}

export type CurrentMySquadApi = {
  id: string;
  name: string;
  memberUids: string[];
  memberCount: number;
  status: string;
  members?: GroupBattleEntryProfile[];
  inviteCode?: string | null;
};

function padUiMembers(members: SquadMember[]): SquadMember[] {
  const filled = members.slice(0, SQUAD_BATTLE_MAX_MEMBERS);
  while (filled.length < SQUAD_BATTLE_MAX_MEMBERS) {
    filled.push({
      uid: `empty-${filled.length}`,
      handle: "",
      displayName: "",
      points: 0,
      empty: true,
    });
  }
  return filled;
}

function entryProfileToMember(
  p: GroupBattleEntryProfile,
  selfUid: string | null
): SquadMember {
  const isSelf = selfUid != null && p.uid === selfUid;
  return {
    uid: p.uid,
    handle: p.handle ?? "",
    displayName: isSelf ? "YOU" : p.displayName,
    points: p.points,
    plan: p.plan,
    photoURL: p.photoURL,
    fromLive: true,
    seasonPoints: p.points,
    winRate: p.winRate,
    activeWinStreak: p.activeWinStreak,
    totalPosts: p.totalPosts,
    lastMonthRank: p.lastMonthRank,
    lastWeekRank: p.lastWeekRank,
    thisWeekRank: p.thisWeekRank,
  };
}

function entryProfileToApplicant(
  p: GroupBattleEntryProfile
): SquadApplicantProfile {
  return {
    uid: p.uid,
    handle: p.handle ?? "",
    displayName: p.displayName,
    points: p.points,
    winRate: p.winRate,
    activeWinStreak: p.activeWinStreak,
    totalPosts: p.totalPosts,
    bio: "",
    plan: p.plan,
    photoURL: p.photoURL ?? undefined,
    lastMonthRank: p.lastMonthRank,
    lastWeekRank: p.lastWeekRank,
    thisWeekRank: p.thisWeekRank,
  };
}

/** current.mySquad → JOIN の MY SQUAD（スナップショット前の募集中） */
export function mapCurrentMySquadToUiSquad(
  mySquad: CurrentMySquadApi,
  selfUid: string | null
): Squad {
  const enriched = mySquad.members ?? [];
  const members: SquadMember[] =
    enriched.length > 0
      ? enriched.map((p) => entryProfileToMember(p, selfUid))
      : (mySquad.memberUids ?? []).map((uid, i) => {
          const short = uid.length >= 4 ? uid.slice(-4) : String(i + 1);
          return {
            uid,
            handle: "",
            displayName: uid === selfUid ? "YOU" : `Player · ${short}`,
            points: 0,
          };
        });
  return {
    id: mySquad.id,
    name: mySquad.name,
    members: padUiMembers(members),
    avgPoints: 0,
    rank: 0,
    isMine: true,
    inviteCode: mySquad.inviteCode ?? null,
  };
}

export type OpenSquadApiItem = {
  id: string;
  name: string;
  memberCount: number;
  openSlots: number;
  memberUids?: string[];
  members?: GroupBattleEntryProfile[];
};

/** GET open-squads → 未参加時の公開一覧 */
export function mapOpenSquadApiToListings(
  squads: OpenSquadApiItem[]
): OpenSquadListing[] {
  return squads.map((s) => {
    const members: SquadApplicantProfile[] =
      s.members && s.members.length > 0
        ? s.members.map(entryProfileToApplicant)
        : (s.memberUids ?? []).map(
            (uid, i): SquadApplicantProfile => {
              const short = uid.length >= 4 ? uid.slice(-4) : String(i + 1);
              return {
                uid,
                handle: "",
                displayName: `Player · ${short}`,
                points: 0,
                winRate: 0,
                activeWinStreak: 0,
                totalPosts: 0,
                bio: "",
              };
            }
          );
    return {
      id: s.id,
      name: s.name,
      avgPoints: 0,
      openSlots: s.openSlots,
      memberCount: s.memberCount,
      members,
    };
  });
}

export type JoinRequestApiItem = GroupBattleJoinRequestApiItem;

function joinRequestStatus(
  status: string
): SquadJoinRequest["status"] {
  if (status === "approved" || status === "rejected") return status;
  return "pending";
}

/** GET join-requests → 申請カード */
export function mapJoinRequestApiToUi(
  row: JoinRequestApiItem
): SquadJoinRequest {
  const a = row.applicant;
  return {
    id: row.id,
    squadId: row.squadId,
    squadName: row.squadName,
    status: joinRequestStatus(row.status),
    createdAtLabel: "申請中",
    applicant: {
      uid: a.uid,
      handle: a.handle,
      displayName: a.displayName,
      points: a.points ?? 0,
      winRate: a.winRate ?? 0,
      activeWinStreak: a.activeWinStreak ?? 0,
      totalPosts: a.totalPosts ?? 0,
      bio: "",
      plan: a.plan,
      photoURL: a.photoURL ?? undefined,
      lastMonthRank: a.lastMonthRank ?? null,
      lastWeekRank: a.lastWeekRank ?? null,
      thisWeekRank: a.thisWeekRank ?? null,
    },
  };
}
