import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_SUNS_TEAM_IDS = ["nba-thunder", "nba-suns"] as const;

/** H2Hカードは左=Thunder、右=Suns で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Suns";

/** 2025-26 レギュラー Thunder vs Suns（4試合） */
export const thunderSunsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-thunder-suns-2025-11-28",
    dateEt: "2025-11-28",
    dateJst: "2025-11-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["T. Sorber", "N. Topic", "A. Wiggins"],
    injuriesRight: ["G. Allen", "R. Dunn", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-01-04",
    dateEt: "2026-01-04",
    dateJst: "2026-01-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 108,
    homeTeamSide: "right",
    injuriesLeft: [
      "O. Dieng",
      "I. Hartenstein",
      "T. Sorber",
      "N. Topic",
      "J. Williams",
    ],
    injuriesRight: ["J. Green", "G. Allen"],
  },
  {
    id: "h2h-thunder-suns-2026-02-11",
    dateEt: "2026-02-11",
    dateJst: "2026-02-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 136,
    scoreRight: 109,
    homeTeamSide: "right",
    injuriesLeft: ["S. Gilgeous-Alexander", "A. Mitchell", "T. Sorber"],
    injuriesRight: ["D. Booker", "J. Green", "G. Allen"],
  },
  {
    id: "h2h-thunder-suns-2026-04-12",
    dateEt: "2026-04-12",
    dateJst: "2026-04-13",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 135,
    homeTeamSide: "left",
    injuriesLeft: [
      "A. Caruso",
      "S. Gilgeous-Alexander",
      "I. Hartenstein",
      "C. Holmgren",
      "I. Joe",
      "A. Mitchell",
      "T. Sorber",
      "C. Wallace",
      "Jal. Williams",
      "Jay. Williams",
    ],
    injuriesRight: ["G. Allen", "D. Booker", "D. Brooks", "R. O'Neale"],
  },
];

function thunderSunsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  thunderPpg: number;
  sunsPpg: number;
  thunderPapg: number;
  sunsPapg: number;
  thunderNet: number;
  sunsNet: number;
} {
  let thunderPts = 0;
  let sunsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`thunderSunsH2H: missing scores for ${g.id}`);
    }
    thunderPts += g.scoreLeft;
    sunsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sunsPpg = r1(sunsPts / n);
  const thunderPpg = r1(thunderPts / n);
  const sunsPapg = thunderPpg;
  const thunderPapg = sunsPpg;
  const sunsNet = r1(sunsPpg - sunsPapg);
  const thunderNet = r1(thunderPpg - thunderPapg);
  return {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  };
}

export function thunderSunsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-thunder") || !ids.has("nba-suns")) {
    return null;
  }

  const {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  } = thunderSunsH2HStatsFromGames(thunderSunsH2HGames);

  if (homeTeamId === "nba-suns") {
    return {
      homeAvgPts: sunsPpg,
      awayAvgPts: thunderPpg,
      homeAvgPtsAllowed: sunsPapg,
      awayAvgPtsAllowed: thunderPapg,
      homeNetRtg: sunsNet,
      awayNetRtg: thunderNet,
    };
  }
  if (homeTeamId === "nba-thunder") {
    return {
      homeAvgPts: thunderPpg,
      awayAvgPts: sunsPpg,
      homeAvgPtsAllowed: thunderPapg,
      awayAvgPtsAllowed: sunsPapg,
      homeNetRtg: thunderNet,
      awayNetRtg: sunsNet,
    };
  }
  return null;
}
