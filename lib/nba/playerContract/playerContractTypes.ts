/**
 * Firestore `nbaPlayerContracts/{seasonKey}/players/{playerId}`
 */
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_CONTRACTS_COLLECTION = "nbaPlayerContracts";
export const NBA_PLAYER_CONTRACTS_PLAYERS_SUB = "players";

export type NbaPlayerContractDoc = {
  playerId: string;
  teamId: string | null;
  seasonKey: string;
  contract: NbaPlayerContractSummary;
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerContractApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  contract: NbaPlayerContractSummary | null;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};
