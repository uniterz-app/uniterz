import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const WARRIORS_SUNS_TEAM_IDS = ["nba-warriors", "nba-suns"] as const;

/** H2Hカードは左=Suns、右=Warriors で固定 */
const H2H_LEFT = "Suns";
const H2H_RIGHT = "Warriors";

/** 2025-26 レギュラー Warriors vs Suns（4試合） */
export const warriorsSunsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-warriors-suns-2025-11-04",
    dateEt: "2025-11-04",
    dateJst: "2025-11-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 118,
    homeTeamSide: "right",
    injuriesLeft: ["D. Brooks", "J. Green"],
    injuriesRight: ["A. Horford", "D. Melton", "A. Toohey"],
  },
  {
    id: "h2h-warriors-suns-2025-12-18",
    dateEt: "2025-12-18",
    dateJst: "2025-12-19",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 99,
    scoreRight: 98,
    homeTeamSide: "left",
    injuriesLeft: ["J. Green"],
    injuriesRight: ["P. Spencer", "A. Horford"],
  },
  {
    id: "h2h-warriors-suns-2025-12-20",
    dateEt: "2025-12-20",
    dateJst: "2025-12-21",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 119,
    homeTeamSide: "right",
    injuriesLeft: ["J. Green", "G. Allen"],
    injuriesRight: ["A. Horford", "Seth Curry", "J. Kuminga"],
  },
  {
    id: "h2h-warriors-suns-2026-02-05",
    dateEt: "2026-02-05",
    dateJst: "2026-02-06",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 97,
    scoreRight: 101,
    homeTeamSide: "left",
    injuriesLeft: ["D. Booker", "J. Green"],
    injuriesRight: [
      "Seth Curry",
      "S. Curry",
      "J. Butler",
      "L. Cryer",
      "K. Porzingis",
    ],
  },
];

function warriorsSunsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  warriorsPpg: number;
  sunsPpg: number;
  warriorsPapg: number;
  sunsPapg: number;
  warriorsNet: number;
  sunsNet: number;
} {
  let warriorsPts = 0;
  let sunsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`warriorsSunsH2H: missing scores for ${g.id}`);
    }
    sunsPts += g.scoreLeft;
    warriorsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sunsPpg = r1(sunsPts / n);
  const warriorsPpg = r1(warriorsPts / n);
  const sunsPapg = warriorsPpg;
  const warriorsPapg = sunsPpg;
  const sunsNet = r1(sunsPpg - sunsPapg);
  const warriorsNet = r1(warriorsPpg - warriorsPapg);
  return {
    warriorsPpg,
    sunsPpg,
    warriorsPapg,
    sunsPapg,
    warriorsNet,
    sunsNet,
  };
}

export function warriorsSunsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-warriors") || !ids.has("nba-suns")) {
    return null;
  }

  const {
    warriorsPpg,
    sunsPpg,
    warriorsPapg,
    sunsPapg,
    warriorsNet,
    sunsNet,
  } = warriorsSunsH2HStatsFromGames(warriorsSunsH2HGames);

  if (homeTeamId === "nba-suns") {
    return {
      homeAvgPts: sunsPpg,
      awayAvgPts: warriorsPpg,
      homeAvgPtsAllowed: sunsPapg,
      awayAvgPtsAllowed: warriorsPapg,
      homeNetRtg: sunsNet,
      awayNetRtg: warriorsNet,
    };
  }
  if (homeTeamId === "nba-warriors") {
    return {
      homeAvgPts: warriorsPpg,
      awayAvgPts: sunsPpg,
      homeAvgPtsAllowed: warriorsPapg,
      awayAvgPtsAllowed: sunsPapg,
      homeNetRtg: warriorsNet,
      awayNetRtg: sunsNet,
    };
  }
  return null;
}
