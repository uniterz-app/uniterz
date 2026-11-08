/**
 * Firestore `nbaLeagueHub/{seasonKey}` — 順位ページ LEAGUE タブ（常に今季）。
 * 日次 / 試合後 ingest が既存スナップショットから組み直す。BDL は叩かない。
 */
import type { NbaPlayerShotZoneId } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";

export const NBA_LEAGUE_HUB_COLLECTION = "nbaLeagueHub";

export const LEAGUE_HUB_PLAYER_METRICS = [
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "stocks",
  "tov",
  "fga",
  "fg3a",
  "fg3m",
  "fg3_pct",
  "usg",
  "ts_pct",
  "ast_pct",
  "tov_pct",
  "pts_paint",
  "restricted_fg_pct",
  "matchup_fg_pct",
  "clutch_usg",
  "clutch_fg_pct",
  "clutch_pts",
  "pie",
  "eff",
] as const;

export type LeagueHubPlayerMetric = (typeof LEAGUE_HUB_PLAYER_METRICS)[number];

export type LeagueHubPlayerRef = {
  playerId: string;
  /** 一覧表記（S.Curry） */
  name: string;
  teamId: string;
};

export type LeagueHubPlayer = LeagueHubPlayerRef & {
  pos: "G" | "F" | "C" | null;
  gp: number;
  min: number;
  /** 1 試合平均。率は 0–1 */
  m: Partial<Record<LeagueHubPlayerMetric, number>>;
};

export type LeagueHubZoneRow = LeagueHubPlayerRef & {
  fgPct: number;
  /** 1 試合平均の試投 */
  fga: number;
};

export type LeagueHubZoneBoard = {
  id: NbaPlayerShotZoneId;
  short: string;
  /** 成功率ランキングの最低試投（1 試合平均） */
  minFga: number;
  byPct: LeagueHubZoneRow[];
  byFga: LeagueHubZoneRow[];
};

export const LEAGUE_HUB_HIGH_STATS = ["pts", "reb", "ast", "fg3m", "stl", "blk"] as const;
export type LeagueHubHighStat = (typeof LEAGUE_HUB_HIGH_STATS)[number];

export type LeagueHubGameHigh = LeagueHubPlayerRef & {
  value: number;
  oppAbbr: string;
  dateLabel: string;
  gameId: string;
  pts: number;
  reb: number;
  ast: number;
};

export type LeagueHubCountRow = LeagueHubPlayerRef & { count: number };

export type LeagueHubTrendRow = LeagueHubPlayerRef & {
  /** 直近 5 試合の平均得点 */
  recent: number;
  /** それより前の平均得点 */
  before: number;
  diff: number;
};

export type LeagueHubWeekRow = LeagueHubPlayerRef & {
  games: number;
  wins: number;
  pts: number;
  reb: number;
  ast: number;
  /** Hollinger Game Score の週平均 */
  gameScore: number;
};

export type LeagueHubWeek = {
  /** M/D（米国東部） */
  startLabel: string;
  endLabel: string;
  /** 今週途中（先週に試合が無い開幕直後） */
  inProgress: boolean;
  east: LeagueHubWeekRow | null;
  west: LeagueHubWeekRow | null;
  top: LeagueHubWeekRow[];
};

export type LeagueHubLadderRow = LeagueHubPlayerRef & {
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  teamWins: number | null;
  teamLosses: number | null;
};

export type LeagueHubRecord = { wins: number; losses: number };

export type LeagueHubPositionDefense = Record<
  "G" | "F" | "C",
  { pts: number; rank: number } | null
>;

export type LeagueHubTeamRow = {
  teamId: string;
  conference: NbaConferenceId | null;
  wins: number;
  losses: number;
  streak: { kind: "W" | "L"; count: number } | null;
  last10: LeagueHubRecord | null;
  home: LeagueHubRecord | null;
  away: LeagueHubRecord | null;
  vsOver500: LeagueHubRecord | null;
  b2b: LeagueHubRecord | null;
  /** 5 点差以内で決着 */
  close: LeagueHubRecord | null;
  posDef: LeagueHubPositionDefense | null;
};

export type NbaLeagueHubDoc = {
  seasonKey: string;
  builtAtMs: number;
  players: LeagueHubPlayer[];
  zones: LeagueHubZoneBoard[];
  highs: Record<LeagueHubHighStat, LeagueHubGameHigh[]>;
  streaks: { pts20: LeagueHubCountRow[]; doubleDouble: LeagueHubCountRow[] };
  counts: {
    pts30: LeagueHubCountRow[];
    doubleDouble: LeagueHubCountRow[];
    tripleDouble: LeagueHubCountRow[];
  };
  hot: LeagueHubTrendRow[];
  cold: LeagueHubTrendRow[];
  week: LeagueHubWeek | null;
  rookies: LeagueHubLadderRow[];
  mvp: LeagueHubLadderRow[];
  teams: LeagueHubTeamRow[];
};

export type NbaLeagueHubApiPayload = {
  ok: true;
  season: string;
  hub: NbaLeagueHubDoc | null;
  updatedAt: string | null;
};
