import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_THUNDER_TEAM_IDS = ["nba-spurs", "nba-thunder"] as const;

/** H2H カードは左=Spurs、右=Thunder で固定 */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Thunder";

/** 2025-26 Spurs vs Thunder（レギュラー5 + プレーオフ CF Game 2まで） */
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
    injuriesRight: ["T. Sorber"],
    inactiveFooterSummary: {
      ja:
        "San AntonioがダブルOTの接戦を制し、カンファレンスファイナル第1戦を勝ち取った。Victor Wembanyamaが41点24リバウンド3ブロックと試合を支配し、2OT残り22秒ではChet Holmgrenを越えるダンク＋ファウルで決着。1OT終盤には28フィートの同点3Pも決めている。Fox欠場で先発したDylan Harperは24点11リバウンド7スティール6アシストと、守備でもOKCのリズムを崩した。ThunderはShai Gilgeous-Alexanderが24点12アシストながら7/23と低效率。Alex Carusoがベンチから31点（3P8本）、Jalen Williamsが復帰して26点と支えたが、2OTでWembyを止めきれなかった。シリーズはSpursが1-0。",
      en:
        "San Antonio survived double overtime to steal Game 1 of the conference finals. Victor Wembanyama dominated with 41 points, 24 rebounds, and 3 blocks, sealing it in the second overtime with a dunk over Chet Holmgren plus the foul and an alley-oop with 22 seconds left—after hitting a 28-foot tying three late in the first overtime. With De’Aaron Fox out, Dylan Harper started and delivered 24 points, 11 rebounds, 7 steals, and 6 assists, disrupting Oklahoma City on both ends. The Thunder got 24 points and 12 assists from Shai Gilgeous-Alexander on 7-of-23 shooting in his first game after the MVP ceremony; Alex Caruso scored 31 off the bench with eight threes and Jalen Williams returned for 26, but OKC could not slow Wembanyama in the second overtime. San Antonio leads the series 1-0.",
    },
  },
  {
    id: "h2h-spurs-thunder-2026-05-20-po-g2",
    dateEt: "2026-05-20",
    dateJst: "2026-05-21",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 113,
    scoreRight: 122,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["D. Fox"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "OKCはGame1の敗戦から修正。SGAが30点9AST、Chet Holmgrenが13点、Hartensteinが10点13Rでウェンビーへのフィジカル対応を強めた。SpursはCastleが25点8ASTだが9TO、チーム全体で21TO。Wembanyamaは21点17R6AST4BLKと十分な数字だが、Game1の41点24Rほどの支配力は出せず。終盤Spursは5点差まで詰めたが、Vassellの3PミスとCastleのターンオーバーで流れを失い、SGAとCarusoに締められた。シリーズは1-1。",
      en:
        "Oklahoma City corrected the issues from its Game 1 loss. Shai Gilgeous-Alexander had 30 points and 9 assists, Chet Holmgren scored 13, and Isaiah Hartenstein added 10 points and 13 rebounds as OKC leaned harder into the physical matchup with Victor Wembanyama. San Antonio got 25 points and 8 assists from Stephon Castle but he had 9 turnovers as the Spurs committed 21 as a team. Wembanyama finished with 21 points, 17 rebounds, 6 assists, and 4 blocks—solid numbers but not the 41-and-24 control he showed in Game 1. The Spurs cut the deficit to five late, but a missed three from Devin Vassell and a Castle turnover cost them momentum before SGA and Alex Caruso closed it out. The series is tied 1-1 after Oklahoma City’s 122-113 win.",
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
