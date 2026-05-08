import { calcPostResult } from "./calcPostResult";
import { calcUpsetPoints } from "./calcUpsetPoints";
import { calcStreakBonus } from "./calcStreakBonus";
import { calcPointsFootball } from "./footballTotalScore";
import type { SettlementGameInput } from "./settlementGame";
import { leagueToSport } from "./settlementGame";
import type { UpdatedUserStreakResult } from "./updateUserStreak";

function lerpByRange(
  value: number,
  min: number,
  max: number,
  start: number,
  end: number
) {
  if (value <= min) return start;
  if (value >= max) return end;
  const t = (value - min) / (max - min);
  return start + (end - start) * t;
}

function calcDiffPointsGradient(diffError: number) {
  if (diffError <= 0) return 4;
  if (diffError <= 3) return lerpByRange(diffError, 0, 3, 4, 3);
  if (diffError <= 6) return lerpByRange(diffError, 3, 6, 3, 2);
  if (diffError <= 10) return lerpByRange(diffError, 6, 10, 2, 1);
  if (diffError <= 14) return lerpByRange(diffError, 10, 14, 1, 0);
  return 0;
}

function calcPointsV3({
  predHome,
  predAway,
  finalHome,
  finalAway,
}: {
  predHome: number;
  predAway: number;
  finalHome: number;
  finalAway: number;
}) {
  const finalDiff = finalHome - finalAway;
  const predDiff = predHome - predAway;

  const winnerCorrect =
    (finalDiff > 0 && predDiff > 0) || (finalDiff < 0 && predDiff < 0);

  const diffError = Math.abs(finalDiff - predDiff);
  const totalError = Math.abs(
    finalHome + finalAway - (predHome + predAway)
  );

  if (!winnerCorrect) {
    return {
      points: 0,
      basePoints: 0,
      winnerCorrect: false,
      winPoints: 0,
      diffPoints: 0,
      totalPoints: 0,
      diffError,
      totalError,
    };
  }

  const winPoints = 4;
  const diffPoints = calcDiffPointsGradient(diffError);

  let totalPoints = 0;
  if (totalError <= 3) totalPoints = 2;
  else if (totalError <= 7) totalPoints = 1;

  const basePoints = winPoints + diffPoints + totalPoints;

  return {
    points: basePoints,
    basePoints,
    winnerCorrect: true,
    winPoints,
    diffPoints,
    totalPoints,
    diffError,
    totalError,
  };
}

export type PostSettlementComputed = {
  totalPoints: number;
  result: ReturnType<typeof calcPostResult>;
  baseScore: ReturnType<typeof calcPointsV3> | ReturnType<typeof calcPointsFootball>;
  upsetPoints: number;
  upsetBonus: number;
  streakBonus: number;
  activeWinStreak: number;
};

/**
 * finalizePost と同じ inputs で pointsV3（totalPoints）などを算出。
 * 分布集計では settled 済み投稿も含めて呼ぶ。
 */
export function computePostSettlement({
  p,
  game,
  market,
  hadUpsetGame,
  streakResultMap,
}: {
  p: FirebaseFirestore.DocumentData;
  game: SettlementGameInput & { countsForRanking?: boolean };
  market: {
    majoritySide: string;
    majorityRatio: number;
    total: number;
  };
  hadUpsetGame: boolean;
  streakResultMap: Map<string, UpdatedUserStreakResult>;
}): PostSettlementComputed {
  const final = { home: game.homeScore, away: game.awayScore };

  const settlementGame: SettlementGameInput = {
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    league: game.league,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    regulationEtScore: game.regulationEtScore,
    advancingTeamId: game.advancingTeamId,
    knockout: game.knockout,
  };

  const result = calcPostResult({
    prediction: p.prediction,
    final,
    market,
    hadUpsetGame,
    league: game.league,
    settlementGame,
  });

  const upsetPoints = result.upsetHit
    ? calcUpsetPoints(market.majorityRatio)
    : 0;

  const upsetBonus = result.upsetHit ? 2 : 0;

  const predHome = p.prediction?.score?.home;
  const predAway = p.prediction?.score?.away;
  const canScore = Number.isFinite(predHome) && Number.isFinite(predAway);

  const sport = leagueToSport(game.league);

  const baseScore = canScore
    ? sport === "football"
      ? calcPointsFootball(p.prediction, settlementGame)
      : calcPointsV3({
          predHome,
          predAway,
          finalHome: final.home,
          finalAway: final.away,
        })
    : {
        points: 0,
        basePoints: 0,
        winnerCorrect: false,
        winPoints: 0,
        diffPoints: 0,
        totalPoints: 0,
        diffError: null,
        totalError: null,
      };

  const streakInfo = p.authorUid ? streakResultMap.get(p.authorUid) : undefined;
  const activeWinStreak =
    streakInfo?.activeWinStreak ??
    (typeof p.stats?.pointsV3Detail?.activeWinStreak === "number"
      ? p.stats.pointsV3Detail.activeWinStreak
      : 0);

  const streakBonus = calcStreakBonus(activeWinStreak);

  const totalPoints = baseScore.basePoints + upsetBonus + streakBonus;

  return {
    totalPoints,
    result,
    baseScore,
    upsetPoints,
    upsetBonus,
    streakBonus,
    activeWinStreak,
  };
}
