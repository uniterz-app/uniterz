import { calcScorePrecision } from "./calcScorePrecision";
import { predictionWin } from "./predictionWin";
import type { SettlementGameInput } from "./settlementGame";
import { getFootballLineScore, leagueToSport } from "./settlementGame";

function calcScoreError(pred: any, real: any) {
  return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}

export function calcPostResult({
  prediction,
  final,
  market,
  hadUpsetGame,
  league,
  settlementGame,
}: {
  prediction: any;
  final: { home: number; away: number };
  market: any;
  hadUpsetGame: boolean;
  league?: string;
  /** サッカーノックアウト・ラインスコアなど（省略時は旧 judgeWin のみ） */
  settlementGame?: SettlementGameInput | null;
}) {
  const gameSlice: SettlementGameInput =
    settlementGame ??
    ({
      homeScore: final.home,
      awayScore: final.away,
      league,
    } as SettlementGameInput);

  const isWin = predictionWin(prediction, gameSlice);

  const marketMajority = market.majoritySide;
  const isMajorityPick = prediction.winner === marketMajority;

  const precisionActual =
    leagueToSport(league) === "football"
      ? getFootballLineScore(gameSlice)
      : final;

  const scoreError = calcScoreError(prediction.score, precisionActual);

  const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
    predictedHome: prediction.score.home,
    predictedAway: prediction.score.away,
    actualHome: precisionActual.home,
    actualAway: precisionActual.away,
    league: league ?? "bj",
  });

  const pickSide = prediction.winner as "home" | "away" | "draw";
  const sport = leagueToSport(league);

  const upsetHit =
    hadUpsetGame &&
    isWin &&
    pickSide !== marketMajority &&
    (sport === "football" ||
      (pickSide !== "draw" && marketMajority !== "draw"));

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