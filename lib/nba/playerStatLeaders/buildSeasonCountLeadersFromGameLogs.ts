/**
 * Firestore `nbaPlayerGameLogs` → Player Leaders のシーズン回数ボード。
 * 20+/30+ PTS・ダブルダブル・トリプルダブル。
 */
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import type { PlayerGameLogsForLeaders } from "@/lib/nba/playerStatLeaders/buildLast10LeadersFromGameLogs";
import {
  countPlayerSeasonStatMilestones,
  NBA_PLAYER_COUNT_LEADER_METRIC_IDS,
  type NbaPlayerCountLeaderMetric,
} from "@/lib/predict/nbaPlayerCountLeaderMetrics";
import type { NbaPlayerStatLeaderRow } from "@/lib/predict/nbaPlayerStatLeadersMocks";

const LEADER_BOARD_LIMIT = 30;
const MIN_GAMES = 1;

export type SeasonCountLeadersBoard = Record<
  NbaPlayerCountLeaderMetric,
  NbaPlayerStatLeaderRow[]
>;

export function emptySeasonCountLeadersBoard(): SeasonCountLeadersBoard {
  const board = {} as SeasonCountLeadersBoard;
  for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) {
    board[id] = [];
  }
  return board;
}

export function buildSeasonCountLeadersFromGameLogs(
  players: readonly PlayerGameLogsForLeaders[]
): SeasonCountLeadersBoard {
  const board = emptySeasonCountLeadersBoard();
  const buckets: Record<
    NbaPlayerCountLeaderMetric,
    NbaPlayerStatLeaderRow[]
  > = emptySeasonCountLeadersBoard();

  for (const player of players) {
    if (player.gameLogs.length < MIN_GAMES) continue;
    const counts = countPlayerSeasonStatMilestones(player.gameLogs);
    const base = {
      playerId: player.playerId,
      playerName: player.playerName,
      teamId: player.teamId,
      conference: nbaConferenceForTeam(player.teamId) ?? "west",
      gamesPlayed: player.gameLogs.length,
    };
    for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) {
      const value = counts[id];
      if (value <= 0) continue;
      buckets[id].push({ ...base, value });
    }
  }

  for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) {
    board[id] = buckets[id]
      .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName))
      .slice(0, LEADER_BOARD_LIMIT);
  }
  return board;
}

export function seasonCountBoardHasRows(board: SeasonCountLeadersBoard): boolean {
  return NBA_PLAYER_COUNT_LEADER_METRIC_IDS.some((id) => board[id].length > 0);
}
