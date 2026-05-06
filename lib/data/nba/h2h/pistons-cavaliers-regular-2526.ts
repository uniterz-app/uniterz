import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const PISTONS_CAVALIERS_TEAM_IDS = [
  "nba-pistons",
  "nba-cavaliers",
] as const;

/** H2Hカードは左=Pistons、右=Cavaliers で固定 */
const H2H_LEFT = "Pistons";
const H2H_RIGHT = "Cavaliers";

/**
 * 2025-26 Pistons vs Cavaliers（レギュラー4 + プレーオフ Game 1）
 * 欠場者表記は既存H2Hと同様（イニシャル + 姓）
 */
export const pistonsCavaliersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-pistons-cavaliers-2025-10-27",
    dateEt: "2025-10-27",
    dateJst: "2025-10-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 95,
    scoreRight: 116,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["L. Ball", "D. Garland", "M. Strus"],
  },
  {
    id: "h2h-pistons-cavaliers-2026-01-04",
    dateEt: "2026-01-04",
    dateJst: "2026-01-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 110,
    homeTeamSide: "left",
    injuriesLeft: ["J. Duren", "T. Harris", "C. LeVert"],
    injuriesRight: ["M. Strus"],
  },
  {
    id: "h2h-pistons-cavaliers-2026-02-27",
    dateEt: "2026-02-27",
    dateJst: "2026-02-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 122,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["I. Stewart"],
    injuriesRight: [
      "K. Ellis",
      "J. Harden",
      "D. Mitchell",
      "M. Strus",
      "D. Wade",
    ],
  },
  {
    id: "h2h-pistons-cavaliers-2026-03-03",
    dateEt: "2026-03-03",
    dateJst: "2026-03-04",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 113,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["D. Mitchell", "M. Strus"],
  },
  {
    id: "h2h-pistons-cavaliers-2026-05-05-po-g1",
    dateEt: "2026-05-05",
    dateJst: "2026-05-06",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 101,
    /** Detroit（Pistons）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Cade Cunninghamが23得点7アシスト、Tobias Harrisが20得点8リバウンドでDetroitが先勝。立ち上がりから守備の圧力でClevelandを苦しめ、19ターンオーバーから31得点を奪ったのが大きかった。Cavsは4QにJames Harden中心で追い上げ、残り5分28秒で93-93まで戻したが、そこからDetroitが18-8で締めた。Jalen Durenの連続ダンクで流れを切らせず、そのまま押し切った試合だった。シリーズはDetroitが1-0。",
      en:
        "Behind 23 points and 7 assists from Cade Cunningham and 20 points and 8 rebounds from Tobias Harris, Detroit stole Game 1. The Pistons bothered Cleveland with defensive pressure from the opening tip and turned 19 turnovers into 31 points. The Cavaliers rallied in the fourth behind James Harden, tying the game at 93-93 with 5:28 left, but Detroit closed on an 18-8 run. Back-to-back slams from Jalen Duren kept momentum on Detroit’s side as the Pistons pulled away. Detroit leads the series 1-0.",
    },
  },
];

function pistonsCavaliersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  pistonsPpg: number;
  cavaliersPpg: number;
  pistonsPapg: number;
  cavaliersPapg: number;
  pistonsNet: number;
  cavaliersNet: number;
} {
  let pistonsPts = 0;
  let cavaliersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`pistonsCavaliersH2H: missing scores for ${g.id}`);
    }
    pistonsPts += g.scoreLeft;
    cavaliersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const pistonsPpg = r1(pistonsPts / n);
  const cavaliersPpg = r1(cavaliersPts / n);
  const pistonsPapg = cavaliersPpg;
  const cavaliersPapg = pistonsPpg;
  const pistonsNet = r1(pistonsPpg - pistonsPapg);
  const cavaliersNet = r1(cavaliersPpg - cavaliersPapg);
  return {
    pistonsPpg,
    cavaliersPpg,
    pistonsPapg,
    cavaliersPapg,
    pistonsNet,
    cavaliersNet,
  };
}

export function pistonsCavaliersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-pistons") || !ids.has("nba-cavaliers")) {
    return null;
  }

  const {
    pistonsPpg,
    cavaliersPpg,
    pistonsPapg,
    cavaliersPapg,
    pistonsNet,
    cavaliersNet,
  } = pistonsCavaliersH2HStatsFromGames(pistonsCavaliersH2HGames);

  if (homeTeamId === "nba-pistons") {
    return {
      homeAvgPts: pistonsPpg,
      awayAvgPts: cavaliersPpg,
      homeAvgPtsAllowed: pistonsPapg,
      awayAvgPtsAllowed: cavaliersPapg,
      homeNetRtg: pistonsNet,
      awayNetRtg: cavaliersNet,
    };
  }
  if (homeTeamId === "nba-cavaliers") {
    return {
      homeAvgPts: cavaliersPpg,
      awayAvgPts: pistonsPpg,
      homeAvgPtsAllowed: cavaliersPapg,
      awayAvgPtsAllowed: pistonsPapg,
      homeNetRtg: cavaliersNet,
      awayNetRtg: pistonsNet,
    };
  }
  return null;
}
