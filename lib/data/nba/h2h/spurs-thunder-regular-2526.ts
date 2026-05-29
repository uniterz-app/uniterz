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
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "SpursはFox不在でもDylan Harperを先発起用し、Wembanyamaが41得点・24リバウンド・3ブロックの支配的な内容。Harperも24得点・11リバウンド・6アシスト・7スティールで大仕事。OKCはAlex Carusoが31得点、Jalen Williamsが26得点。SGAは24得点・12アシスト・5スティールだったが、FGは7/23と苦しんだ。試合は終盤まで接戦。Wembanyamaが1OT終盤に同点スリー、2OTでも勝負を決めるダンクとアリウープを決めた。OKCはターンオーバー誘発とCarusoの3Pで食らいついたが、リバウンドで大きく負け、Chet Holmgrenも8得点に抑えられた。",
      en:
        "Without De'Aaron Fox, San Antonio leaned on Dylan Harper in the starting lineup while Victor Wembanyama dominated with 41 points, 24 rebounds, and 3 blocks. Harper added 24 points, 11 rebounds, 6 assists, and 7 steals in a breakout night. Oklahoma City got 31 from Alex Caruso and 26 from Jalen Williams; Shai Gilgeous-Alexander had 24 points, 12 assists, and 5 steals but shot just 7-for-23. The game stayed tight into the closing stretch before Wembanyama hit a tying three late in the first overtime and sealed the second OT with a decisive dunk and alley-oop. The Thunder hung around with turnovers forced and Caruso’s perimeter shooting but lost the rebounding battle badly and held Chet Holmgren to 8 points in a 122-115 Spurs win.",
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
