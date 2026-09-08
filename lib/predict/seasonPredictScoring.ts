/**
 * シーズン予想（順位 / アワード）の採点定数 — 確定稿。
 * UI・将来の採点ジョブの正。playoffCutoffBonus は v1 対象外。
 */

/** 順位予想: 公式最終順位との差で加点 */
export const SEASON_STANDINGS_SCORE = {
  exact: 10,
  within1: 4,
  within2: 2,
  maxPerConference: 15 * 10,
  maxTotal: 15 * 10 * 2,
} as const;

/** @deprecated 互換エイリアス — `SEASON_STANDINGS_SCORE` を使う */
export const SEASON_STANDINGS_SCORE_PREVIEW = SEASON_STANDINGS_SCORE;

/** アワード種数（`NBA_SEASON_AWARD_DEFS.length` と一致させる） */
export const SEASON_AWARDS_COUNT = 7;

/** アワード予想: 公式受賞者との完全一致のみ */
export const SEASON_AWARDS_SCORE = {
  exact: 25,
  maxTotal: 25 * SEASON_AWARDS_COUNT,
} as const;

/** @deprecated 互換エイリアス — `SEASON_AWARDS_SCORE` を使う */
export const SEASON_AWARDS_SCORE_PREVIEW = SEASON_AWARDS_SCORE;
