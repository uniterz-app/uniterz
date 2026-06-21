import type { RankingLeagueSource } from "./rankingLeagueSource";
import type { RankingPhase } from "./rankingPhase";
import type { PlayoffRoundKey } from "./playoffRound";
import type { WcRankingStage } from "./wcRankingStage";

/** WC All（overall）勝率ランキングの最低投稿数 */
export const WC_OVERALL_WIN_RATE_MIN_POSTS = 20;

/** WC グループステージ（qualifying）勝率ランキングの最低投稿数 */
export const WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = 20;

export function minPostsForWinRate(input: {
  rankingLeague?: RankingLeagueSource | null;
  phase?: RankingPhase;
  round?: PlayoffRoundKey | "overall";
  wcStage?: WcRankingStage | null;
}): number {
  const { rankingLeague, phase, round, wcStage } = input;

  if (rankingLeague === "worldcup" || wcStage != null) {
    if (wcStage === "qualifying") return WC_GROUP_STAGE_WIN_RATE_MIN_POSTS;
    if (wcStage === "overall") return WC_OVERALL_WIN_RATE_MIN_POSTS;
    return 1;
  }

  if (phase === "playoffs" && (round === "overall" || round === "r1")) {
    return 20;
  }
  return 1;
}
