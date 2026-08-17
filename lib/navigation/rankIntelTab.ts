export const RANK_INTEL_TAB_PARAM = "intelTab" as const;

export type RankIntelTab = "gap" | "shadow";

export function isRankIntelTab(v: string | null | undefined): v is RankIntelTab {
  return v === "gap" || v === "shadow";
}
