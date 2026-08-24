/**
 * Firestore `nbaPlayerCareerSeasons/{playerId}`
 */
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_CAREER_SEASONS_COLLECTION = "nbaPlayerCareerSeasons";

export type NbaPlayerCareerSeasonsDoc = {
  playerId: string;
  teamId: string | null;
  /** ingest 時点のシーズンキー */
  asOfSeasonKey: string;
  regular: NbaPlayerCareerSeasonRow[];
  playoffs: NbaPlayerCareerSeasonRow[];
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerCareerSeasonsApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  careerSeasons: {
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  };
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};
