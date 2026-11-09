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
  "min",
  "fta",
  "fta_rate",
  "ft_pct",
  "drives",
  "drive_pts",
  /** drive_pts ÷ drives（ingest で計算） */
  "drive_ppd",
  "cns_fg_pct",
  "pullup_fg_pct",
  "deflections",
  "contested_shots",
  "reb_pct",
  "box_outs",
  "reb_chances",
  "reb_chance_pct",
  "reb_contest_pct",
  "ortg",
  "drtg",
  "pct_pts_3",
  "pct_pts_paint",
  /** STL + BLK + ディフレクション + コンテスト（守備系マップの上位選び） */
  "def_activity",
  /** 試合ごとの得点の標準偏差（試合ログから） */
  "pts_sd",
  /** 36 分あたりのファウル（試合ログから） */
  "pf36",
] as const;

export const LEAGUE_HUB_POSITIONS = ["G", "F", "C"] as const;
export type LeagueHubPosition = (typeof LEAGUE_HUB_POSITIONS)[number];

export type LeagueHubPlayerMetric = (typeof LEAGUE_HUB_PLAYER_METRICS)[number];

export type LeagueHubPlayerRef = {
  playerId: string;
  /** 一覧表記（S.Curry） */
  name: string;
  teamId: string;
};

export type LeagueHubPlayer = LeagueHubPlayerRef & {
  /** 先頭のポジション */
  pos: LeagueHubPosition | null;
  /** G-F なら [G, F]。絞り込みは両方に出す */
  positions?: LeagueHubPosition[];
  gp: number;
  min: number;
  /** 1 試合平均。率は 0–1 */
  m: Partial<Record<LeagueHubPlayerMetric, number>>;
};

export type LeagueHubZoneRow = LeagueHubPlayerRef & {
  fgPct: number;
  /** 1 試合平均の試投 */
  fga: number;
  /** 今季合計の試投 / 成功 */
  fgaTotal: number;
  fgm: number;
};

/** shot_charts があるときはアーク上の 3P を 45 度・トップに分ける（above_break_3 は出ない） */
export type LeagueHubZoneId = NbaPlayerShotZoneId | "left_wing_3" | "top_3" | "right_wing_3";

export type LeagueHubZoneBoard = {
  id: LeagueHubZoneId;
  short: string;
  /** 成功率ランキングの最低試投（1 試合平均） */
  minFga: number;
  /** 成功率ランキングの最低試投（シーズン合計 = minFga × リーグ最多試合数） */
  minTotal?: number;
  /** 全選手のこのエリアの成功数 ÷ 試投数 */
  leagueFgPct?: number | null;
  byPct: LeagueHubZoneRow[];
  byFga: LeagueHubZoneRow[];
  /** ポジション別の同じ 2 つのランキング */
  byPos?: Record<LeagueHubPosition, { byPct: LeagueHubZoneRow[]; byFga: LeagueHubZoneRow[] }>;
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

/** 直近 7 日間の 1 試合（Game Score 順・1 人 1 試合） */
export type LeagueHubTopGame = LeagueHubPlayerRef & {
  gameId: string;
  oppAbbr: string;
  home: boolean;
  result: "W" | "L";
  dateLabel: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg3m: number;
  gameScore: number;
};

export type LeagueHubTopGames = {
  /** M/D（米国東部） */
  startLabel: string;
  endLabel: string;
  games: LeagueHubTopGame[];
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
  /** MVP: 資格者の中での PIE 順位 */
  pieRank?: number;
  /** 新人: 資格者の中での Game Score 順位と平均 */
  gameScore?: number;
  gameScoreRank?: number;
  /** 新人: 指名（巡・順位）。ドラフト外は null */
  draftRound?: number | null;
  draftNumber?: number | null;
  /** DPOY: 出場時の守備レーティング・STL / BLK・マークした相手の FG%（0–1） */
  drtg?: number;
  stl?: number;
  blk?: number;
  matchupFgPct?: number;
  /** シックスマン: 先発がわかる試合のうちベンチ / 先発の数（gameScore はベンチ出場時の平均） */
  benchGames?: number;
  startGames?: number;
  /** MIP: 前季の平均得点と PIE の増分 */
  prevPts?: number;
  pieDelta?: number;
  /** 先週の同じラダーの順位（圏外 / 初週は null） */
  prevRank?: number | null;
};

/** ラダー順位の週次スナップショット（playerId → 順位） */
export type LeagueHubLadderWeek = {
  weekStartMs: number;
  mvp: Record<string, number>;
  rookies: Record<string, number>;
  dpoy?: Record<string, number>;
  sixth?: Record<string, number>;
  mip?: Record<string, number>;
};

export type LeagueHubRecord = { wins: number; losses: number };

export type LeagueHubPositionDefense = Record<
  "G" | "F" | "C",
  { pts: number; rank: number } | null
>;

/** チームのスタイルマップ（ROSTER / FORM）用。勝率・割合は 0–1 */
export const LEAGUE_HUB_TEAM_STYLE_METRICS = [
  "winPct",
  "aceShare",
  "scorerCount",
  "benchShare",
  "payrollM",
  "experience",
  "heightCm",
  "netAll",
  "netL5",
  "marginSd",
  "homePct",
  "awayPct",
  "vsOverPct",
  "vsUnderPct",
  "restPct",
  "b2bPct",
] as const;

export type LeagueHubTeamStyleMetric = (typeof LEAGUE_HUB_TEAM_STYLE_METRICS)[number];

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
  /** 古い doc には無い */
  m?: Partial<Record<LeagueHubTeamStyleMetric, number>>;
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
  topGames?: LeagueHubTopGames | null;
  rookies: LeagueHubLadderRow[];
  mvp: LeagueHubLadderRow[];
  dpoy?: LeagueHubLadderRow[];
  sixth?: LeagueHubLadderRow[];
  mip?: LeagueHubLadderRow[];
  teams: LeagueHubTeamRow[];
  /** 今週の順位（週が変わったら ladderPrev へ回す） */
  ladderWeek?: LeagueHubLadderWeek | null;
  ladderPrev?: LeagueHubLadderWeek | null;
};

export type NbaLeagueHubApiPayload = {
  ok: true;
  season: string;
  hub: NbaLeagueHubDoc | null;
  updatedAt: string | null;
};
