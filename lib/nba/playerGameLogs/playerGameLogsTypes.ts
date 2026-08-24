/**
 * Firestore `nbaPlayerGameLogs/{seasonKey}/players/{playerId}`
 */
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_GAME_LOGS_COLLECTION = "nbaPlayerGameLogs";
export const NBA_PLAYER_GAME_LOGS_PLAYERS_SUB = "players";

export type NbaPlayerGameLogsDoc = {
  playerId: string;
  teamId: string | null;
  seasonKey: string;
  gameLogs: NbaPlayerGameLog[];
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerGameLogsApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  gameLogs: NbaPlayerGameLog[];
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};
