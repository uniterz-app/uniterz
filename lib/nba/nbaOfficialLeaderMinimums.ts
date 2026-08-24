/**
 * NBA.com Statistical Minimums（リーグリーダー資格）。
 * @see https://www.nba.com/stats/help/statminimums
 *
 * シュート%は「決め本数」。それ以外はチーム試合数の 70%。
 * シーズン途中はチームの消化試合数（Game #）で比例。
 */

export const NBA_LEADER_SEASON_GAMES = 82;

/** フルシーズン FG% 資格: 300 FGM */
export const NBA_FULL_MIN_FG_MAKES = 300;
/** フルシーズン FT% 資格: 125 FTM */
export const NBA_FULL_MIN_FT_MAKES = 125;
/** フルシーズン 3P% 資格: 82 3PM */
export const NBA_FULL_MIN_FG3_MAKES = 82;

/** PTS / REB / AST 等（シュート%以外） */
export const NBA_NON_PCT_GAME_FRACTION = 0.7;

function clampTeamGames(teamGamesPlayed: number): number {
  if (!Number.isFinite(teamGamesPlayed) || teamGamesPlayed <= 0) return 0;
  return Math.min(
    NBA_LEADER_SEASON_GAMES,
    Math.max(0, Math.floor(teamGamesPlayed))
  );
}

/** Game # に応じた「決め本数」下限（ceil(full * N / 82)） */
export function nbaProgressiveMakesMin(
  fullSeasonMin: number,
  teamGamesPlayed: number
): number {
  const g = clampTeamGames(teamGamesPlayed);
  if (g <= 0) return fullSeasonMin;
  return Math.ceil((fullSeasonMin * g) / NBA_LEADER_SEASON_GAMES);
}

/** シュート%以外: チーム試合数の 70%（ceil）に出場していること */
export function nbaNonPctMinGames(teamGamesPlayed: number): number {
  const g = clampTeamGames(teamGamesPlayed);
  if (g <= 0) return 0;
  return Math.ceil(NBA_NON_PCT_GAME_FRACTION * g);
}

export function qualifiesForFgPctLeaders(input: {
  teamGamesPlayed: number;
  fieldGoalsMade: number;
}): boolean {
  const need = nbaProgressiveMakesMin(
    NBA_FULL_MIN_FG_MAKES,
    input.teamGamesPlayed
  );
  return input.fieldGoalsMade >= need;
}

export function qualifiesForFtPctLeaders(input: {
  teamGamesPlayed: number;
  freeThrowsMade: number;
}): boolean {
  const need = nbaProgressiveMakesMin(
    NBA_FULL_MIN_FT_MAKES,
    input.teamGamesPlayed
  );
  return input.freeThrowsMade >= need;
}

export function qualifiesForFg3PctLeaders(input: {
  teamGamesPlayed: number;
  threesMade: number;
}): boolean {
  const need = nbaProgressiveMakesMin(
    NBA_FULL_MIN_FG3_MAKES,
    input.teamGamesPlayed
  );
  return input.threesMade >= need;
}

export function qualifiesForNonPctLeaders(input: {
  teamGamesPlayed: number;
  gamesPlayed: number;
}): boolean {
  const need = nbaNonPctMinGames(input.teamGamesPlayed);
  return input.gamesPlayed >= need;
}
