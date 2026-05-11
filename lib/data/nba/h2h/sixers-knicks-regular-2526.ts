import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SIXERS_KNICKS_TEAM_IDS = ["nba-76ers", "nba-knicks"] as const;

/** H2H カードは左=Knicks、右=76ers で固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "76ers";

/** 2025-26 Knicks vs 76ers（レギュラー4 + プレーオフ Game 4まで） */
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
  {
    id: "h2h-sixers-knicks-2026-05-04-po-g1",
    dateEt: "2026-05-04",
    dateJst: "2026-05-05",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 137,
    scoreRight: 98,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "序盤は拮抗したが、Knicksが1Q終盤から主導権を握りそのまま圧倒。Jalen Brunsonが35得点（前半だけで27）、OG Anunobyが18得点、Karl-Anthony TownsとMikal Bridgesも各17得点。New YorkはFG63.1%、3P51.4%と高確率で、守備でもPhiladelphiaを98点に抑えた。76ersはPaul George 17得点、Joel Embiid 14得点、Tyrese Maxey 13得点にとどまり、流れを変えられなかった。シリーズはNew Yorkが1-0。",
      en:
        "The game stayed competitive early, but the Knicks seized control late in the first quarter and never looked back. Jalen Brunson scored 35 (27 in the first half), OG Anunoby had 18, and Karl-Anthony Towns and Mikal Bridges each added 17. New York shot 63.1% from the field and 51.4% from three, holding Philadelphia to 98 points. The 76ers got 17 from Paul George, 14 from Joel Embiid, and 13 from Tyrese Maxey but could not flip the momentum. New York leads the series 1-0.",
    },
  },
  {
    id: "h2h-sixers-knicks-2026-05-07-po-g2",
    dateEt: "2026-05-07",
    dateJst: "2026-05-08",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 102,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["M. Robinson"],
    injuriesRight: ["J. Embiid"],
    inactiveFooterSummary: {
      ja:
        "Embiid不在の76ersは粘ったが、第4Qに失速。終盤のシュート精度とターンオーバーで差が出た。Tyrese Maxeyは26得点、Paul GeorgeとKelly Oubre Jr.が19得点。KnicksはJalen Brunsonが26得点、OG Anunobyが24得点、Karl-Anthony Townsが20得点。Knicksはペイントで56点を奪い、最後は地力で押し切った。シリーズはKnicksが2-0。",
      en:
        "The Embiid-less 76ers battled, but faded in the fourth quarter as late-shot quality and turnovers swung the game. Tyrese Maxey scored 26, while Paul George and Kelly Oubre Jr. added 19 each. For New York, Jalen Brunson had 26, OG Anunoby 24, and Karl-Anthony Towns 20. The Knicks scored 56 points in the paint and closed it out on execution late. New York leads the series 2-0.",
    },
  },
  {
    id: "h2h-sixers-knicks-2026-05-08-po-g3",
    dateEt: "2026-05-08",
    dateJst: "2026-05-09",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 94,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["O. Anunoby"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "76ersは序盤にPaul Georgeの3Pでリードを作ったが、第2Q以降に失速。KnicksはJalen Brunsonが33得点9アシスト、Mikal Bridgesが23得点。OG不在でもBrunson中心の攻撃で崩し切った。76ersはEmbiidが18得点、Maxeyが17得点、Oubreが22得点。Embiid復帰でも攻撃の持続力が足りず、Georgeも第1Q以降無得点で、シリーズは0-3になった。",
      en:
        "Philadelphia built an early lead behind Paul George’s three-point shooting but stalled after the first quarter. Jalen Brunson led New York with 33 points and 9 assists, while Mikal Bridges added 23. Even without OG Anunoby, the Knicks broke the game open behind Brunson’s orchestration. Joel Embiid had 18, Tyrese Maxey 17, and Kelly Oubre Jr. 22 in Embiid’s return, but the offense lacked staying power—and George did not score after the opening period. New York leads the series 3-0.",
    },
  },
  {
    id: "h2h-sixers-knicks-2026-05-11-po-g4",
    dateEt: "2026-05-11",
    dateJst: "2026-05-12",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 144,
    scoreRight: 114,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["O. Anunoby"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Knicksは序盤から3Pで試合を壊した。OG Anunoby欠場で先発したDeuce McBrideが25点・3P7本の大活躍。チーム全体でも25本の3Pを決め、76ersの守備を完全に崩した。Brunsonは22点で無理に背負いすぎず、HartとTownsも17点ずつ。76ersはEmbiidが24点、Maxeyが17点を取ったが、守備で修正できず完敗。Knicksがスイープで東カンファレンス決勝進出。",
      en:
        "The Knicks blew the game open early with a three-point barrage. Deuce McBride, starting in place of the injured OG Anunoby, erupted for 25 points on seven threes. New York knocked down 25 three-pointers as a team, shredding Philadelphia's defense. Jalen Brunson added 22 without forcing the issue, while Josh Hart and Karl-Anthony Towns each chipped in 17. Joel Embiid had 24 and Tyrese Maxey 17 for the 76ers, but they could not make defensive adjustments and were swept. The Knicks advance to the Eastern Conference Finals with a 4-0 sweep.",
    },
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

/** 上記8試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
