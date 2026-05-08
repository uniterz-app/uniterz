// functions/src/upsetJudge.ts

export type MajoritySide = "home" | "away" | "draw";

export type UpsetJudgeInput = {
  market: {
    total: number;
    majoritySide: MajoritySide;
    majorityRatio: number;
  };
  /** 試合結果（引き分け可）。ノックアウトでは進出側のみ home / away */
  actualOutcome: MajoritySide;
  sport: "basketball" | "football";
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
    marketMajoritySide: MajoritySide;
    marketMajorityRatio: number;
    winDiff: number;
  };
};

export function upsetJudge(input: UpsetJudgeInput): UpsetJudgeResult {
  const { market, actualOutcome, sport, teams, thresholds } = input;

  // NBA/B1: 多数派が引き分けのときは upset 判定しない（試合も基本的に決着）
  if (sport === "basketball" && market.majoritySide === "draw") {
    return { isUpsetGame: false };
  }

  if (market.total < thresholds.minMarket) {
    return { isUpsetGame: false };
  }

  let winDiff = 0;
  if (actualOutcome === "home") {
    winDiff = teams.awayWins - teams.homeWins;
  } else if (actualOutcome === "away") {
    winDiff = teams.homeWins - teams.awayWins;
  }

  const isUpset =
    market.majoritySide !== actualOutcome &&
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
