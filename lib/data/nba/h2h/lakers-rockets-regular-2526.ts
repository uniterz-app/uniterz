import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const LAKERS_ROCKETS_TEAM_IDS = ["nba-lakers", "nba-rockets"] as const;

/** H2H カードは左=レイカーズ、右=ロケッツで固定 */
const H2H_LEFT = "Lakers";
const H2H_RIGHT = "Rockets";

/** 2025-26 ロケッツ対レイカーズ（レギュラー3 + プレーオフ6） */
export const lakersRocketsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-lakers-rockets-2025-12-25",
    dateEt: "2025-12-25",
    dateJst: "2025-12-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 96,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["J. Hayes", "G. Vincent"],
    injuriesRight: ["F. VanVleet"],
  },
  {
    id: "h2h-lakers-rockets-2026-03-16",
    dateEt: "2026-03-16",
    dateJst: "2026-03-17",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 100,
    scoreRight: 92,
    homeTeamSide: "right",
    injuriesLeft: ["M. Kleber"],
    injuriesRight: [
      "S. Adams",
      "J. Davison",
      "J. Tate",
      "F. VanVleet",
    ],
  },
  {
    id: "h2h-lakers-rockets-2026-03-18",
    dateEt: "2026-03-18",
    dateJst: "2026-03-19",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 124,
    scoreRight: 116,
    homeTeamSide: "right",
    injuriesLeft: ["M. Kleber"],
    injuriesRight: [
      "S. Adams",
      "T. Newton",
      "J. Tate",
      "F. VanVleet",
    ],
  },
  {
    id: "h2h-lakers-rockets-2026-04-18",
    dateEt: "2026-04-18",
    dateJst: "2026-04-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 98,
    homeTeamSide: "left",
    injuriesLeft: ["L. Doncic", "A. Reaves"],
    injuriesRight: ["S. Adams", "F. VanVleet", "K. Durant"],
    inactiveFooterSummary: {
      ja:
        "この試合の主役は完全にKennardで、Lakersは主力欠場があっても周辺戦力が機能する形を見せたのが収穫だった。\n" +
        "LeBronが試合全体を安定させ、Houstonは若さとサイズはあっても、オフェンスの組み立てと外の再現性で後手に回った。\n" +
        "Lakersの底力と同時に、RocketsはDurant不在以上に攻撃の整理不足が露呈したGame 1だった。",
      en:
        "Kennard was the undisputed star of the night, and the Lakers’ biggest takeaway was proving their supporting cast could deliver with key starters sidelined.\n" +
        "LeBron steadied the game from start to finish; Houston had youth and size, but trailed in offensive structure and perimeter shot-making consistency.\n" +
        "It was a Game 1 that highlighted L.A.’s depth—and for the Rockets, exposed offensive disorganization beyond Durant’s absence.",
    },
  },
  {
    id: "h2h-lakers-rockets-2026-04-21",
    dateEt: "2026-04-21",
    dateJst: "2026-04-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 101,
    scoreRight: 94,
    homeTeamSide: "left",
    injuriesLeft: ["L. Doncic", "A. Reaves"],
    injuriesRight: ["F. VanVleet", "S. Adams"],
    inactiveFooterSummary: {
      ja:
        "Lakersは守備と試合運びで押し切ったGame 2だった。DoncicとReavesを欠く中でもLeBronが28得点8リバウンド7アシストで軸になり、さらにMarcus Smartが25得点、Kennardが23得点を加えて、ロースコア寄りの展開を最後までコントロールした。\n" +
        "HoustonはDurantが復帰して23得点を挙げたが、9ターンオーバーと後半3得点で流れを変えきれず、チーム全体でも3Pは7/29と伸びなかった。\n" +
        "Lakersは第3Qに突き放して主導権を握り、Rocketsは終盤に差を詰めても、試合全体では最後まで自分たちのペースに持ち込めなかった。",
      en:
        "Game 2 was won by the Lakers through defense and game control. Even without Doncic and Reaves, LeBron anchored the night with 28 points, 8 rebounds, and 7 assists, while Marcus Smart added 25 and Kennard scored 23 to manage a low-scoring script to the finish.\n" +
        "Houston got Durant back and 23 points from him, but his nine turnovers and just three second-half points prevented any real swing, and the Rockets also shot only 7/29 from three as a team.\n" +
        "The Lakers seized control in the third quarter, and while Houston trimmed the margin late, it still never fully imposed its pace across the game.",
    },
  },
  {
    id: "h2h-lakers-rockets-2026-04-23",
    dateEt: "2026-04-23",
    dateJst: "2026-04-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 108,
    wentToOvertime: true,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["L. Doncic", "A. Reaves"],
    injuriesRight: ["K. Durant", "S. Adams", "F. VanVleet"],
    inactiveFooterSummary: {
      ja:
        "LakersはLuka DončićとAustin Reavesを欠く中、LeBron Jamesが29得点13リバウンドで試合を支えた。\n" +
        "終盤はHoustonがAlperen Sengunの得点などでリードを奪ったが、LeBronが残り13秒で同点3Pを決めて延長へ。OTではMarcus Smartが8得点を挙げ、Lakersが勝負所を制した。\n" +
        "RocketsはKevin Durant不在ながらSengunが33得点16リバウンド、Amen Thompsonも26得点11リバウンドで粘ったが、最後の経験値と決定力でLakersが上回った。Lakersが3勝0敗でシリーズ突破に王手。",
      en:
        "Without Luka Dončić and Austin Reaves, the Lakers leaned on LeBron James (29 points, 13 rebounds) to stay afloat.\n" +
        "Houston seized the lead late behind Alperen Sengun’s scoring, but LeBron drilled a tying three with 13 seconds left to force overtime. Marcus Smart scored eight in OT as L.A. won the clutch minutes.\n" +
        "Even with Kevin Durant sidelined, the Rockets got 33 points and 16 rebounds from Sengun and 26 points and 11 boards from Amen Thompson—but experience and shot-making tilted the night to the Lakers, who moved to 3-0 and took a stranglehold on the series.",
    },
  },
  {
    id: "h2h-lakers-rockets-2026-04-26",
    dateEt: "2026-04-26",
    dateJst: "2026-04-27",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 96,
    scoreRight: 115,
    /** Houston（Rockets）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["L. Doncic", "A. Reaves"],
    injuriesRight: ["S. Adams", "K. Durant", "F. VanVleet"],
    inactiveFooterSummary: {
      ja:
        "Rocketsは敗退回避をかけた試合でエネルギーを前面に出し、Lakersを115-96で圧倒した。Amen Thompsonが23得点で流れを作り、チーム全体でもLakersの24ターンオーバーから30得点を奪った。\n" +
        "Lakersは主力不在の影響もあり、攻撃のリズムが最後まで安定しなかった。\n" +
        "Houstonがスイープを回避し、Lakersのシリーズリードは3勝1敗となった。",
      en:
        "Houston played with desperation and ran past the Lakers 115-96. Amen Thompson’s 23 points sparked the night, and the Rockets turned 24 L.A. turnovers into 30 points.\n" +
        "Shorthanded Los Angeles never found a steady offensive rhythm.\n" +
        "Houston avoided the sweep; the Lakers’ lead now stands at 3-1.",
    },
  },
  {
    id: "h2h-lakers-rockets-2026-05-02",
    dateEt: "2026-05-02",
    dateJst: "2026-05-03",
    seriesGameLabel: "Game 5",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 93,
    scoreRight: 99,
    /** Houston（Rockets）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["L. Doncic"],
    injuriesRight: ["S. Adams", "K. Durant", "F. VanVleet"],
    inactiveFooterSummary: {
      ja:
        "Houstonは2試合連続で敗退を回避。Jabari Smith Jr.が22得点、Tari Easonが18得点。守備でLakersの攻撃を重くし、Los AngelesはFG42.1%、3P25.9%と低調だった。LeBron Jamesは25得点7アシストだったが、終盤まで流れを変え切れなかった。シリーズはLakers 3-2。",
      en:
        "Houston stayed alive for the second straight game. Jabari Smith Jr. scored 22 and Tari Eason 18, and the Rockets made the Lakers’ offense grind—Los Angeles shot just 42.1% from the field and 25.9% from three. LeBron James had 25 points and 7 assists but could not fully swing the game late. The Lakers still lead the series 3-2.",
    },
  },
  {
    id: "h2h-lakers-rockets-2026-05-03",
    dateEt: "2026-05-03",
    dateJst: "2026-05-04",
    seriesGameLabel: "Game 6",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 98,
    scoreRight: 78,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["L. Doncic"],
    injuriesRight: ["S. Adams", "K. Durant", "F. VanVleet"],
    inactiveFooterSummary: {
      ja:
        "Los Angelesは立ち上がりから守備で主導権を握り、Houstonを前半31得点に抑えた。LeBron Jamesが28得点8アシスト7リバウンド、Rui Hachimuraが21得点、Austin Reavesが15得点で続き、試合を通してリードを維持した。HoustonはFG成功率が30％台前半、3P成功率も20％未満まで落ち、オフェンスが機能しなかった。Lakersは派手な打ち合いではなく、守備と試合運びで締め切った勝利だった。\n" +
        "Lakersがシリーズ4勝2敗で突破した。",
      en:
        "Los Angeles grabbed control early with defense and held Houston to 31 points in the first half. LeBron James led with 28 points, 8 assists, and 7 rebounds; Rui Hachimura added 21 and Austin Reaves 15 as the Lakers led wire-to-wire. The Rockets stalled offensively—field-goal percentage in the low 30s and three-point shooting below 20%—and never found a rhythm. It was not a shootout; L.A. closed the series with defense and execution.\n" +
        "The Lakers advanced 4-2.",
    },
  },
];

/** 左=LAL・右=HOU のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function lakersRocketsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  lakersPpg: number;
  rocketsPpg: number;
  lakersPapg: number;
  rocketsPapg: number;
  lakersNet: number;
  rocketsNet: number;
} {
  let lakersPts = 0;
  let rocketsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`lakersRocketsH2H: missing scores for ${g.id}`);
    }
    lakersPts += g.scoreLeft;
    rocketsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const lakersPpg = r1(lakersPts / n);
  const rocketsPpg = r1(rocketsPts / n);
  const lakersPapg = rocketsPpg;
  const rocketsPapg = lakersPpg;
  const rocketsNet = r1(rocketsPpg - rocketsPapg);
  const lakersNet = r1(lakersPpg - lakersPapg);
  return {
    lakersPpg,
    rocketsPpg,
    lakersPapg,
    rocketsPapg,
    lakersNet,
    rocketsNet,
  };
}

/** 上記8試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function lakersRocketsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-lakers") || !ids.has("nba-rockets")) {
    return null;
  }

  const {
    lakersPpg,
    rocketsPpg,
    lakersPapg,
    rocketsPapg,
    lakersNet,
    rocketsNet,
  } = lakersRocketsH2HStatsFromGames(lakersRocketsH2HGames);

  if (homeTeamId === "nba-rockets") {
    return {
      homeAvgPts: rocketsPpg,
      awayAvgPts: lakersPpg,
      homeAvgPtsAllowed: rocketsPapg,
      awayAvgPtsAllowed: lakersPapg,
      homeNetRtg: rocketsNet,
      awayNetRtg: lakersNet,
    };
  }
  if (homeTeamId === "nba-lakers") {
    return {
      homeAvgPts: lakersPpg,
      awayAvgPts: rocketsPpg,
      homeAvgPtsAllowed: lakersPapg,
      awayAvgPtsAllowed: rocketsPapg,
      homeNetRtg: lakersNet,
      awayNetRtg: rocketsNet,
    };
  }
  return null;
}
