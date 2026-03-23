import { judgeWin } from "./judgeWin";
import { calcScorePrecision } from "./calcScorePrecision";

function calcScoreError(pred: any, real: any) {
  return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}

export function calcPostResult({
  prediction,
  final,
  market,
  hadUpsetGame,
  league,
}: {
  prediction: any;
  final: { home: number; away: number };
  market: any;
  hadUpsetGame: boolean;
  league?: string;
}) {
  const isWin = judgeWin(prediction, final);

  const marketMajority = market.majoritySide;
  const isMajorityPick = prediction.winner === marketMajority;

  const scoreError = calcScoreError(prediction.score, final);

  const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
    predictedHome: prediction.score.home,
    predictedAway: prediction.score.away,
    actualHome: final.home,
    actualAway: final.away,
    league: league ?? "bj",
  });

  const pickSide = prediction.winner as "home" | "away" | "draw";
  const upsetHit =
    hadUpsetGame &&
    isWin &&
    pickSide !== "draw" &&
    marketMajority !== "draw" &&
    pickSide !== marketMajority;

  return {
    isWin,
    scoreError,
    scorePrecision: totalPt,
    scorePrecisionDetail: { homePt, awayPt, diffPt },
    marketMajority,
    isMajorityPick,
    upsetHit,
  };
}