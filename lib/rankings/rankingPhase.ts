export type RankingPhase = "play_in" | "playoffs";

export const RANKING_PHASES: RankingPhase[] = ["play_in", "playoffs"];

export function isRankingPhase(v: string | null | undefined): v is RankingPhase {
  return v === "play_in" || v === "playoffs";
}
