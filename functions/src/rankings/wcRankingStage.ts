/** Keep in sync with lib/rankings/wcRankingStage.ts */

export const WC_RANKING_STAGES = ["overall", "qualifying", "main"] as const;

export type WcRankingStage = (typeof WC_RANKING_STAGES)[number];

export function isWcRankingStage(v: unknown): v is WcRankingStage {
  return v === "overall" || v === "qualifying" || v === "main";
}

export type GameWcStage = "qualifying" | "main";
