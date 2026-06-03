/** サッカー：合計ゴール数のテンポ区分（総合得点・スコア精度で共通） */
export type FootballPaceCategory = "low" | "mid" | "high";

export function footballPaceCategory(totalGoals: number): FootballPaceCategory {
  if (totalGoals <= 2) return "low";
  if (totalGoals <= 4) return "mid";
  return "high";
}
