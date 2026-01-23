import { judgeWin } from "./judgeWin";
import { calcScorePrecision } from "./calcScorePrecision";

function calcBrier(isWin: boolean, confidence: number) {
  const p = Math.min(0.999, Math.max(0.001, confidence / 100));
  const y = isWin ? 1 : 0;
  return Math.round((p - y) * (p - y) * 10000) / 10000;
}

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
  const conf = Math.min(99, Math.max(1, prediction.confidence));
  const brier = calcBrier(isWin, conf);
  const calibrationError = Math.abs(conf / 100 - (isWin ? 1 : 0));

  const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
    predictedHome: prediction.score.home,
    predictedAway: prediction.score.away,
    actualHome: final.home,
    actualAway: final.away,
    league: league ?? "bj",
  });

  const upsetHit = hadUpsetGame && isWin;

  return {
    isWin,
    scoreError,
    brier,
    calibrationError,
    confidence: conf,
    scorePrecision: totalPt,
    scorePrecisionDetail: { homePt, awayPt, diffPt },
    marketMajority,
    isMajorityPick,
    upsetHit,
  };
}
