/**
 * Firestore `nbaPlayerSeasonMetrics/{seasonKey}/players/{playerId}`
 * リーグ表 Top30 と別。詳細 How They Play / 順位用の全出場選手メトリクス。
 */
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export const NBA_PLAYER_SEASON_METRICS_COLLECTION = "nbaPlayerSeasonMetrics";
export const NBA_PLAYER_SEASON_METRICS_PLAYERS_SUB = "players";

export type NbaPlayerSeasonMetricCell = {
  value: number;
  /** 1-indexed。出場資格を満たした母集団内の順位 */
  rank: number;
};

export type NbaPlayerSeasonMetricsDoc = {
  playerId: string;
  teamId: string | null;
  seasonKey: string;
  gamesPlayed: number;
  metrics: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>;
  source: NbaStatsSnapshotSource;
  updatedAt?: { toDate(): Date } | null;
};

export type NbaPlayerSeasonMetricsApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  teamId: string | null;
  gamesPlayed: number;
  metrics: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};

/** ingest 書き込み用（updatedAt は FieldValue） */
export type NbaPlayerSeasonMetricsWrite = {
  playerId: string;
  teamId: string | null;
  gamesPlayed: number;
  metrics: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>;
};
