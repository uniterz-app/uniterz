import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MIN_DEN_TEAM_IDS = ["nba-nuggets", "nba-timberwolves"] as const;

/** H2H カードは左=ナゲッツ、右=ティルブズで固定 */
const H2H_LEFT = "Nuggets";
const H2H_RIGHT = "Timberwolves";

/** 2025-26 ティルブズ対ナゲッツ（レギュラー4 + プレーオフ3） */
export const minDenH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-min-den-2025-10-27",
    dateEt: "2025-10-27",
    dateJst: "2025-10-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 127,
    scoreRight: 114,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["A. Edwards", "J. Clark"],
  },
  {
    id: "h2h-min-den-2025-11-15",
    dateEt: "2025-11-15",
    dateJst: "2025-11-16",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 112,
    homeTeamSide: "right",
    injuriesLeft: ["C. Braun", "D. Holmes II", "C. Johnson"],
    injuriesRight: ["T. Shannon Jr."],
  },
  {
    id: "h2h-min-den-2025-12-25",
    dateEt: "2025-12-25",
    dateJst: "2025-12-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 142,
    scoreRight: 138,
    homeTeamSide: "left",
    wentToOvertime: true,
    injuriesLeft: ["C. Braun", "A. Gordon", "C. Johnson"],
    injuriesRight: [],
  },
  {
    id: "h2h-min-den-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 117,
    homeTeamSide: "left",
    injuriesLeft: ["A. Gordon"],
    injuriesRight: [],
  },
  {
    id: "h2h-min-den-2026-04-18",
    dateEt: "2026-04-18",
    dateJst: "2026-04-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 105,
    homeTeamSide: "left",
    injuriesLeft: ["P. Watson"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "序盤はWolvesが入ったが、結局はJokicとMurrayが試合を自分たちの形に戻した。\n" +
        "特に中盤以降、Denverがフィジカルな展開でも落ち着いて得点を積み、ゲームを“スターの支配下”に置いたのが印象的だった。\n" +
        "これは接戦の皮をかぶった試合というより「Denverのエース2人がシリーズの基準を先に示したGame 1」。\n" +
        "WolvesはAntの膝の状態が気になる。",
      en:
        "Minnesota had the early edge, but Jokić and Murray eventually bent the game back to Denver’s terms.\n" +
        "From the middle stages on, the Nuggets stayed composed in a physical game, stacking points and placing the night firmly under their stars’ control.\n" +
        "Less a nail-biter in disguise than a Game 1 where Denver’s two aces set the series standard first.\n" +
        "For the Wolves, Anthony Edwards’ knee will be worth watching.",
    },
  },
  {
    id: "h2h-min-den-2026-04-20",
    dateEt: "2026-04-20",
    dateJst: "2026-04-21",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 119,
    homeTeamSide: "right",
    injuriesLeft: ["P. Watson"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Nuggetsが第2Qに最大19点差をつけ、3Q終了時点でも93-90とリードしていたが、Wolvesが第4Qで逆転した。アントが30得点10リバウンド、ランドルが24得点9リバウンド、5outでnuggetsのゾーンDFにアンサー。Nuggetsはマレーが30得点、ヨキッチが24得点15リバウンド8アシストと数字は出たが、終盤2人のOFでシュートを決めきれず、さらにセカンドチャンスポイントで20-3と大きく差をつけられた。シリーズは1-1でWolvesのHomeへ",
      en:
        "Denver built a lead as large as 19 in the second quarter and still led 93-90 after three, but Minnesota flipped the game in the fourth. Edwards finished with 30 points and 10 rebounds, Randle added 24 and 9, and the Wolves countered the Nuggets’ zone with five-out spacing. Murray scored 30 and Jokić posted 24, 15 and 8, but late in the game the two stars could not convert enough looks in the half court, and Minnesota piled up second-chance points by 20-3 in a decisive stretch. The series is tied 1-1 heading to Minnesota.",
    },
  },
  {
    id: "h2h-min-den-2026-04-23",
    dateEt: "2026-04-23",
    dateJst: "2026-04-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 96,
    scoreRight: 113,
    homeTeamSide: "right",
    injuriesLeft: ["A. Gordon"],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Timberwolvesは開始直後からインテンシティでNuggetsを上回った。Jaden McDanielsとRudy Gobertが守備の基準を作り、一度もリードを許さなかった。\n" +
        "最大の論点はNikola Jokićのシュート内容。27点15リバウンドは残したが、FGは7/26で、プレーオフキャリアでもかなり悪い数字だった。\n" +
        "Aaron Gordon不在の影響も大きく、Minnesotaのフィジカルに対してNuggetsは前線で受け止める力が足りず、Jokićへの負担も増えた。Timberwolvesが守備強度と層の厚さで押し切り、シリーズをリードした。",
      en:
        "Minnesota’s intensity won the opening stretch and never let up—Jaden McDaniels and Rudy Gobert set the defensive standard, and the Wolves never trailed.\n" +
        "The headline was Nikola Jokić’s shooting night: 27 points and 15 rebounds, but 7-for-26 from the field—among the roughest playoff shooting lines of his career.\n" +
        "Without Aaron Gordon, Denver lacked enough front-line muscle to absorb Minnesota’s physicality, and Jokić’s load grew heavier. The Timberwolves leaned on their defense and depth for a 113-96 win and the series lead.",
    },
  },
];

/** 左=DEN・右=MIN のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function minDenH2HStatsFromGames(games: NbaH2HGameCard[]): {
  nuggetsPpg: number;
  wolvesPpg: number;
  nuggetsPapg: number;
  wolvesPapg: number;
  nuggetsNet: number;
  wolvesNet: number;
} {
  let denPts = 0;
  let minPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`minDenH2H: missing scores for ${g.id}`);
    }
    denPts += g.scoreLeft;
    minPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const nuggetsPpg = r1(denPts / n);
  const wolvesPpg = r1(minPts / n);
  const nuggetsPapg = wolvesPpg;
  const wolvesPapg = nuggetsPpg;
  const wolvesNet = r1(wolvesPpg - wolvesPapg);
  const nuggetsNet = r1(nuggetsPpg - nuggetsPapg);
  return {
    nuggetsPpg,
    wolvesPpg,
    nuggetsPapg,
    wolvesPapg,
    nuggetsNet,
    wolvesNet,
  };
}

/** 上記7試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function minDenH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-nuggets") || !ids.has("nba-timberwolves")) {
    return null;
  }

  const {
    nuggetsPpg,
    wolvesPpg,
    nuggetsPapg,
    wolvesPapg,
    nuggetsNet,
    wolvesNet,
  } = minDenH2HStatsFromGames(minDenH2HGames);

  if (homeTeamId === "nba-timberwolves") {
    return {
      homeAvgPts: wolvesPpg,
      awayAvgPts: nuggetsPpg,
      homeAvgPtsAllowed: wolvesPapg,
      awayAvgPtsAllowed: nuggetsPapg,
      homeNetRtg: wolvesNet,
      awayNetRtg: nuggetsNet,
    };
  }
  if (homeTeamId === "nba-nuggets") {
    return {
      homeAvgPts: nuggetsPpg,
      awayAvgPts: wolvesPpg,
      homeAvgPtsAllowed: nuggetsPapg,
      awayAvgPtsAllowed: wolvesPapg,
      homeNetRtg: nuggetsNet,
      awayNetRtg: wolvesNet,
    };
  }
  return null;
}
