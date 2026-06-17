/** Keep in sync with lib/rankings/wcRankingStage.ts */

export const WC_RANKING_STAGES = ["overall", "qualifying", "main"] as const;

export type WcRankingStage = (typeof WC_RANKING_STAGES)[number];

/** Keep in sync with lib/rankings/winRateMinPosts.ts */
export const WC_OVERALL_WIN_RATE_MIN_POSTS = 12;
export const WC_GROUP_STAGE_WIN_RATE_MIN_POSTS = 10;

export function minPostsForWcWinRate(stage: WcRankingStage): number {
  if (stage === "qualifying") return WC_GROUP_STAGE_WIN_RATE_MIN_POSTS;
  if (stage === "overall") return WC_OVERALL_WIN_RATE_MIN_POSTS;
  return 1;
}

export function isWcRankingStage(v: unknown): v is WcRankingStage {
  return v === "overall" || v === "qualifying" || v === "main";
}

export type GameWcStage = "qualifying" | "main";
