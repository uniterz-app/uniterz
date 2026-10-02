/**
 * Firestore `nbaPlayerShotZones/{seasonKey}/players/{playerId}`
 */
import type { NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_SHOT_ZONES_COLLECTION = "nbaPlayerShotZones";
export const NBA_PLAYER_SHOT_ZONES_PLAYERS_SUB = "players";

export type NbaPlayerShotZonesDoc = {
  playerId: string;
  teamId: string | null;
  seasonKey: string;
  shotZones: NbaPlayerShotZone[];
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerShotZonesApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  shotZones: NbaPlayerShotZone[];
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};
