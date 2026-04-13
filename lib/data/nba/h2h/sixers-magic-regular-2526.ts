import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SIXERS_MAGIC_TEAM_IDS = ["nba-76ers", "nba-magic"] as const;

/** H2Hカードは左=76ers、右=Magic で固定 */
const H2H_LEFT = "76ers";
const H2H_RIGHT = "Magic";

/** 2025-26 レギュラー 76ers vs Magic（3試合） */
export const sixersMagicH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-sixers-magic-2025-10-27",
    dateEt: "2025-10-27",
    dateJst: "2025-10-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 136,
    scoreRight: 124,
    homeTeamSide: "left",
    injuriesLeft: ["D. Barlow", "J. Embiid", "P. George", "J. McCain", "T. Watford"],
    injuriesRight: ["J. Cain", "C. Castleton", "M. Wagner", "O. Robinson"],
  },
  {
    id: "h2h-sixers-magic-2025-11-25",
    dateEt: "2025-11-25",
    dateJst: "2025-11-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 144,
    homeTeamSide: "left",
    injuriesLeft: [
      "A. Bona",
      "V. Edgecombe",
      "J. Embiid",
      "P. George",
      "K. Oubre Jr.",
    ],
    injuriesRight: ["P. Banchero", "C. Castleton", "J. Isaac", "F. Wagner"],
  },
  {
    id: "h2h-sixers-magic-2026-01-09",
    dateEt: "2026-01-09",
    dateJst: "2026-01-10",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 91,
    homeTeamSide: "right",
    injuriesLeft: ["M. Beauchamp", "J. Broome", "J. Edwards"],
    injuriesRight: [
      "C. Castleton",
      "O. Robinson",
      "J. Suggs",
      "F. Wagner",
      "M. Wagner",
      "T. da Silva",
    ],
  },
];

function sixersMagicH2HStatsFromGames(games: NbaH2HGameCard[]): {
  sixersPpg: number;
  magicPpg: number;
  sixersPapg: number;
  magicPapg: number;
  sixersNet: number;
  magicNet: number;
} {
  let sixersPts = 0;
  let magicPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`sixersMagicH2H: missing scores for ${g.id}`);
    }
    sixersPts += g.scoreLeft;
    magicPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sixersPpg = r1(sixersPts / n);
  const magicPpg = r1(magicPts / n);
  const sixersPapg = magicPpg;
  const magicPapg = sixersPpg;
  const magicNet = r1(magicPpg - magicPapg);
  const sixersNet = r1(sixersPpg - sixersPapg);
  return {
    sixersPpg,
    magicPpg,
    sixersPapg,
    magicPapg,
    sixersNet,
    magicNet,
  };
}

export function sixersMagicH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-76ers") || !ids.has("nba-magic")) {
    return null;
  }

  const {
    sixersPpg,
    magicPpg,
    sixersPapg,
    magicPapg,
    sixersNet,
    magicNet,
  } = sixersMagicH2HStatsFromGames(sixersMagicH2HGames);

  if (homeTeamId === "nba-magic") {
    return {
      homeAvgPts: magicPpg,
      awayAvgPts: sixersPpg,
      homeAvgPtsAllowed: magicPapg,
      awayAvgPtsAllowed: sixersPapg,
      homeNetRtg: magicNet,
      awayNetRtg: sixersNet,
    };
  }
  if (homeTeamId === "nba-76ers") {
    return {
      homeAvgPts: sixersPpg,
      awayAvgPts: magicPpg,
      homeAvgPtsAllowed: sixersPapg,
      awayAvgPtsAllowed: magicPapg,
      homeNetRtg: sixersNet,
      awayNetRtg: magicNet,
    };
  }
  return null;
}
