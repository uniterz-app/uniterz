/**
 * 期間スナップショットの rows → Squad Battle UI の Squad[]。
 */

import type { GroupBattleRankRow } from "./types";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  type Squad,
  type SquadMember,
} from "@/lib/squads/squadBattleMock";

function padMembers(
  scores: Array<{ uid: string; points: number }>
): SquadMember[] {
  const members: SquadMember[] = scores.map((m, i) => ({
    uid: m.uid,
    handle: "",
    displayName: `M${i + 1}`,
    points: m.points,
  }));
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
