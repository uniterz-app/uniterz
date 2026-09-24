/**
 * Firestore `nbaPlayerCareerSeasons/{playerId}`
 */
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_CAREER_SEASONS_COLLECTION = "nbaPlayerCareerSeasons";

export type NbaPlayerCareerSeasonsDoc = {
  playerId: string;
  teamId: string | null;
  /** 表示用氏名（ロスター外ヒーロー用） */
  playerName?: string | null;
  position?: string | null;
  jerseyNumber?: string | null;
  height?: string | null;
  weight?: string | null;
  country?: string | null;
  college?: string | null;
  draftYear?: number | null;
  draftRound?: number | null;
  draftNumber?: number | null;
  /** ingest 時点のシーズンキー */
  asOfSeasonKey: string;
  regular: NbaPlayerCareerSeasonRow[];
  playoffs: NbaPlayerCareerSeasonRow[];
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerCareerBio = {
  playerName: string | null;
  position: string | null;
  jerseyNumber: string | null;
  height: string | null;
  weight: string | null;
  country: string | null;
  college: string | null;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
};

export type NbaPlayerCareerSeasonsApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  playerName: string | null;
  bio: NbaPlayerCareerBio | null;
  careerSeasons: {
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  };
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};
