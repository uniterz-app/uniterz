/**
 * グループスコア・同点同順位。
 * 正: docs/group-battle-tech-design.md §5
 */

import type { GroupBattleMemberScore, GroupBattleRankRow } from "./types";

/** 確定メンバー全員の平均（0点も含む）。人数0は 0 */
export function computeGroupScore(
  memberScores: ReadonlyArray<Pick<GroupBattleMemberScore, "points">>,
  lockedMemberCount: number
): number {
  if (lockedMemberCount <= 0) return 0;
  const sum = memberScores.reduce((acc, m) => acc + (Number(m.points) || 0), 0);
  return sum / lockedMemberCount;
}

export type SquadScoreInput = {
  squadId: string;
  name: string;
  memberScores: GroupBattleMemberScore[];
  /** ロック時の確定人数（memberScores 長と一致させる） */
  memberCount: number;
  prevRank?: number | null;
};

/**
 * groupScore 降順。同値は同 rank（competition ranking）。
 */
export function rankSquadsByGroupScore(
  inputs: ReadonlyArray<SquadScoreInput>
): GroupBattleRankRow[] {
  const prepared = inputs.map((s) => {
    const memberCount = s.memberCount;
    const groupScore = computeGroupScore(s.memberScores, memberCount);
    return { ...s, memberCount, groupScore };
  });

  const sorted = [...prepared].sort((a, b) => {
    const diff = b.groupScore - a.groupScore;
    if (diff !== 0) return diff;
    // 安定ソート用（順位には影響させない）
    return a.squadId.localeCompare(b.squadId);
  });

  let lastScore: number | null = null;
  let lastRank = 0;
  const rows: GroupBattleRankRow[] = sorted.map((s, i) => {
    const rank =
      lastScore != null && s.groupScore === lastScore ? lastRank : i + 1;
    lastScore = s.groupScore;
    lastRank = rank;
    const above = i > 0 ? sorted[i - 1] : null;
    const scoreGapToAbove =
      above != null ? above.groupScore - s.groupScore : null;
    return {
      rank,
      squadId: s.squadId,
      name: s.name,
      groupScore: s.groupScore,
      memberCount: s.memberCount,
      memberScores: s.memberScores,
      prevRank: s.prevRank ?? null,
      scoreGapToAbove,
    };
  });

  return rows;
}

/** 同一 rank を共有する「同点グループ集合」の数（試験運用用） */
export function countTieGroups(rows: ReadonlyArray<GroupBattleRankRow>): number {
  const byRank = new Map<number, number>();
  for (const r of rows) {
    byRank.set(r.rank, (byRank.get(r.rank) ?? 0) + 1);
  }
  let ties = 0;
  for (const n of byRank.values()) {
    if (n > 1) ties += n;
  }
  return ties;
}

/** RANK UI 用 — 平均スコアは小数1桁（設計どおり） */
export function formatGroupBattleAvgPoints(value: number): string {
  const n = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(n)) return "0.0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
