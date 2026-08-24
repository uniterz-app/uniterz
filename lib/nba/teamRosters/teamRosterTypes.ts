import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export type NbaTeamRosterDocTeam = {
  teamId: string;
  teamName: string;
  players: NbaRosterPlayer[];
};

/** Firestore `nbaTeamRosters/{seasonKey}` */
export type NbaTeamRostersFirestoreDoc = {
  source?: unknown;
  updatedAt?: { toDate(): Date };
  seasonKey?: unknown;
  playerCount?: unknown;
  teamCount?: unknown;
  teams?: unknown;
};

export type NbaTeamRostersBundle = {
  seasonKey: string;
  teams: Record<string, NbaTeamRosterDocTeam>;
};

export type NbaTeamRostersSnapshotSource = NbaStatsSnapshotSource;

export type NbaTeamRostersApiPayload = {
  ok: true;
  season: string;
  bundle: NbaTeamRostersBundle;
  source: NbaTeamRostersSnapshotSource;
  updatedAt: string | null;
  playerCount: number;
  teamCount: number;
};

export type NbaMatchupRosterApiPayload = {
  ok: true;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  home: NbaTeamRosterDocTeam | null;
  away: NbaTeamRosterDocTeam | null;
  source: NbaTeamRostersSnapshotSource;
  updatedAt: string | null;
};
