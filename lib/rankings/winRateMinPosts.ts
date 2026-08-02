import type { RankingLeagueSource } from "./rankingLeagueSource";

/** NBA シーズン勝率ランキングの最低投稿数（functions と同期） */
export const NBA_SEASON_WIN_RATE_MIN_POSTS = 20;

/** @deprecated WC 廃止 */
export const WC_OVERALL_WIN_RATE_MIN_POSTS = NBA_SEASON_WIN_RATE_MIN_POSTS;
/** @deprecated WC 廃止 */
export const WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = NBA_SEASON_WIN_RATE_MIN_POSTS;
/** @deprecated WC 廃止 */
export const WC_KNOCKOUT_WIN_RATE_MIN_POSTS = NBA_SEASON_WIN_RATE_MIN_POSTS;

export function minPostsForWinRate(_input: {
  rankingLeague?: RankingLeagueSource | null;
  wcStage?: unknown;
}): number {
  return NBA_SEASON_WIN_RATE_MIN_POSTS;
}
