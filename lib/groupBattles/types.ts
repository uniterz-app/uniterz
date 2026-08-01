/**
 * グループバトル共有型。
 * 正: docs/group-battle-tech-design.md
 */

export type GroupBattlePhase =
  | "announced"
  | "recruiting"
  | "locking"
  | "battle"
  | "settling"
  | "final"
  | "closed";

export type SquadStatus =
  | "forming"
  | "entered"
  | "locked"
  | "disqualified"
  | "disbanded";

export type GroupBattlePeriod = "weekly" | "monthly";

export type GroupBattleSnapshotStatus = "live" | "final";

export type GroupBattleTieRule = "same_rank_same_unit";

export type GroupBattleMemberScore = {
  uid: string;
  points: number;
};

export type GroupBattleRankRow = {
  rank: number;
  squadId: string;
  name: string;
  groupScore: number;
  memberCount: number;
  memberScores: GroupBattleMemberScore[];
  prevRank: number | null;
  scoreGapToAbove: number | null;
};

export type GroupBattleUnitRewardTable = {
  maxRank: number;
  /** index 0 = 1位の1人当たり Unit */
  unitsPerMemberByRank: number[];
};

export type GroupBattleDoc = {
  name: string;
  phase: GroupBattlePhase;
  recruitStartAtMs: number;
  recruitEndAtMs: number;
  battleStartAtMs: number;
  battleEndAtMs: number;
  weeklyLabels: string[];
  monthlyRange: { startKey: string; endKey: string; label: string };
  league: "nba";
  seasonKey: string;
  tieRule: GroupBattleTieRule;
  unitRewards: {
    weekly: GroupBattleUnitRewardTable;
    monthly: GroupBattleUnitRewardTable;
  };
  rulesVersion: string;
};

export type GroupBattleSquadDoc = {
  name: string;
  ownerUid: string;
  memberUids: string[];
  memberCount: number;
  status: SquadStatus;
  inviteCodeHash: string | null;
  inviteCodeLast4?: string | null;
  rulesAcceptedAtMs: number | null;
  rulesAcceptedByUid: string | null;
};

export type GroupBattleJoinRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type GroupBattleJoinRequestDoc = {
  squadId: string;
  applicantUid: string;
  status: GroupBattleJoinRequestStatus;
  createdAtMs: number;
  resolvedAtMs: number | null;
};

/** 過去スクワッド再招集用のメンバー要約 */
export type GroupBattlePastMemberSummary = {
  uid: string;
  displayName: string;
  handle: string | null;
};

/** GET /api/group-battles/me/past-squads の1件 */
export type GroupBattlePastSquadItem = {
  battleId: string;
  battleName: string;
  battleStartAtMs: number;
  squadId: string;
  squadName: string;
  role: "owner" | "member";
  members: GroupBattlePastMemberSummary[];
};

export type GroupBattleSquadInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export type GroupBattleSquadInviteSource = "reform" | "manual";

export type GroupBattleSquadInviteDoc = {
  squadId: string;
  fromUid: string;
  toUid: string;
  status: GroupBattleSquadInviteStatus;
  source: GroupBattleSquadInviteSource;
  sourceBattleId: string | null;
  sourceSquadId: string | null;
  createdAtMs: number;
  resolvedAtMs: number | null;
};

export type GroupBattlePeriodSnapshotDoc = {
  battleId: string;
  period: GroupBattlePeriod;
  label: string;
  status: GroupBattleSnapshotStatus;
  range: { startKey: string; endKey: string };
  rows: GroupBattleRankRow[];
  metrics?: {
    squadCount: number;
    size3: number;
    size4: number;
    size5: number;
    tieGroups: number;
    inactiveMemberRate: number;
  };
  builtAtMs: number;
  finalizedAtMs: number | null;
};

export type UnitLedgerReason =
  | "group_battle_weekly"
  | "group_battle_monthly";

export type UnitLedgerDoc = {
  uid: string;
  amount: number;
  reason: UnitLedgerReason;
  idempotencyKey: string;
  battleId: string;
  period: GroupBattlePeriod;
  label: string;
  rank: number;
  createdAtMs: number;
};
