import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const HORNETS_MAGIC_TEAM_IDS = ["nba-hornets", "nba-magic"] as const;

/** H2Hカードは左=Magic、右=Hornets で固定（従来の左右・スコア・ホーム表示・欠場を反転） */
const H2H_LEFT = "Magic";
const H2H_RIGHT = "Hornets";

/** 2025-26 レギュラー Magic vs Hornets（4試合・マジック 1勝3敗） */
export const hornetsMagicH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-hornets-magic-2025-10-30",
    dateEt: "2025-10-30",
    dateJst: "2025-10-31",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 107,
    homeTeamSide: "left",
    injuriesLeft: ["J. Cain", "J. Suggs", "M. Wagner"],
    injuriesRight: ["J. Green", "G. Williams", "B. Miller"],
  },
  {
    id: "h2h-hornets-magic-2025-12-26",
    dateEt: "2025-12-26",
    dateJst: "2025-12-27",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 120,
    homeTeamSide: "right",
    injuriesLeft: ["F. Wagner", "M. Wagner"],
    injuriesRight: ["G. Williams"],
  },
  {
    id: "h2h-hornets-magic-2026-01-22",
    dateEt: "2026-01-22",
    dateJst: "2026-01-23",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 97,
    scoreRight: 124,
    homeTeamSide: "right",
    injuriesLeft: ["J. Suggs", "F. Wagner"],
    injuriesRight: ["T. Mann"],
  },
  {
    id: "h2h-hornets-magic-2026-03-19",
    dateEt: "2026-03-19",
    dateJst: "2026-03-20",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 130,
    homeTeamSide: "right",
    injuriesLeft: [
      "A. Black",
      "W. Carter Jr.",
      "J. Isaac",
      "F. Wagner",
    ],
    injuriesRight: [],
  },
];

function hornetsMagicH2HStatsFromGames(games: NbaH2HGameCard[]): {
  hornetsPpg: number;
  magicPpg: number;
  hornetsPapg: number;
  magicPapg: number;
  hornetsNet: number;
  magicNet: number;
} {
  let hornetsPts = 0;
  let magicPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`hornetsMagicH2H: missing scores for ${g.id}`);
    }
    /* 左=Magic、右=Hornets */
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
    hornetsPpg,
    magicPpg,
    hornetsPapg,
    magicPapg,
    hornetsNet,
    magicNet,
  };
}

export function hornetsMagicH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-hornets") || !ids.has("nba-magic")) {
    return null;
  }

  const {
    hornetsPpg,
    magicPpg,
    hornetsPapg,
    magicPapg,
    hornetsNet,
    magicNet,
  } = hornetsMagicH2HStatsFromGames(hornetsMagicH2HGames);

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
