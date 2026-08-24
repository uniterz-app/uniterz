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
  averagesSeasonKey?: unknown;
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
  /** ロスター行のシーズン平均がどの季か（今季未出場時は前季） */
  averagesSeasonKey: string;
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

export type NbaTeamRosterSliceApiPayload = {
  ok: true;
  season: string;
  averagesSeasonKey: string;
  teamId: string;
  team: NbaTeamRosterDocTeam | null;
  source: NbaTeamRostersSnapshotSource;
  updatedAt: string | null;
};

export type NbaPlayerRosterHitApiPayload = {
  ok: true;
  season: string;
  averagesSeasonKey: string;
  playerId: string;
  hit: {
    teamId: string;
    teamName: string;
    player: NbaTeamRosterDocTeam["players"][number];
  } | null;
  source: NbaTeamRostersSnapshotSource;
  updatedAt: string | null;
};
