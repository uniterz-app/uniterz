import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const HAWKS_KNICKS_TEAM_IDS = ["nba-hawks", "nba-knicks"] as const;

/** H2H カードは左=ニックス、右=ホークスで固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "Hawks";

/** 2025-26 ニックス対ホークス（レギュラー3 + プレーオフ3） */
export const hawksKnicksH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-hawks-knicks-2025-12-27",
    dateEt: "2025-12-27",
    dateJst: "2025-12-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 128,
    scoreRight: 125,
    homeTeamSide: "right",
    injuriesLeft: ["J. Hart", "M. McBride", "L. Shamet"],
    injuriesRight: ["K. Porzingis"],
  },
  {
    id: "h2h-hawks-knicks-2026-01-02",
    dateEt: "2026-01-02",
    dateJst: "2026-01-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 99,
    scoreRight: 111,
    homeTeamSide: "left",
    injuriesLeft: [
      "J. Hart",
      "M. Robinson",
      "L. Shamet",
      "K. Towns",
    ],
    injuriesRight: ["T. Young"],
  },
  {
    id: "h2h-hawks-knicks-2026-04-06",
    dateEt: "2026-04-06",
    dateJst: "2026-04-07",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 105,
    homeTeamSide: "right",
    injuriesLeft: ["T. Jemison III"],
    injuriesRight: ["J. Landale"],
  },
  {
    id: "h2h-hawks-knicks-2026-04-18",
    dateEt: "2026-04-18",
    dateJst: "2026-04-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 113,
    scoreRight: 102,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["J. Landale"],
    inactiveFooterSummary: {
      ja:
        "Knicksは「Brunsonで入りTownsで締めた」Game1。\n" +
        "Brunsonが1Qだけで19点で空気を作り、終盤はTownsが後半19点をマーク。内容としては圧勝ではなく、NYが自分たちの形を崩さずに勝ち切った試合。\n" +
        "Hawksは終盤に詰める場面は作ったが、試合全体ではKnicksの守備とサイズに押し返され、シリーズをひっくり返せるだけの持続的な攻撃までは出せなかった。",
      en:
        "Game 1 for the Knicks was a “Brunson opens it, Towns closes it” night.\n" +
        "Brunson dropped 19 in the first quarter to set the tone, and Towns answered with 19 in the second half. It wasn’t a blowout—New York simply stayed in its shape and found a way to win.\n" +
        "The Hawks manufactured late pressure, but across the full game they were pushed back by the Knicks’ defense and size, and couldn’t generate the sustained offense needed to truly flip the series outlook.",
    },
  },
  {
    id: "h2h-hawks-knicks-2026-04-20",
    dateEt: "2026-04-20",
    dateJst: "2026-04-21",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 106,
    scoreRight: 107,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["J. Landale"],
    inactiveFooterSummary: {
      ja:
        "Knicksが一時14点リード、第4Q残り5分でも8点差をつけていたが、Hawksが最後に15-6で試合をひっくり返した。マッカラムが32得点で終盤の勝負どころを連続して決め、さらにベースラインフェイダウェイで決勝点も沈めた。Knicksはブランソンが29得点、ハート、タウンズ、アヌノビーも支えたが、第4QのFG成功率が22.7%まで落ち、逃げ切れなかった。ブリッジスのブザービーターも外れ、シリーズは1-1でHawksのHomeへ",
      en:
        "New York led by as many as 14 and still held an 8-point edge with five minutes left in the fourth, but Atlanta closed on a 15-6 run to flip the game. McCollum scored 32 and repeatedly hit big shots down the stretch, including the game-winner on a baseline fadeaway. Brunson had 29 for the Knicks with Hart, Towns and Anunoby helping, but their fourth-quarter field-goal rate fell to 22.7% and they could not hold on. Bridges’ buzzer-beater missed as well, leaving the series tied 1-1 heading to Atlanta.",
    },
  },
  {
    id: "h2h-hawks-knicks-2026-04-23",
    dateEt: "2026-04-23",
    dateJst: "2026-04-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 109,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["J. Landale"],
    inactiveFooterSummary: {
      ja:
        "Hawksは攻撃のバリエーションでKnicksを上回った。CJ McCollumのプルアップ、Jalen Johnsonのドライブ、Jonathan Kumingaのリムアタックなど、複数の形から得点できた一方で、KnicksはJalen Brunsonへの依存が強く、終盤ほど攻撃が単調になった。\n" +
        "特にKnicksはウィング陣の歯止めが効かず、Mikal BridgesとJosh Hartの得点・外角・判断が安定せず、Hawksは最後まで守備の的を絞りやすく、1点差の接戦をものにしてシリーズをリードした。",
      en:
        "Atlanta beat New York with more offensive variety: CJ McCollum pull-ups, Jalen Johnson drives, and Jonathan Kuminga attacking the rim gave the Hawks multiple ways to score, while the Knicks leaned heavily on Jalen Brunson and grew more one-dimensional late.\n" +
        "New York’s wings were a problem—Mikal Bridges and Josh Hart never found a steady rhythm scoring, from the perimeter, or with their decisions—so Atlanta could keep its defensive focus narrow, escape with a 109-108 win, and take the series lead.",
    },
  },
];

/** 左=NYK・右=ATL のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function hawksKnicksH2HStatsFromGames(games: NbaH2HGameCard[]): {
  hawksPpg: number;
  knicksPpg: number;
  hawksPapg: number;
  knicksPapg: number;
  hawksNet: number;
  knicksNet: number;
} {
  let hawksPts = 0;
  let knicksPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`hawksKnicksH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    hawksPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const hawksPpg = r1(hawksPts / n);
  const knicksPpg = r1(knicksPts / n);
  const hawksPapg = knicksPpg;
  const knicksPapg = hawksPpg;
  const knicksNet = r1(knicksPpg - knicksPapg);
  const hawksNet = r1(hawksPpg - hawksPapg);
  return {
    hawksPpg,
    knicksPpg,
    hawksPapg,
    knicksPapg,
    hawksNet,
    knicksNet,
  };
}

/** 上記6試合からの H2H 平均（小数1桁）。 */
export function hawksKnicksH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-hawks") || !ids.has("nba-knicks")) {
    return null;
  }

  const {
    hawksPpg,
    knicksPpg,
    hawksPapg,
    knicksPapg,
    hawksNet,
    knicksNet,
  } = hawksKnicksH2HStatsFromGames(hawksKnicksH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: hawksPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: hawksPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: hawksNet,
    };
  }
  if (homeTeamId === "nba-hawks") {
    return {
      homeAvgPts: hawksPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: hawksPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: hawksNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
