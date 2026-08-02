/** WC ゴール得点者ボーナス — NBA-only 運用では常に 0（league=wc の新規精算なし） */

export const WC_GOAL_SCORER_BONUS_POINTS = 2;

export function calcWcGoalScorerBonus(
  league: string | null | undefined,
  _prediction: { goalScorer?: unknown } | null | undefined,
  _goalScorers: unknown,
  _ctx?: { homeTeamId?: string | null; awayTeamId?: string | null }
): number {
  if (String(league ?? "").toLowerCase() !== "wc") return 0;
  return 0;
}
