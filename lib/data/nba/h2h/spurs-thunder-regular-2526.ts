import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_THUNDER_TEAM_IDS = ["nba-spurs", "nba-thunder"] as const;

/** H2H カードは左=Spurs、右=Thunder で固定 */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Thunder";

/** 2025-26 Spurs vs Thunder（レギュラー5 + プレーオフ Game 1まで） */
export const spursThunderH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-thunder-2025-12-13",
    dateEt: "2025-12-13",
    dateJst: "2025-12-14",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 109,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["N. Topic", "I. Joe"],
  },
  {
    id: "h2h-spurs-thunder-2025-12-23",
    dateEt: "2025-12-23",
    dateJst: "2025-12-24",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 130,
    scoreRight: 110,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["V. Wembanyama"],
    injuriesRight: ["A. Mitchell", "N. Topic", "Jay. Williams"],
  },
  {
    id: "h2h-spurs-thunder-2025-12-25",
    dateEt: "2025-12-25",
    dateJst: "2025-12-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 117,
    scoreRight: 102,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["A. Mitchell", "Jay. Williams"],
  },
  {
    id: "h2h-spurs-thunder-2026-01-13",
    dateEt: "2026-01-13",
    dateJst: "2026-01-14",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 98,
    scoreRight: 119,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["D. Vassell"],
    injuriesRight: ["I. Hartenstein", "L. Dort"],
  },
  {
    id: "h2h-spurs-thunder-2026-02-04",
    dateEt: "2026-02-04",
    dateJst: "2026-02-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 106,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["J. Sochan"],
    injuriesRight: [
      "S. Gilgeous-Alexander",
      "Jal. Williams",
      "L. Dort",
      "C. Caruso",
      "I. Hartenstein",
      "A. Mitchell",
    ],
  },
  {
    id: "h2h-spurs-thunder-2026-05-18-po-g1",
    dateEt: "2026-05-18",
    dateJst: "2026-05-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 122,
    scoreRight: 115,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "right",
    wentToOvertime: true,
    overtimePeriods: 2,
    injuriesLeft: ["D. Fox"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "SpursはFox不在でもDylan Harperを先発起用し、Wembanyamaが41得点・24リバウンド・3ブロックの支配的な内容。Harperも24得点・11リバウンド・6アシスト・7スティールで大仕事。OKCはAlex Carusoが31得点、Jalen Williamsが26得点。SGAは24得点・12アシスト・5スティールだったが、FGは7/23と苦しんだ。試合は終盤まで接戦。Wembanyamaが1OT終盤に同点スリー、2OTでも勝負を決めるダンクとアリウープを決めた。OKCはターンオーバー誘発とCarusoの3Pで食らいついたが、リバウンドで大きく負け、Chet Holmgrenも8得点に抑えられた。",
      en:
        "Without De'Aaron Fox, San Antonio leaned on Dylan Harper in the starting lineup while Victor Wembanyama dominated with 41 points, 24 rebounds, and 3 blocks. Harper added 24 points, 11 rebounds, 6 assists, and 7 steals in a breakout night. Oklahoma City got 31 from Alex Caruso and 26 from Jalen Williams; Shai Gilgeous-Alexander had 24 points, 12 assists, and 5 steals but shot just 7-for-23. The game stayed tight into the closing stretch before Wembanyama hit a tying three late in the first overtime and sealed the second OT with a decisive dunk and alley-oop. The Thunder hung around with turnovers forced and Caruso’s perimeter shooting but lost the rebounding battle badly and held Chet Holmgren to 8 points in a 122-115 Spurs win.",
    },
  },
];

function spursThunderH2HStatsFromGames(games: NbaH2HGameCard[]): {
  spursPpg: number;
  thunderPpg: number;
  spursPapg: number;
  thunderPapg: number;
  spursNet: number;
  thunderNet: number;
} {
  let spursPts = 0;
  let thunderPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursThunderH2H: missing scores for ${g.id}`);
    }
    spursPts += g.scoreLeft;
    thunderPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const spursPpg = r1(spursPts / n);
  const thunderPpg = r1(thunderPts / n);
  const spursPapg = thunderPpg;
  const thunderPapg = spursPpg;
  const spursNet = r1(spursPpg - spursPapg);
  const thunderNet = r1(thunderPpg - thunderPapg);
  return {
    spursPpg,
    thunderPpg,
    spursPapg,
    thunderPapg,
    spursNet,
    thunderNet,
  };
}

export function spursThunderH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-spurs") || !ids.has("nba-thunder")) {
    return null;
  }

  const {
    spursPpg,
    thunderPpg,
    spursPapg,
    thunderPapg,
    spursNet,
    thunderNet,
  } = spursThunderH2HStatsFromGames(spursThunderH2HGames);

  if (homeTeamId === "nba-thunder") {
    return {
      homeAvgPts: thunderPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: thunderPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: thunderNet,
      awayNetRtg: spursNet,
    };
  }
  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: thunderPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: thunderPapg,
      homeNetRtg: spursNet,
      awayNetRtg: thunderNet,
    };
  }
  return null;
}
