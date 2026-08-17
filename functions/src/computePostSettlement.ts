import { calcPostResult } from "./calcPostResult";
import { calcUpsetPoints } from "./calcUpsetPoints";
import { calcStreakBonus } from "./calcStreakBonus";
import { calcPointsFootball } from "./footballTotalScore";
import type { SettlementGameInput } from "./settlementGame";
import { leagueToSport } from "./settlementGame";
import type { UpdatedUserStreakResult } from "./updateUserStreak";
import { calcNbaTopScorerBonus } from "./nbaTopScorerBonus";
import { calcWcGoalScorerBonus } from "./wcGoalScorerBonus";

const round1 = (v: number) => Math.round(v * 10) / 10;

/** 誤差 0 → max、誤差 zeroAt → 0 のコサイン減衰（C¹ 連続） */
function smoothScoreDecay(maxPoints: number, error: number, zeroAt: number) {
  if (!Number.isFinite(error) || error <= 0) return maxPoints;
  if (error >= zeroAt) return 0;
  const factor = 0.5 * (1 + Math.cos((Math.PI * error) / zeroAt));
  return round1(maxPoints * factor);
}

const MARGIN_MAX = 4;
const MARGIN_ZERO_AT = 15;
const COMBINED_TOTAL_MAX = 2;
const COMBINED_TOTAL_ZERO_AT = 11;

function calcDiffPointsGradient(diffError: number) {
  return smoothScoreDecay(MARGIN_MAX, diffError, MARGIN_ZERO_AT);
}

function calcTotalPointsGradient(totalError: number) {
  return smoothScoreDecay(COMBINED_TOTAL_MAX, totalError, COMBINED_TOTAL_ZERO_AT);
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
  const totalPoints = calcTotalPointsGradient(totalError);

  const basePoints = round1(winPoints + diffPoints + totalPoints);

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
  goalScorerBonus: number;
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
  game: SettlementGameInput & {
    countsForRanking?: boolean;
    goalScorers?: unknown;
    leadingScorers?: unknown;
  };
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

  const leagueKey = String(game.league ?? "").toLowerCase();
  const goalScorerBonus =
    leagueKey === "nba"
      ? calcNbaTopScorerBonus(game.league, p.prediction, game.leadingScorers)
      : calcWcGoalScorerBonus(game.league, p.prediction, game.goalScorers, {
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
        });

  const totalPoints =
    baseScore.basePoints + upsetBonus + streakBonus + goalScorerBonus;

  return {
    totalPoints,
    result,
    baseScore,
    upsetPoints,
    upsetBonus,
    streakBonus,
    goalScorerBonus,
    activeWinStreak,
  };
}
