import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SIXERS_KNICKS_TEAM_IDS = ["nba-76ers", "nba-knicks"] as const;

/** H2H カードは左=Knicks、右=76ers で固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "76ers";

/** 2025-26 Knicks vs 76ers（レギュラー4） */
export const sixersKnicksH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-sixers-knicks-2025-12-19",
    dateEt: "2025-12-19",
    dateJst: "2025-12-20",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 116,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["M. McBride", "L. Shamet"],
    injuriesRight: ["J. Embiid", "K. Oubre Jr."],
  },
  {
    id: "h2h-sixers-knicks-2026-01-03",
    dateEt: "2026-01-03",
    dateJst: "2026-01-04",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 119,
    scoreRight: 130,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["J. Hart", "L. Shamet"],
    injuriesRight: ["K. Oubre Jr."],
  },
  {
    id: "h2h-sixers-knicks-2026-01-24",
    dateEt: "2026-01-24",
    dateJst: "2026-01-25",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 109,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: [],
  },
  {
    id: "h2h-sixers-knicks-2026-02-11",
    dateEt: "2026-02-11",
    dateJst: "2026-02-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 138,
    scoreRight: 89,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["O. Anunoby", "M. McBride"],
    injuriesRight: ["J. Embiid", "P. George", "Q. Grimes"],
  },
];

/** 左=NYK・右=PHI のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function sixersKnicksH2HStatsFromGames(games: NbaH2HGameCard[]): {
  knicksPpg: number;
  sixersPpg: number;
  knicksPapg: number;
  sixersPapg: number;
  knicksNet: number;
  sixersNet: number;
} {
  let knicksPts = 0;
  let sixersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`sixersKnicksH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    sixersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const knicksPpg = r1(knicksPts / n);
  const sixersPpg = r1(sixersPts / n);
  const knicksPapg = sixersPpg;
  const sixersPapg = knicksPpg;
  const sixersNet = r1(sixersPpg - sixersPapg);
  const knicksNet = r1(knicksPpg - knicksPapg);
  return {
    knicksPpg,
    sixersPpg,
    knicksPapg,
    sixersPapg,
    knicksNet,
    sixersNet,
  };
}

/** 上記4試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function sixersKnicksH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-76ers") || !ids.has("nba-knicks")) {
    return null;
  }

  const {
    knicksPpg,
    sixersPpg,
    knicksPapg,
    sixersPapg,
    knicksNet,
    sixersNet,
  } = sixersKnicksH2HStatsFromGames(sixersKnicksH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: sixersPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: sixersPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: sixersNet,
    };
  }
  if (homeTeamId === "nba-76ers") {
    return {
      homeAvgPts: sixersPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: sixersPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: sixersNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
