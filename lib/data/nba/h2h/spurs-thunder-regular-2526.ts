import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_THUNDER_TEAM_IDS = ["nba-spurs", "nba-thunder"] as const;

/** H2H カードは左=Spurs、右=Thunder で固定 */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Thunder";

/** 2025-26 Spurs vs Thunder（レギュラー5 + プレーオフ CF Game 6まで） */
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
  {
    id: "h2h-spurs-thunder-2026-05-22-po-g3",
    dateEt: "2026-05-22",
    dateJst: "2026-05-23",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 123,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["Jal. Williams"],
    inactiveFooterSummary: {
      ja:
        "スパーズは立ち上がり15-0で入ったが、そこからOKCが崩れずに逆転。最大の差はベンチで、OKCの控えが76点、SASの控えは23点。Jared McCainが24点、Jaylin Williamsが18点、Carusoが15点、SGAは26点12アシスト。スパーズはWembanyamaが26点、Vassellが20点を取ったが、後半はOKCの層と運動量に押し切られた。OKCが2勝1敗に。",
      en:
        "San Antonio opened on a 15-0 run, but Oklahoma City steadied and flipped the game without breaking. The biggest gap was the bench: OKC’s reserves scored 76 points to the Spurs’ 23. Jared McCain had 24, Jaylin Williams 18, Alex Caruso 15, and Shai Gilgeous-Alexander 26 points with 12 assists. Victor Wembanyama scored 26 and Devin Vassell 20 for San Antonio, but OKC’s depth and movement won the second half. Oklahoma City leads the series 2-1 after a 123-108 road win.",
    },
  },
  {
    id: "h2h-spurs-thunder-2026-05-24-po-g4",
    dateEt: "2026-05-24",
    dateJst: "2026-05-25",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 82,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["A. Mitchell", "T. Sorber", "Jal. Williams"],
    inactiveFooterSummary: {
      ja:
        "スパーズが守備で完全に試合を支配。Wembanyamaは33点8リバウンド5アシスト3ブロック2スティールで、序盤から攻守の基準を作った。OKCはFG33%、3Pは6/33、20ターンオーバー。SGAは19点に抑えられ、OKCのベンチもGame3ほど機能しなかった。SASはSGAに対して極端に寄りすぎず、1on1を基本にしながら周囲が早くローテする守り方でリズムを消した。シリーズは2勝2敗。",
      en:
        "San Antonio dominated defensively from start to finish. Victor Wembanyama set the tone on both ends with 33 points, 8 rebounds, 5 assists, 3 blocks, and 2 steals. Oklahoma City shot 33% from the field, went 6-for-33 from three, and committed 20 turnovers. Shai Gilgeous-Alexander was held to 19, and the Thunder bench could not replicate its Game 3 impact. The Spurs avoided over-helping on SGA, played him mostly in one-on-one situations, and used quick rotations to erase his rhythm. The series is tied 2-2 after San Antonio’s 103-82 win.",
    },
  },
  {
    id: "h2h-spurs-thunder-2026-05-26-po-g5",
    dateEt: "2026-05-26",
    dateJst: "2026-05-27",
    seriesGameLabel: "Game 5",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 127,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["A. Mitchell", "T. Sorber", "Jal. Williams"],
    inactiveFooterSummary: {
      ja:
        "立ち上がりは拮抗したものの、OKCが第2Qに40得点を奪って主導権を握り、そのまま逃げ切った。Shai Gilgeous-Alexanderが32得点でオフェンスを牽引し、Alex Carusoが22得点、先発起用のJared McCainも20得点で続いて、ベンチを含めた総合力の差を示した。SpursはStephon Castleの24得点、Julian Champagnieの22得点で応戦したが、Victor WembanyamaがFG4/15と効率を抑えられ、追い上げの局面で流れを引き寄せ切れなかった。Game4大敗から修正したOKCが内容面でも上回り、シリーズを3勝2敗とした。",
      en:
        "The game was competitive early, but Oklahoma City seized control with a 40-point second quarter and never gave it back. Shai Gilgeous-Alexander led the offense with 32 points, Alex Caruso added 22, and Jared McCain scored 20 in the starting lineup, highlighting OKC's overall depth advantage. San Antonio got 24 from Stephon Castle and 22 from Julian Champagnie, but Victor Wembanyama was held to 4-for-15 shooting and the Spurs could not fully reclaim momentum during their pushes. After the Game 4 blowout loss, OKC answered with a cleaner two-way performance and moved ahead 3-2 in the series.",
    },
  },
  {
    id: "h2h-spurs-thunder-2026-05-28-po-g6",
    dateEt: "2026-05-28",
    dateJst: "2026-05-29",
    seriesGameLabel: "Game 6",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 118,
    scoreRight: 91,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["A. Mitchell", "T. Sorber"],
    inactiveFooterSummary: {
      ja:
        "崖っぷちのSpursが序盤から守備強度を高め、1Q35-22で先行。さらに3Qを32-13で圧倒し、試合を決定づけた。Victor Wembanyamaは28得点10リバウンド、Stephon Castleは17得点9アシスト、Dylan Harperは18得点と、主力とセカンドがバランス良く得点して主導権を渡さなかった。一方のOKCはShai Gilgeous-Alexanderが15得点にとどまり、チーム全体でもFG37%、3P10/40とシュート効率が伸びず、攻撃の連続性を作れなかった。Spursが118-91で快勝し、シリーズは3勝3敗のタイ。決着はGame7に持ち越しとなった。",
      en:
        "Facing elimination, San Antonio raised its defensive pressure from the opening tip, led 35-22 after the first quarter, and put the game away with a dominant 32-13 third period. Victor Wembanyama finished with 28 points and 10 rebounds, Stephon Castle had 17 points and 9 assists, and Dylan Harper added 18 as the Spurs got balanced production across units. Oklahoma City struggled to generate continuity offensively: Shai Gilgeous-Alexander was held to 15 points, and the Thunder shot 37% overall and 10-for-40 from three. San Antonio won 118-91 to tie the series 3-3 and force a Game 7.",
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
