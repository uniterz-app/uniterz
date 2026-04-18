import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MAGIC_HORNETS_TEAM_IDS = ["nba-magic", "nba-hornets"] as const;

/** H2Hカードは左=Magic、右=Hornets で固定 */
const H2H_LEFT = "Magic";
const H2H_RIGHT = "Hornets";

/** 2025-26 レギュラー Magic vs Hornets（4試合） */
export const magicHornetsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-magic-hornets-2025-10-30",
    dateEt: "2025-10-30",
    dateJst: "2025-10-31",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 107,
    homeTeamSide: "right",
    injuriesLeft: ["J. Suggs", "M. Wagner", "J. Cain"],
    injuriesRight: ["B. Miller", "J. Green", "G. Williams"],
  },
  {
    id: "h2h-magic-hornets-2025-12-26",
    dateEt: "2025-12-26",
    dateJst: "2025-12-27",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 120,
    homeTeamSide: "left",
    injuriesLeft: ["F. Wagner", "J. Suggs", "M. Wagner"],
    injuriesRight: ["R. Kalkbrenner", "M. Plumlee", "G. Williams"],
  },
  {
    id: "h2h-magic-hornets-2026-01-22",
    dateEt: "2026-01-22",
    dateJst: "2026-01-23",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 97,
    scoreRight: 124,
    homeTeamSide: "left",
    injuriesLeft: ["F. Wagner", "J. Suggs", "C. Castleton"],
    injuriesRight: ["T. Mann", "M. Plumlee", "L. McNeeley"],
  },
  {
    id: "h2h-magic-hornets-2026-03-19",
    dateEt: "2026-03-19",
    dateJst: "2026-03-20",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 130,
    homeTeamSide: "right",
    injuriesLeft: [
      "F. Wagner",
      "J. Isaac",
      "W. Carter Jr.",
      "A. Black",
    ],
    injuriesRight: ["T. Salaun", "L. McNeeley"],
  },
];

function magicHornetsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  magicPpg: number;
  hornetsPpg: number;
  magicPapg: number;
  hornetsPapg: number;
  magicNet: number;
  hornetsNet: number;
} {
  let magicPts = 0;
  let hornetsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`magicHornetsH2H: missing scores for ${g.id}`);
    }
    magicPts += g.scoreLeft;
    hornetsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const hornetsPpg = r1(hornetsPts / n);
  const magicPpg = r1(magicPts / n);
  const hornetsPapg = magicPpg;
  const magicPapg = hornetsPpg;
  const hornetsNet = r1(hornetsPpg - hornetsPapg);
  const magicNet = r1(magicPpg - magicPapg);
  return {
    magicPpg,
    hornetsPpg,
    magicPapg,
    hornetsPapg,
    magicNet,
    hornetsNet,
  };
}

export function magicHornetsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-magic") || !ids.has("nba-hornets")) {
    return null;
  }

  const {
    magicPpg,
    hornetsPpg,
    magicPapg,
    hornetsPapg,
    magicNet,
    hornetsNet,
  } = magicHornetsH2HStatsFromGames(magicHornetsH2HGames);

  if (homeTeamId === "nba-hornets") {
    return {
      homeAvgPts: hornetsPpg,
      awayAvgPts: magicPpg,
      homeAvgPtsAllowed: hornetsPapg,
      awayAvgPtsAllowed: magicPapg,
      homeNetRtg: hornetsNet,
      awayNetRtg: magicNet,
    };
  }
  if (homeTeamId === "nba-magic") {
    return {
      homeAvgPts: magicPpg,
      awayAvgPts: hornetsPpg,
      homeAvgPtsAllowed: magicPapg,
      awayAvgPtsAllowed: hornetsPapg,
      homeNetRtg: magicNet,
      awayNetRtg: hornetsNet,
    };
  }
  return null;
}
