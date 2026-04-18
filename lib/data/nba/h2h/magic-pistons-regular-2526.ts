import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MAGIC_PISTONS_TEAM_IDS = ["nba-magic", "nba-pistons"] as const;

/** H2Hカードは左=Pistons、右=Magic で固定 */
const H2H_LEFT = "Pistons";
const H2H_RIGHT = "Magic";

/**
 * 2025-26 レギュラー Magic vs Pistons（4試合）
 * 出典: StatMuse 等の公開スコアに基づく（今季直接対決 2-2）
 */
export const magicPistonsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-magic-pistons-2025-10-29",
    dateEt: "2025-10-29",
    dateJst: "2025-10-30",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 135,
    scoreRight: 116,
    homeTeamSide: "left",
    injuriesLeft: ["J. Ivey"],
    injuriesRight: ["J. Cain", "M. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2025-11-28",
    dateEt: "2025-11-28",
    dateJst: "2025-11-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 112,
    homeTeamSide: "right",
    injuriesLeft: ["M. Sasser"],
    injuriesRight: ["P. Banchero", "J. Cain", "M. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 106,
    scoreRight: 92,
    homeTeamSide: "left",
    injuriesLeft: ["I. Stewart"],
    injuriesRight: ["A. Black", "F. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2026-04-06",
    dateEt: "2026-04-06",
    dateJst: "2026-04-07",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 123,
    homeTeamSide: "right",
    injuriesLeft: ["C. Cunningham", "I. Stewart"],
    injuriesRight: [],
  },
];

function magicPistonsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  magicPpg: number;
  pistonsPpg: number;
  magicPapg: number;
  pistonsPapg: number;
  magicNet: number;
  pistonsNet: number;
} {
  let magicPts = 0;
  let pistonsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`magicPistonsH2H: missing scores for ${g.id}`);
    }
    /* 左列=Pistons、右列=Magic */
    pistonsPts += g.scoreLeft;
    magicPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const pistonsPpg = r1(pistonsPts / n);
  const magicPpg = r1(magicPts / n);
  const pistonsPapg = magicPpg;
  const magicPapg = pistonsPpg;
  const pistonsNet = r1(pistonsPpg - pistonsPapg);
  const magicNet = r1(magicPpg - magicPapg);
  return {
    magicPpg,
    pistonsPpg,
    magicPapg,
    pistonsPapg,
    magicNet,
    pistonsNet,
  };
}

export function magicPistonsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-magic") || !ids.has("nba-pistons")) {
    return null;
  }

  const {
    magicPpg,
    pistonsPpg,
    magicPapg,
    pistonsPapg,
    magicNet,
    pistonsNet,
  } = magicPistonsH2HStatsFromGames(magicPistonsH2HGames);

  if (homeTeamId === "nba-pistons") {
    return {
      homeAvgPts: pistonsPpg,
      awayAvgPts: magicPpg,
      homeAvgPtsAllowed: pistonsPapg,
      awayAvgPtsAllowed: magicPapg,
      homeNetRtg: pistonsNet,
      awayNetRtg: magicNet,
    };
  }
  if (homeTeamId === "nba-magic") {
    return {
      homeAvgPts: magicPpg,
      awayAvgPts: pistonsPpg,
      homeAvgPtsAllowed: magicPapg,
      awayAvgPtsAllowed: pistonsPapg,
      homeNetRtg: magicNet,
      awayNetRtg: pistonsNet,
    };
  }
  return null;
}
