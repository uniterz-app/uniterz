import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MAGIC_PISTONS_TEAM_IDS = ["nba-magic", "nba-pistons"] as const;

/** H2Hカードは左=Pistons、右=Magic で固定 */
const H2H_LEFT = "Pistons";
const H2H_RIGHT = "Magic";

/**
 * 2025-26 Magic vs Pistons（レギュラー4 + プレーオフ6）
 * 出典: StatMuse 等の公開スコアに基づく（レギュラー直接対決 2-2）
 */
export const magicPistonsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-magic-pistons-2025-10-29",
    dateEt: "2025-10-29",
    dateJst: "2025-10-30",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 135,
    scoreRight: 116,
    homeTeamSide: "left",
    injuriesLeft: ["J. Ivey"],
    injuriesRight: ["J. Cain", "M. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2025-11-28",
    dateEt: "2025-11-28",
    dateJst: "2025-11-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 112,
    homeTeamSide: "right",
    injuriesLeft: ["M. Sasser"],
    injuriesRight: ["P. Banchero", "J. Cain", "M. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 106,
    scoreRight: 92,
    homeTeamSide: "left",
    injuriesLeft: ["I. Stewart"],
    injuriesRight: ["A. Black", "F. Wagner"],
  },
  {
    id: "h2h-magic-pistons-2026-04-06",
    dateEt: "2026-04-06",
    dateJst: "2026-04-07",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 123,
    homeTeamSide: "right",
    injuriesLeft: ["C. Cunningham", "I. Stewart"],
    injuriesRight: [],
  },
  {
    id: "h2h-magic-pistons-2026-04-19",
    dateEt: "2026-04-19",
    dateJst: "2026-04-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 101,
    scoreRight: 112,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["J. Isaac"],
    inactiveFooterSummary: {
      ja:
        "このGame 1は、Cadeの個人爆発があってもDetroit全体では押し切れず、Orlandoのまとまりとサイズ感が勝った試合だった。\n" +
        "BancheroとWagnerを中心にMagicが落ち着いて対応し、シリーズの空気を一気に変えるアウェー勝利になった。\n" +
        "「Pistonsの若さが出た敗戦」と同時に、「Magicが下位シードでも普通に嫌な相手であることを証明したGame 1」。\n" +
        "Pistonsは、Cade以外のスコアリングと、Durenの活躍に期待がかかる。",
      en:
        "Even with a big individual night from Cade Cunningham, Detroit couldn’t impose its will as a team—Orlando’s cohesion and size won the day.\n" +
        "Led by Paolo Banchero and Franz Wagner, the Magic stayed composed and stole Game 1 on the road, instantly shifting the series’ tone.\n" +
        "It was both a loss where Detroit’s youth showed—and a Game 1 that proved the Magic are a tough out even as the lower seed.\n" +
        "The Pistons will need more scoring beyond Cade, and more from Jalen Duren, going forward.",
    },
  },
  {
    id: "h2h-magic-pistons-2026-04-21",
    dateEt: "2026-04-21",
    dateJst: "2026-04-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 98,
    scoreRight: 83,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "DetroitはGame 1の流れをそのまま受けるのではなく、守備強度とリバウンドで試合の質自体を変えた。\n" +
        "前半は46-46の重い展開だったが、後半に入って一気に圧力を強め、第3Qを38-16、しかもその中で30-3のランを作って試合を決めた。\n" +
        "一方のOrlandoは、Game 1で見せた落ち着いたオフェンスがほぼ出なかった。FG32.5%、3P25.0%と全体的にショットが沈まず、Detroitがシリーズの強度を自分たちの土俵に引き戻したGame 2。",
      en:
        "Detroit did not carry over the Game 1 flow; it changed the game itself with defensive pressure and rebounding.\n" +
        "The first half was a grind at 46-46, but the Pistons raised the intensity after halftime, won the third quarter 38-16, and effectively decided the game with a 30-3 run.\n" +
        "Orlando never found the composed offense it showed in Game 1, shooting just 32.5% from the field and 25.0% from three, as Detroit pulled the series back onto its preferred physical terms.",
    },
  },
  {
    id: "h2h-magic-pistons-2026-04-25",
    dateEt: "2026-04-25",
    dateJst: "2026-04-26",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 113,
    /** Orlando（Magic）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["J. Isaac"],
    inactiveFooterSummary: {
      ja:
        "MagicはPaolo BancheroとDesmond Baneがそれぞれ25得点を記録。Baneは外角から高確率で沈め、Pistons守備を広げた。\n" +
        "PistonsはCade Cunninghamが27得点9アシストと攻撃を作ったが、9ターンオーバーが重く、勝負所で流れを渡した。\n" +
        "Magicがホームで取り返し、シリーズを2勝1敗とした。",
      en:
        "Paolo Banchero and Desmond Bane each scored 25 for Orlando; Bane stretched the floor from deep at a high clip and widened Detroit’s defense.\n" +
        "Cade Cunningham created offense with 27 points and 9 assists, but 9 turnovers loomed large and the Pistons gave away key momentum swings.\n" +
        "The Magic defended home court and took a 2-1 series lead.",
    },
  },
  {
    id: "h2h-magic-pistons-2026-04-27",
    dateEt: "2026-04-27",
    dateJst: "2026-04-28",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 88,
    scoreRight: 94,
    /** Detroit（Pistons）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["J. Isaac"],
    inactiveFooterSummary: {
      ja:
        "MagicはFG32.6%と苦しみながらも、終盤の守備で勝ち切った。Desmond Baneが22点、Franz Wagnerが19点、Paolo Bancheroが18点。PistonsはCade Cunninghamが25点を記録したが、8ターンオーバーが重く、終盤に得点が止まった。Magicは残り約5分から7-1のランで主導権を奪い、94-88で勝利。Franz Wagnerはふくらはぎ負傷で途中退場。",
      en:
        "Orlando grinded to a 32.6% FG night but closed it out with late defense. Desmond Bane had 22, Franz Wagner 19, and Paolo Banchero 18. Cade Cunningham scored 25 for Detroit, but eight turnovers loomed large and the Pistons went cold down the stretch. The Magic seized control on a 7-1 run over the final ~five minutes in a 94-88 win. Wagner exited with a calf injury.",
    },
  },
  {
    id: "h2h-magic-pistons-2026-05-02",
    dateEt: "2026-05-02",
    dateJst: "2026-05-03",
    seriesGameLabel: "Game 5",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 109,
    /** Orlando（Magic）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["K. Huerter"],
    injuriesRight: ["J. Isaac", "F. Wagner"],
    inactiveFooterSummary: {
      ja:
        "DetroitはCade Cunninghamの45得点で敗退を回避。Tobias Harrisが23得点8アシスト、Ausar Thompsonも15リバウンド5スティールで支えた。OrlandoはPaolo Bancheroが45得点9リバウンド7アシストと対抗したが、終盤のクラッチでDetroitに押し切られた。シリーズはOrlando 3-2。",
      en:
        "Detroit stayed alive behind 45 points from Cade Cunningham. Tobias Harris added 23 and 8 assists, and Ausar Thompson chipped in 15 rebounds and 5 steals. Paolo Banchero countered with 45, 9, and 7 for Orlando, but the Pistons closed the clutch minutes to win on the road. Orlando still leads the series 3-2.",
    },
  },
  {
    id: "h2h-magic-pistons-2026-05-03",
    dateEt: "2026-05-03",
    dateJst: "2026-05-04",
    seriesGameLabel: "Game 6",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 93,
    scoreRight: 79,
    /** Detroit（Pistons）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["K. Huerter"],
    injuriesRight: ["J. Isaac", "F. Wagner"],
    inactiveFooterSummary: {
      ja:
        "Orlandoは前半に試合を支配して最大24点差まで広げたが、後半に完全に失速した。DetroitはCade Cunninghamが32得点10リバウンド、Tobias Harrisが22得点10リバウンドで立て直し、後半だけで55-19と圧倒して逆転。Magicは第3Qから第4Q序盤にかけて23本連続でFGを外し、後半合計19得点に終わった。Paolo Bancheroは17得点9リバウンド7アシストを記録したが、FG4/20と苦しみ、最後まで流れを戻せなかった。\n" +
        "シリーズは3勝3敗となった。",
      en:
        "Orlando dominated the first half and led by as many as 24, then completely unraveled after halftime. Detroit steadied behind 32 points and 10 rebounds from Cade Cunningham and 22 and 10 from Tobias Harris, outscoring the Magic 55-19 in the second half to flip the game. From late in the third through early in the fourth, Orlando missed 23 straight field goals and scored only 19 points after the break. Paolo Banchero finished with 17, 9, and 7 but shot 4-for-20 and never got the offense back on track.\n" +
        "The series is tied 3-3.",
    },
  },
];

function magicPistonsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  magicPpg: number;
  pistonsPpg: number;
  magicPapg: number;
  pistonsPapg: number;
  magicNet: number;
  pistonsNet: number;
} {
  let magicPts = 0;
  let pistonsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`magicPistonsH2H: missing scores for ${g.id}`);
    }
    /* 左列=Pistons、右列=Magic */
    pistonsPts += g.scoreLeft;
    magicPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const pistonsPpg = r1(pistonsPts / n);
  const magicPpg = r1(magicPts / n);
  const pistonsPapg = magicPpg;
  const magicPapg = pistonsPpg;
  const pistonsNet = r1(pistonsPpg - pistonsPapg);
  const magicNet = r1(magicPpg - magicPapg);
  return {
    magicPpg,
    pistonsPpg,
    magicPapg,
    pistonsPapg,
    magicNet,
    pistonsNet,
  };
}

export function magicPistonsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-magic") || !ids.has("nba-pistons")) {
    return null;
  }

  const {
    magicPpg,
    pistonsPpg,
    magicPapg,
    pistonsPapg,
    magicNet,
    pistonsNet,
  } = magicPistonsH2HStatsFromGames(magicPistonsH2HGames);

  if (homeTeamId === "nba-pistons") {
    return {
      homeAvgPts: pistonsPpg,
      awayAvgPts: magicPpg,
      homeAvgPtsAllowed: pistonsPapg,
      awayAvgPtsAllowed: magicPapg,
      homeNetRtg: pistonsNet,
      awayNetRtg: magicNet,
    };
  }
  if (homeTeamId === "nba-magic") {
    return {
      homeAvgPts: magicPpg,
      awayAvgPts: pistonsPpg,
      homeAvgPtsAllowed: magicPapg,
      awayAvgPtsAllowed: pistonsPapg,
      homeNetRtg: magicNet,
      awayNetRtg: pistonsNet,
    };
  }
  return null;
}
