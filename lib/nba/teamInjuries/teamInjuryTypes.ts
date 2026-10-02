import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

/** Firestore `nbaTeamInjuries/{seasonKey}` の 1 チーム分 */
export type NbaTeamInjuryDocTeam = NbaTeamInjuryEntry[];

export type NbaTeamInjuriesFirestoreDoc = {
  source?: unknown;
  updatedAt?: { toDate(): Date };
  seasonKey?: unknown;
  teamCount?: unknown;
  teams?: unknown;
};

export type NbaTeamInjuriesBundle = {
  seasonKey: string;
  teams: Record<string, NbaTeamInjuryDocTeam>;
};

export type NbaTeamInjuriesSnapshotSource = NbaStatsSnapshotSource;

export type NbaTeamInjuriesApiPayload = {
  ok: true;
  season: string;
  bundle: NbaTeamInjuriesBundle;
  source: NbaTeamInjuriesSnapshotSource;
  updatedAt: string | null;
  teamCount: number;
};

export type NbaTeamInjuryApiPayload = {
  ok: true;
  season: string;
  teamId: string;
  injuries: NbaTeamInjuryDocTeam;
  source: NbaTeamInjuriesSnapshotSource;
  updatedAt: string | null;
};
