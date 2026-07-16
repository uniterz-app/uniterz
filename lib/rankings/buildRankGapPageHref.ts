import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_ROUND_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

/** Rank Intel Gap 画面への href（ランキング文脈をクエリで引き継ぐ） */
export function buildRankGapPageHref(
  basePath: "/mobile/rankings/gap" | "/web/rankings/gap",
  context: {
    rankingLeague: RankingLeagueSource;
    round?: PlayoffRoundKey;
    wcStage?: WcRankingStage | null;
  }
): string {
  const q = new URLSearchParams();
  q.set(RANKINGS_TAB_LEAGUE_PARAM, context.rankingLeague);
  if (context.rankingLeague === "nba" && context.round) {
    q.set(RANKINGS_TAB_ROUND_PARAM, context.round);
  }
  if (context.rankingLeague === "worldcup" && context.wcStage) {
    q.set(RANKINGS_TAB_WC_STAGE_PARAM, context.wcStage);
  }
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
