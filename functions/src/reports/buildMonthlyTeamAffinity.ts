// synced from lib/reports/buildMonthlyTeamAffinity.ts — run npm run sync:monthly-report-builders
// 月次レポート「チーム相性」— ピックアップ・推した側・獲得 pt 上下位。
// docs/pro-subscription-plan.md §5
// functions/src/reports/buildMonthlyTeamAffinity.ts と同期すること。

import type { MonthlyReportTeam } from "./monthlyReportTypes";

export const MONTHLY_TEAM_AFFINITY_MIN_GAMES = 2;
export const MONTHLY_TEAM_AFFINITY_LIMIT = 3;

export type MonthlyTeamAffinityAgg = {
  teamId: string;
  abbr: string;
  games: number;
  wins: number;
  /** 獲得総合得点合計 */
  points: number;
};

function toRow(a: MonthlyTeamAffinityAgg): MonthlyReportTeam {
  return {
    teamId: a.teamId,
    abbr: a.abbr || a.teamId,
    games: a.games,
    wins: a.wins,
    losses: Math.max(0, a.games - a.wins),
    points: a.points,
  };
}

/**
 * ピックアップ内・推した側チームの集計 → 得意 / 苦手。
 * 並びの正は獲得 pt。最低 games ≥ minGames。足りなければ出る分だけ。
 */
export function buildMonthlyTeamAffinity(
  aggs: MonthlyTeamAffinityAgg[],
  opts?: { minGames?: number; limit?: number }
): { strong: MonthlyReportTeam[]; weak: MonthlyReportTeam[] } {
  const minGames = opts?.minGames ?? MONTHLY_TEAM_AFFINITY_MIN_GAMES;
  const limit = opts?.limit ?? MONTHLY_TEAM_AFFINITY_LIMIT;

  const eligible = aggs
    .filter((a) => a.teamId && a.games >= minGames)
    .slice()
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.games - a.games;
    });

  const strong = eligible.slice(0, limit).map(toRow);
  const strongIds = new Set(strong.map((t) => t.teamId));
  const weak = eligible
    .filter((a) => !strongIds.has(a.teamId))
    .slice(-limit)
    .reverse()
    .map(toRow);

  return { strong, weak };
}

/** posts 1件分を uid→team マップに加算するヘルパ */
export function accumulateTeamAffinityPost(
  map: Map<string, MonthlyTeamAffinityAgg>,
  input: {
    teamId: string;
    abbr?: string | null;
    isWin: boolean;
    points: number;
  }
) {
  const teamId = input.teamId;
  if (!teamId) return;
  const cur = map.get(teamId) ?? {
    teamId,
    abbr: "",
    games: 0,
    wins: 0,
    points: 0,
  };
  cur.games += 1;
  if (input.isWin) cur.wins += 1;
  cur.points += Number(input.points) || 0;
  if (!cur.abbr && input.abbr) cur.abbr = String(input.abbr);
  map.set(teamId, cur);
}
