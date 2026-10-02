import type {
  NbaTeamRecentGame,
  NbaTeamStreak,
  NbaTeamUpcomingGame,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export type NbaTeamGameLogWl = { wins: number; losses: number };

export type NbaTeamHeadToHeadEntry = {
  oppTeamId: string;
  oppAbbr: string;
  wins: number;
  losses: number;
};

/** 1 チーム分（Firestore スナップショット / API 共通） */
export type NbaTeamGameLogSlice = {
  teamId: string;
  season: string;
  seasonRecord: NbaTeamGameLogWl;
  last10Record: NbaTeamGameLogWl;
  streak: NbaTeamStreak;
  recentGames: NbaTeamRecentGame[];
  upcomingGames: NbaTeamUpcomingGame[];
  homeAwaySplit: {
    home: NbaTeamGameLogWl;
    away: NbaTeamGameLogWl;
  };
  conferenceSplit: {
    vsEast: NbaTeamGameLogWl;
    vsWest: NbaTeamGameLogWl;
  };
  /** シーズン final 相手別 W-L（試合数降順） */
  headToHead: NbaTeamHeadToHeadEntry[];
  /** 当該チームの final 試合数（0 = まだ試合なし） */
  finalCount: number;
  scheduledCount: number;
};

/** Firestore `nbaTeamGameLogs/{seasonKey}` */
export const NBA_TEAM_GAME_LOGS_COLLECTION = "nbaTeamGameLogs";

export type NbaTeamGameLogsSnapshotSource = NbaStatsSnapshotSource;

export type NbaTeamGameLogsFirestoreDoc = {
  source?: unknown;
  updatedAt?: { toDate(): Date };
  seasonKey?: unknown;
  seasonYear?: unknown;
  teamCount?: unknown;
  gameCount?: unknown;
  teams?: unknown;
};

export type NbaTeamGameLogsBundle = {
  seasonKey: string;
  seasonYear: number;
  gameCount: number;
  teams: Record<string, NbaTeamGameLogSlice>;
};

export type NbaTeamGameLogsApiPayload = {
  ok: true;
  season: string;
  bundle: NbaTeamGameLogsBundle;
  source: NbaTeamGameLogsSnapshotSource;
  updatedAt: string | null;
  teamCount: number;
};

/** GET /api/nba/team-game-log?team= 用 */
export type NbaTeamGameLogApiPayload = {
  ok: true;
  season: string;
  teamId: string;
  log: NbaTeamGameLogSlice;
  source: NbaTeamGameLogsSnapshotSource;
  updatedAt: string | null;
};
