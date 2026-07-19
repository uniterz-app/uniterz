import type { RankingLeagueSource } from "./rankingLeagueSource";
import type { WcRankingStage } from "./wcRankingStage";

/** WC All（overall）勝率ランキングの最低投稿数 */
export const WC_OVERALL_WIN_RATE_MIN_POSTS = 20;

/** WC グループステージ（qualifying）勝率ランキングの最低投稿数 */
export const WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = 20;

/** WC ノックアウト（main）勝率ランキングの最低投稿数 */
export const WC_KNOCKOUT_WIN_RATE_MIN_POSTS = 4;

/** NBA シーズン勝率ランキングの最低投稿数（functions と同期） */
export const NBA_SEASON_WIN_RATE_MIN_POSTS = 20;

export function minPostsForWinRate(input: {
  rankingLeague?: RankingLeagueSource | null;
  wcStage?: WcRankingStage | null;
}): number {
  const { rankingLeague, wcStage } = input;

  if (rankingLeague === "worldcup" || wcStage != null) {
    if (wcStage === "qualifying") return WC_GROUP_STAGE_WIN_RATE_MIN_POSTS;
    if (wcStage === "overall") return WC_OVERALL_WIN_RATE_MIN_POSTS;
    if (wcStage === "main") return WC_KNOCKOUT_WIN_RATE_MIN_POSTS;
    return 1;
  }

  return NBA_SEASON_WIN_RATE_MIN_POSTS;
}
