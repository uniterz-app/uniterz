/**
 * ガベージタイム抜きのチームレーティング。
 * 1 試合 = `nbaGameCleanRatings/{bdlGameId}`、シーズン合計 = `nbaTeamCleanRatings/{seasonKey}`。
 * レギュラーシーズン（カップ戦グループ〜準決勝を含む・カップ決勝は除く）のみ。
 */

export const NBA_GAME_CLEAN_RATINGS_COLLECTION = "nbaGameCleanRatings";
export const NBA_TEAM_CLEAN_RATINGS_COLLECTION = "nbaTeamCleanRatings";

/** play-by-play から数えた 1 チームの攻撃側の数（ポゼッション推定 = FGA + 0.44·FTA − OREB + TOV） */
export type NbaPossessionCounts = {
  pts: number;
  fga: number;
  fta: number;
  oreb: number;
  tov: number;
};

export type NbaCleanRatingsSide = {
  /** 試合全体 */
  all: NbaPossessionCounts;
  /** ガベージタイムを除いた分 */
  clean: NbaPossessionCounts;
};

export type NbaGameCleanRatingsDoc = {
  seasonKey: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  home: NbaCleanRatingsSide;
  away: NbaCleanRatingsSide;
  /** play-by-play の最終スコアが実際の最終スコアと合わない / 取れないまま諦めた試合は集計に入れない */
  incomplete?: true;
  builtAtMs: number;
};

export type NbaRatingTriple = {
  ortg: number;
  drtg: number;
  net: number;
  /** 1 試合平均ポゼッション（両チーム推定の平均） */
  poss: number;
};

export type NbaTeamCleanRatingsEntry = {
  games: number;
  all: NbaRatingTriple;
  clean: NbaRatingTriple;
  /** 全ポゼッションのうちガベージタイムだった割合（0–1） */
  garbagePossPct: number;
  /**
   * 対戦相手（とホーム / アウェー）補正でガベージ抜き NET に足す値。
   * 試合ごとのガベージ抜き得失点差（100 ポゼッションあたり）を SRS 方式で解いた値 − 補正前の平均
   */
  sosAdj?: number;
  /** 攻守を分けた相手補正（ガベージ抜き ORTG / DRTG に足す値） */
  sosOffAdj?: number;
  sosDefAdj?: number;
  /** 直近 10 試合のガベージ抜き NET（play-by-play の値そのまま） */
  last10?: { games: number; net: number };
};

export type NbaTeamCleanRatingsDoc = {
  seasonKey: string;
  games: number;
  teams: Record<string, NbaTeamCleanRatingsEntry>;
  builtAtMs: number;
};
