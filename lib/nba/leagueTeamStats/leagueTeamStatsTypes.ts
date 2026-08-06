import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";

/** Firestore `nbaLeagueTeamStats/{seasonKey}` と API レスポンス共通 */
export type NbaLeagueTeamStatsSnapshotSource = "firestore" | "mock";

export type NbaLeagueTeamStatsApiPayload = {
  ok: true;
  season: string;
  bundle: NbaLeagueTeamStatsBundle;
  source: NbaLeagueTeamStatsSnapshotSource;
  /** ISO8601。mock フォールバック時は null */
  updatedAt: string | null;
};

export type NbaLeagueTeamStatsFirestoreDoc = {
  season: unknown;
  last10: unknown;
  asOfLabel?: unknown;
  updatedAt?: { toDate(): Date };
  source?: unknown;
};
