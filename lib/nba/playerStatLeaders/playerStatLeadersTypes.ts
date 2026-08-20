import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

/** Firestore `nbaLeaguePlayerStats/{seasonKey}` と API レスポンス共通 */
export type NbaPlayerStatLeadersSnapshotSource = NbaStatsSnapshotSource;

export type NbaPlayerStatLeadersApiPayload = {
  ok: true;
  season: string;
  bundle: NbaPlayerStatLeadersBundle;
  source: NbaPlayerStatLeadersSnapshotSource;
  /** ISO8601。mock フォールバック時は null */
  updatedAt: string | null;
};

/**
 * コンパクト Firestore 形。メトリクス×30人をそのまま積むと 1MB を超えやすいので
 * 選手マスタは1回、各指標は `[playerId, gp, value]`。
 */
export type NbaPlayerStatLeadersFirestoreDoc = {
  asOfLabel?: unknown;
  source?: unknown;
  updatedAt?: { toDate(): Date };
  players?: unknown;
  season?: unknown;
  last10?: unknown;
};
