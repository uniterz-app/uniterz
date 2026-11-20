/**
 * Firestore `nbaLeagueHub/{seasonKey}` — 順位ページ LEAGUE タブ（常に今季）。
 * 日次 / 試合後 ingest が既存スナップショットから組み直す。BDL は叩かない。
 */
import type { NbaPlayerShotZoneId } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";

export const NBA_LEAGUE_HUB_COLLECTION = "nbaLeagueHub";
/**
 * 1 doc 1MiB に収まらない分を別 doc に置く。`{season}_matchups`（選手の matchups / guardedBy）と
 * `{season}_lineups`（チームの lineups / lineupBoards）。読みは loadNbaLeagueHubSnapshot が本体に戻す。
 */
export const NBA_LEAGUE_HUB_DETAIL_COLLECTION = "nbaLeagueHubDetail";

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
  "drive_fg_pct",
  "drive_passes",
  "drive_tov",
  "potential_ast",
  "ast_pts_created",
  "secondary_ast",
  "ft_ast",
  "pct_assisted_2pt",
  "pct_assisted_3pt",
  "screen_ast_pts",
  "touches",
  "sec_per_touch",
  "dist_miles",
  "speed",
  "opp_lt10_pct",
  "opp_gt15_pct",
  /** エースを守った時間（分）。マッチアップ集計 */
  "ace_guard_min",
  /** エースの普段の FG% − 守ったときの FG%。正なら抑えている */
  "ace_suppress",
  /** 相手の得点上位3人を守った時間（分） */
  "tough_guard_min",
  /** その相手たちの普段の eFG% − 守ったときの FG% */
  "tough_suppress",
  "cns_fg_pct",
  "pullup_fg_pct",
  "deflections",
  "contested_shots",
  "contested_2pt",
  "contested_3pt",
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

/** 守備側が付いた相手。時間の長い順 */
export type LeagueHubPlayerMatchup = LeagueHubPlayerRef & {
  minutes: number;
  /** 守ったときの FG%。0–1 */
  fgPct: number;
  fgm: number;
  fga: number;
  /** そのシュートを打った選手の今季 FG%。0–1 */
  usualFgPct?: number;
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
  /** DF。今季、誰をマークしたか。時間の長い 8 人 */
  matchups?: LeagueHubPlayerMatchup[];
  /** OF。今季、誰にマークされたか。時間の長い 8 人。fgPct は自分のシュート */
  guardedBy?: LeagueHubPlayerMatchup[];
  /** コートにいるとき / いないときの得失点（100 ポゼッションあたり） */
  onOff?: LeagueHubOnOff;
};

export type LeagueHubOnOff = {
  onNet: number;
  offNet: number;
  onMin: number;
  offMin: number;
};

export type LeagueHubLineup = {
  names: string[];
  min: number;
  net: number;
  /** 100 ポゼッションあたりの得点 / 失点 */
  off?: number;
  def?: number;
  /** 一緒に出ていたあいだの得失点 */
  pm?: number;
  /** この組が出た試合数 */
  games?: number;
};

export type LeagueHubLineupBoard = {
  size: 2 | 3 | 4 | 5;
  /** 一緒に出た時間が長い順 */
  most: LeagueHubLineup[];
  best: LeagueHubLineup[];
  worst: LeagueHubLineup[];
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

/** 前季と今季の 1 試合平均得点 */
export type LeagueHubPtsDeltaRow = LeagueHubPlayerRef & {
  pts: number;
  prevPts: number;
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

export const LEAGUE_HUB_POS_DEF_STATS = ["pts", "reb", "ast", "fg3m"] as const;
export type LeagueHubPosDefStat = (typeof LEAGUE_HUB_POS_DEF_STATS)[number];

export type LeagueHubPositionDefense = Record<
  "G" | "F" | "C",
  {
    pts: number;
    rank: number;
    /** REB / AST / 3PM（古い doc には無い。順位 1 = 最少） */
    stats?: Partial<Record<LeagueHubPosDefStat, { value: number; rank: number }>>;
  } | null
>;

/** 対戦相手の平均勝率（今の順位表で計算） */
export type LeagueHubTeamSchedule = {
  /** 終わった試合の相手 */
  played: number | null;
  playedGames: number;
  /** 残り試合の相手 */
  remaining: number | null;
  remainingGames: number;
};

/** UNITERZ ユーザーの勝敗予想と結果（終了したレギュラーの試合だけ） */
export type LeagueHubTeamPicks = {
  games: number;
  /** 各試合でこのチームを選んだ割合の合計 = 予想の勝ち数 */
  expectedWins: number;
  wins: number;
  /** 多数派の予想が当たった試合 */
  majorityHits: number;
};

/** チームのスタイルマップ（ROSTER / FORM）用。勝率・割合は 0–1 */
export const LEAGUE_HUB_TEAM_STYLE_METRICS = [
  "aceShare",
  "scorerCount",
  "benchShare",
  "payrollM",
  "experience",
  "heightCm",
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
  /** 4 日で 3 試合目 / 東・西カンファレンスの相手（古い doc には無い） */
  threeInFour?: LeagueHubRecord | null;
  vsEast?: LeagueHubRecord | null;
  vsWest?: LeagueHubRecord | null;
  posDef: LeagueHubPositionDefense | null;
  schedule?: LeagueHubTeamSchedule | null;
  picks?: LeagueHubTeamPicks | null;
  /** 古い doc には無い */
  m?: Partial<Record<LeagueHubTeamStyleMetric, number>>;
  /** 同時に出た 5 人。時間の長い順 */
  lineups?: LeagueHubLineup[];
  /** 2〜5 人。ベストとワーストはネットレーティング */
  lineupBoards?: LeagueHubLineupBoard[];
};

/** 条件 A / B の 1 試合平均得点（ホーム / アウェー、B2B 2 日目 / それ以外） */
export type LeagueHubPlayerSplitRow = LeagueHubPlayerRef & {
  a: number;
  b: number;
  diff: number;
  aGames: number;
  bGames: number;
};

export type LeagueHubPlayerSplits = {
  /** ホームのほうが取る / アウェーのほうが取る */
  home: LeagueHubPlayerSplitRow[];
  away: LeagueHubPlayerSplitRow[];
  /** B2B 2 日目に落ちる / 落ちない */
  b2bDrop: LeagueHubPlayerSplitRow[];
  b2bUp: LeagueHubPlayerSplitRow[];
};

/** 年俸と働き（Game Score 平均）の順位の差 */
export type LeagueHubValueRow = LeagueHubPlayerRef & {
  salaryM: number;
  gameScore: number;
  salaryRank: number;
  gameScoreRank: number;
  /** 比べた選手の数 */
  of: number;
};

export const LEAGUE_HUB_MILESTONE_STATS = ["pts", "reb", "ast", "fg3m"] as const;
export type LeagueHubMilestoneStat = (typeof LEAGUE_HUB_MILESTONE_STATS)[number];

/** 通算の節目まで（前季までのキャリア合計 + 今季は試合ログの合計） */
export type LeagueHubMilestoneRow = LeagueHubPlayerRef & {
  stat: LeagueHubMilestoneStat;
  target: number;
  remaining: number;
  /** 今季の 1 試合平均で割った残り試合数 */
  gamesAway: number;
  /** 前季までに平均 × 試合数の概算が混じる（数本ずれ得る） */
  approx?: boolean;
};

/** 前季までの通算（キャリア doc から一度だけ作る） */
export const NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION = "nbaLeagueHubCareerBase";
export type LeagueHubCareerBase = Record<LeagueHubMilestoneStat | "games", number> & {
  /** 正確な合計が無く平均 × 試合数で足した試合数（未設定の古いキャッシュは全部概算） */
  approxGames?: number;
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
  /** 前季比で平均得点が上がった / 下がった（古い doc には無い） */
  ptsDelta?: { up: LeagueHubPtsDeltaRow[]; down: LeagueHubPtsDeltaRow[] } | null;
  week: LeagueHubWeek | null;
  topGames?: LeagueHubTopGames | null;
  rookies: LeagueHubLadderRow[];
  mvp: LeagueHubLadderRow[];
  dpoy?: LeagueHubLadderRow[];
  sixth?: LeagueHubLadderRow[];
  mip?: LeagueHubLadderRow[];
  teams: LeagueHubTeamRow[];
  /** 以下は古い doc には無い */
  playerSplits?: LeagueHubPlayerSplits | null;
  value?: { best: LeagueHubValueRow[]; worst: LeagueHubValueRow[] } | null;
  milestones?: LeagueHubMilestoneRow[] | null;
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
