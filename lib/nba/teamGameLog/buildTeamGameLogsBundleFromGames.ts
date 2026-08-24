import {
  NBA_EAST_TEAM_IDS,
  NBA_WEST_TEAM_IDS,
} from "@/lib/nba/nbaConferenceTeams";
import {
  buildTeamGameLogFromGames,
  emptyTeamGameLog,
} from "@/lib/nba/teamGameLog/buildTeamGameLogFromGames";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";

export const NBA_ALL_TEAM_IDS: readonly string[] = [
  ...NBA_EAST_TEAM_IDS,
  ...NBA_WEST_TEAM_IDS,
];

/**
 * シーズン `games` 行から 30 チーム分の game log を一括構築。
 * 試合が無いチームは空 / 0（モックなし）。
 */
export function buildTeamGameLogsBundleFromGames(input: {
  seasonKey: string;
  games: Array<Record<string, unknown> & { id?: string }>;
  nowMs?: number;
}): {
  teams: Record<string, NbaTeamGameLogSlice>;
  teamCount: number;
  gameCount: number;
} {
  const seasonKey = input.seasonKey.trim();
  const games = input.games;
  const nowMs = input.nowMs;
  const teams: Record<string, NbaTeamGameLogSlice> = {};

  for (const teamId of NBA_ALL_TEAM_IDS) {
    teams[teamId] = buildTeamGameLogFromGames({
      teamId,
      season: seasonKey,
      games,
      nowMs,
    });
  }

  // games にだけ出てくる未知 teamId があっても落とさない（将来拡張）
  const known = new Set(NBA_ALL_TEAM_IDS);
  for (const g of games) {
    for (const side of ["homeTeamId", "awayTeamId"] as const) {
      const id = String(g[side] ?? "").trim();
      if (!id || known.has(id) || teams[id]) continue;
      teams[id] = buildTeamGameLogFromGames({
        teamId: id,
        season: seasonKey,
        games,
        nowMs,
      });
    }
  }

  return {
    teams,
    teamCount: Object.keys(teams).length,
    gameCount: games.length,
  };
}

export function emptyTeamGameLogsBundle(seasonKey: string): Record<
  string,
  NbaTeamGameLogSlice
> {
  const teams: Record<string, NbaTeamGameLogSlice> = {};
  for (const teamId of NBA_ALL_TEAM_IDS) {
    teams[teamId] = emptyTeamGameLog(teamId, seasonKey);
  }
  return teams;
}
