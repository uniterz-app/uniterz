/** WC ゴール得点者ボーナス（functions 側。lib/wc/goalScorer.ts と同ロジック） */

import { resolveWcGameGoalScorers } from "./wc/goalScorerResolve";

export const WC_GOAL_SCORER_BONUS_POINTS = 2;

type Pick = { playerId?: string; teamId?: string };
type Scorer = Pick & { ownGoal?: boolean };

type GoalScorerContext = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
};

function normalizePick(raw: unknown): Pick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as Pick).playerId ?? "").trim();
  const teamId = String((raw as Pick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

export function calcWcGoalScorerBonus(
  league: string | null | undefined,
  prediction: { goalScorer?: unknown } | null | undefined,
  goalScorers: unknown,
  ctx?: GoalScorerContext
): number {
  if (String(league ?? "").toLowerCase() !== "wc") return 0;
  const pick = normalizePick(prediction?.goalScorer);
  if (!pick) return 0;
  const list = resolveWcGameGoalScorers(goalScorers, ctx ?? {});
  const hit = list.some(
    (g) =>
      !g.ownGoal &&
      g.playerId === pick.playerId &&
      g.teamId === pick.teamId
  );
  return hit ? WC_GOAL_SCORER_BONUS_POINTS : 0;
}
