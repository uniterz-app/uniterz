import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SUNS_BLAZERS_TEAM_IDS = ["nba-suns", "nba-blazers"] as const;

/** H2Hカードは左=Suns、右=Blazers で固定 */
const H2H_LEFT = "Suns";
const H2H_RIGHT = "Blazers";

/** 2025-26 レギュラー Suns vs Trail Blazers（3試合） */
export const sunsBlazersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-suns-blazers-2025-11-18",
    dateEt: "2025-11-18",
    dateJst: "2025-11-19",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 127,
    scoreRight: 110,
    homeTeamSide: "right",
    injuriesLeft: ["G. Allen", "J. Green", "K. Brea"],
    injuriesRight: [
      "J. Grant",
      "S. Henderson",
      "J. Holiday",
      "D. Lillard",
      "M. Thybulle",
      "B. Wesley",
    ],
  },
  {
    id: "h2h-suns-blazers-2026-02-03",
    dateEt: "2026-02-03",
    dateJst: "2026-02-04",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 130,
    scoreRight: 125,
    homeTeamSide: "right",
    injuriesLeft: ["D. Booker", "J. Green", "K. Brea"],
    injuriesRight: [
      "D. Avdija",
      "S. Henderson",
      "D. Lillard",
      "K. Murray",
      "M. Thybulle",
    ],
  },
  {
    id: "h2h-suns-blazers-2026-02-22",
    dateEt: "2026-02-22",
    dateJst: "2026-02-23",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 77,
    scoreRight: 92,
    homeTeamSide: "left",
    injuriesLeft: [
      "G. Allen",
      "C. Anthony",
      "D. Booker",
      "D. Brooks",
      "J. Goodwin",
      "H. Highsmith",
    ],
    injuriesRight: ["D. Lillard", "S. Sharpe"],
  },
];

function sunsBlazersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  sunsPpg: number;
  blazersPpg: number;
  sunsPapg: number;
  blazersPapg: number;
  sunsNet: number;
  blazersNet: number;
} {
  let sunsPts = 0;
  let blazersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`sunsBlazersH2H: missing scores for ${g.id}`);
    }
    sunsPts += g.scoreLeft;
    blazersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sunsPpg = r1(sunsPts / n);
  const blazersPpg = r1(blazersPts / n);
  const sunsPapg = blazersPpg;
  const blazersPapg = sunsPpg;
  const blazersNet = r1(blazersPpg - blazersPapg);
  const sunsNet = r1(sunsPpg - sunsPapg);
  return {
    sunsPpg,
    blazersPpg,
    sunsPapg,
    blazersPapg,
    sunsNet,
    blazersNet,
  };
}

export function sunsBlazersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-suns") || !ids.has("nba-blazers")) {
    return null;
  }

  const {
    sunsPpg,
    blazersPpg,
    sunsPapg,
    blazersPapg,
    sunsNet,
    blazersNet,
  } = sunsBlazersH2HStatsFromGames(sunsBlazersH2HGames);

  if (homeTeamId === "nba-blazers") {
    return {
      homeAvgPts: blazersPpg,
      awayAvgPts: sunsPpg,
      homeAvgPtsAllowed: blazersPapg,
      awayAvgPtsAllowed: sunsPapg,
      homeNetRtg: blazersNet,
      awayNetRtg: sunsNet,
    };
  }
  if (homeTeamId === "nba-suns") {
    return {
      homeAvgPts: sunsPpg,
      awayAvgPts: blazersPpg,
      homeAvgPtsAllowed: sunsPapg,
      awayAvgPtsAllowed: blazersPapg,
      homeNetRtg: sunsNet,
      awayNetRtg: blazersNet,
    };
  }
  return null;
}
