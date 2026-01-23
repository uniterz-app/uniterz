// functions/src/shared/upset/upsetJudge.ts

export type MajoritySide = "home" | "away" | "draw";

export type UpsetJudgeInput = {
  market: {
    total: number;
    majoritySide: MajoritySide;
    majorityRatio: number;
  };
  result: {
    winnerSide: "home" | "away";
  };
  teams: {
    homeWins: number;
    awayWins: number;
  };
  thresholds: {
    minMarket: number;
    marketRatio: number;
    winDiff: number;
  };
};

export type UpsetJudgeResult = {
  isUpsetGame: boolean;
  meta?: {
    marketMajoritySide: "home" | "away";
    marketMajorityRatio: number;
    winDiff: number;
  };
};

export function upsetJudge(
  input: UpsetJudgeInput
): UpsetJudgeResult {
  const { market, result, teams, thresholds } = input;

  // ★ draw は Upset 対象外
  if (market.majoritySide === "draw") {
    return { isUpsetGame: false };
  }

  if (market.total < thresholds.minMarket) {
    return { isUpsetGame: false };
  }

  const winDiff =
    result.winnerSide === "home"
      ? teams.awayWins - teams.homeWins
      : teams.homeWins - teams.awayWins;

  const isUpset =
    market.majoritySide !== result.winnerSide &&
    market.majorityRatio >= thresholds.marketRatio &&
    winDiff >= thresholds.winDiff;

  if (!isUpset) return { isUpsetGame: false };

  return {
    isUpsetGame: true,
    meta: {
      marketMajoritySide: market.majoritySide,
      marketMajorityRatio: market.majorityRatio,
      winDiff,
    },
  };
}
