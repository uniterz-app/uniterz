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
    winDiff: number; // 互換のため残す（判定では使わない）
  };
};

export type UpsetJudgeResult = {
  isUpsetGame: boolean;
  meta?: {
    marketMajoritySide: "home" | "away";
    marketMajorityRatio: number;
    winDiff: number; // meta には残す
  };
};

export function upsetJudge(input: UpsetJudgeInput): UpsetJudgeResult {
  const { market, result, teams, thresholds } = input;

  // draw は Upset 対象外
  if (market.majoritySide === "draw") {
    return { isUpsetGame: false };
  }

  // 市場サンプル不足は除外
  if (market.total < thresholds.minMarket) {
    return { isUpsetGame: false };
  }

  // meta用に winDiff は算出して保持（判定には使わない）
  const winDiff =
    result.winnerSide === "home"
      ? teams.awayWins - teams.homeWins
      : teams.homeWins - teams.awayWins;

  // Upset判定は「市場偏りのみ」
  const isUpset =
    market.majoritySide !== result.winnerSide &&
    market.majorityRatio >= thresholds.marketRatio;

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