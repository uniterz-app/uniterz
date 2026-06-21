import { resolveWcGameGoalScorers } from "@/lib/wc/goalScorer";

export function tournamentGoalCountKey(
  teamId: string,
  playerId: string
): string {
  return `${teamId}:${playerId}`;
}

type GameDocLike = {
  status?: unknown;
  final?: unknown;
  goalScorers?: unknown;
  home?: { teamId?: unknown };
  away?: { teamId?: unknown };
  homeTeamId?: unknown;
  awayTeamId?: unknown;
};

function isFinalGame(data: GameDocLike): boolean {
  if (data.final === true) return true;
  return String(data.status ?? "").toLowerCase() === "final";
}

/** 試合ごとの goalScorers から大会累計ゴール数（OG 除く） */
export function aggregateWcTournamentGoalCounts(
  games: ReadonlyArray<GameDocLike>
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const game of games) {
    if (!isFinalGame(game)) continue;
    const raw = game.goalScorers;
    if (!Array.isArray(raw) || raw.length === 0) continue;

    const homeTeamId =
      (typeof game.home?.teamId === "string" ? game.home.teamId : null) ??
      (typeof game.homeTeamId === "string" ? game.homeTeamId : null);
    const awayTeamId =
      (typeof game.away?.teamId === "string" ? game.away.teamId : null) ??
      (typeof game.awayTeamId === "string" ? game.awayTeamId : null);

    const resolved = resolveWcGameGoalScorers(raw, { homeTeamId, awayTeamId });
    if (!resolved.ok) continue;

    for (const scorer of resolved.scorers) {
      if (scorer.ownGoal) continue;
      const key = tournamentGoalCountKey(scorer.teamId, scorer.playerId);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

export function readTournamentGoalCount(
  counts: ReadonlyMap<string, number> | null | undefined,
  teamId: string,
  playerId: string
): number {
  if (!counts) return 0;
  return counts.get(tournamentGoalCountKey(teamId, playerId)) ?? 0;
}
