import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const HEAT_HORNETS_TEAM_IDS = ["nba-heat", "nba-hornets"] as const;

/** H2Hカードは左=Hornets、右=Heat で固定 */
const H2H_LEFT = "Hornets";
const H2H_RIGHT = "Heat";

/** 2025-26 レギュラー Heat vs Hornets（4試合） */
export const heatHornetsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-heat-hornets-2025-10-28",
    dateEt: "2025-10-28",
    dateJst: "2025-10-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 117,
    scoreRight: 144,
    homeTeamSide: "right",
    injuriesLeft: ["J. Green", "B. Miller", "G. Williams"],
    injuriesRight: ["T. Herro", "K. Jakucionis", "T. Rozier", "N. Powell"],
  },
  {
    id: "h2h-heat-hornets-2025-11-07",
    dateEt: "2025-11-07",
    dateJst: "2025-11-08",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 126,
    homeTeamSide: "right",
    injuriesLeft: [
      "L. Ball",
      "B. Miller",
      "T. Salaun",
      "C. Sexton",
      "J. Green",
      "G. Williams",
    ],
    injuriesRight: ["B. Adebayo", "T. Herro", "T. Rozier"],
  },
  {
    id: "h2h-heat-hornets-2026-03-06",
    dateEt: "2026-03-06",
    dateJst: "2026-03-07",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 120,
    scoreRight: 128,
    homeTeamSide: "left",
    injuriesLeft: ["L. McNeeley", "T. Salaun"],
    injuriesRight: [
      "S. Fontecchio",
      "N. Jovic",
      "N. Powell",
      "A. Wiggins",
      "T. Rozier",
    ],
  },
  {
    id: "h2h-heat-hornets-2026-03-17",
    dateEt: "2026-03-17",
    dateJst: "2026-03-18",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 136,
    scoreRight: 106,
    homeTeamSide: "left",
    injuriesLeft: ["L. McNeeley", "T. Salaun"],
    injuriesRight: ["B. Adebayo", "T. Rozier", "A. Wiggins"],
  },
];

function heatHornetsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  heatPpg: number;
  hornetsPpg: number;
  heatPapg: number;
  hornetsPapg: number;
  heatNet: number;
  hornetsNet: number;
} {
  let heatPts = 0;
  let hornetsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`heatHornetsH2H: missing scores for ${g.id}`);
    }
    hornetsPts += g.scoreLeft;
    heatPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const heatPpg = r1(heatPts / n);
  const hornetsPpg = r1(hornetsPts / n);
  const heatPapg = hornetsPpg;
  const hornetsPapg = heatPpg;
  const hornetsNet = r1(hornetsPpg - hornetsPapg);
  const heatNet = r1(heatPpg - heatPapg);
  return {
    heatPpg,
    hornetsPpg,
    heatPapg,
    hornetsPapg,
    heatNet,
    hornetsNet,
  };
}

export function heatHornetsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-heat") || !ids.has("nba-hornets")) {
    return null;
  }

  const {
    heatPpg,
    hornetsPpg,
    heatPapg,
    hornetsPapg,
    heatNet,
    hornetsNet,
  } = heatHornetsH2HStatsFromGames(heatHornetsH2HGames);

  if (homeTeamId === "nba-hornets") {
    return {
      homeAvgPts: hornetsPpg,
      awayAvgPts: heatPpg,
      homeAvgPtsAllowed: hornetsPapg,
      awayAvgPtsAllowed: heatPapg,
      homeNetRtg: hornetsNet,
      awayNetRtg: heatNet,
    };
  }
  if (homeTeamId === "nba-heat") {
    return {
      homeAvgPts: heatPpg,
      awayAvgPts: hornetsPpg,
      homeAvgPtsAllowed: heatPapg,
      awayAvgPtsAllowed: hornetsPapg,
      homeNetRtg: heatNet,
      awayNetRtg: hornetsNet,
    };
  }
  return null;
}
