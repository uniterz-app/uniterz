import { judgeWin } from "./judgeWin";
import type { SettlementGameInput } from "./settlementGame";
import { getFootballLineScore } from "./settlementGame";

function paceCategory(totalGoals: number): "low" | "mid" | "high" {
  if (totalGoals <= 2) return "low";
  if (totalGoals <= 4) return "mid";
  return "high";
}

/** ノックアウトは進出側／それ以外はラインスコアで勝敗 */
export function footballWinnerCorrect(
  pred: { winner: string; score?: { home: number; away: number } },
  g: SettlementGameInput
): boolean {
  const line = getFootballLineScore(g);
  if (
    g.knockout &&
    g.advancingTeamId &&
    g.homeTeamId &&
    g.awayTeamId
  ) {
    if (pred.winner === "draw") return false;
    const advancedHome = g.advancingTeamId === g.homeTeamId;
    const actualWinner: "home" | "away" = advancedHome ? "home" : "away";
    return pred.winner === actualWinner;
  }
  return judgeWin(pred, line);
}

/**
 * サッカー総合得点（1試合あたり最大10）
 * 勝者ゲート: 外れなら 0
 * 的中時: 勝者4 + テンポ2 + 得失点差2 + 完全一致2
 */
export function calcPointsFootball(
  prediction: { winner: string; score: { home: number; away: number } },
  g: SettlementGameInput
): {
  points: number;
  basePoints: number;
  winnerCorrect: boolean;
  winPoints: number;
  diffPoints: number;
  totalPoints: number;
  paceMatch: boolean;
  diffMatch: boolean;
  exactMatch: boolean;
  diffError: number | null;
  totalError: number | null;
} {
  const predHome = prediction.score.home;
  const predAway = prediction.score.away;

  const winnerCorrect = footballWinnerCorrect(prediction, g);

  if (!winnerCorrect) {
    return {
      points: 0,
      basePoints: 0,
      winnerCorrect: false,
      winPoints: 0,
      diffPoints: 0,
      totalPoints: 0,
      paceMatch: false,
      diffMatch: false,
      exactMatch: false,
      diffError: null,
      totalError: null,
    };
  }

  const line = getFootballLineScore(g);
  const lh = line.home;
  const la = line.away;

  const winPoints = 4;

  const paceMatch =
    paceCategory(predHome + predAway) === paceCategory(lh + la);
  const pacePoints = paceMatch ? 2 : 0;

  const predDiff = predHome - predAway;
  const lineDiff = lh - la;
  const diffMatch = Math.abs(predDiff) === Math.abs(lineDiff);
  const diffPairPoints = diffMatch ? 2 : 0;

  const exactMatch = predHome === lh && predAway === la;
  const exactPoints = exactMatch ? 2 : 0;

  const diffPoints = pacePoints + diffPairPoints;
  const totalPoints = exactPoints;

  const basePoints = winPoints + diffPoints + totalPoints;

  const diffError = Math.abs(predDiff - lineDiff);
  const totalError =
    Math.abs(predHome - lh) + Math.abs(predAway - la);

  return {
    points: basePoints,
    basePoints,
    winnerCorrect: true,
    winPoints,
    diffPoints,
    totalPoints,
    paceMatch,
    diffMatch,
    exactMatch,
    diffError,
    totalError,
  };
}
