import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SIXERS_CELTICS_TEAM_IDS = ["nba-76ers", "nba-celtics"] as const;

/** H2Hカードは左=Celtics、右=76ers で固定（左右・スコア・ホーム表示・欠場を反転） */
const H2H_LEFT = "Celtics";
const H2H_RIGHT = "76ers";

/** 2025-26 Celtics vs 76ers（レギュラー4 + プレーオフ5） */
export const sixersCelticsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-sixers-celtics-2025-10-22",
    dateEt: "2025-10-21",
    dateJst: "2025-10-22",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 117,
    /** Boston（Celtics）ホーム — 76ers @ Celtics */
    homeTeamSide: "left",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["P. George", "J. McCain", "T. Watford"],
  },
  {
    id: "h2h-sixers-celtics-2025-10-31",
    dateEt: "2025-10-30",
    dateJst: "2025-10-31",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 108,
    /** Philadelphia（76ers）ホーム — Celtics @ 76ers */
    homeTeamSide: "right",
    injuriesLeft: ["J. Tatum", "R. Harper Jr."],
    injuriesRight: ["D. Barlow", "P. George", "J. McCain"],
  },
  {
    id: "h2h-sixers-celtics-2025-11-11",
    dateEt: "2025-11-10",
    dateJst: "2025-11-11",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 100,
    scoreRight: 102,
    /** Philadelphia（76ers）ホーム — Celtics @ 76ers */
    homeTeamSide: "right",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["D. Barlow", "J. Broome", "J. Embiid", "P. George"],
  },
  {
    id: "h2h-sixers-celtics-2026-03-01",
    dateEt: "2026-02-28",
    dateJst: "2026-03-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 98,
    /** Boston（Celtics）ホーム — 76ers @ Celtics */
    homeTeamSide: "left",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["J. Embiid", "P. George"],
  },
  {
    id: "h2h-sixers-celtics-2026-04-19",
    dateEt: "2026-04-19",
    dateJst: "2026-04-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 91,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["J. Embiid"],
    inactiveFooterSummary: {
      ja:
        "Bostonはまさに“Celticsらしい試合”で、守備、ボール循環、層の厚さが全部出た。\n" +
        "TatumのPo復帰戦としても十分で、Embiid不在のPhiladelphiaは攻撃の軸を作れず、序盤から差を広げられたまま押し切られた。\n" +
        "単なる大勝というより「Bostonが自分たちのスタンダードをそのまま見せた試合」。",
      en:
        "This was quintessential Celtics basketball—defense, ball movement, and roster depth all on display.\n" +
        "Strong enough as Jayson Tatum’s return game in the playoffs, and without Joel Embiid, Philadelphia never found a true offensive hub and was run out after an early gap opened.\n" +
        "Less a mere blowout than Boston simply playing to its standard, start to finish.",
    },
  },
  {
    id: "h2h-sixers-celtics-2026-04-21",
    dateEt: "2026-04-21",
    dateJst: "2026-04-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 97,
    scoreRight: 111,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["J. Embiid"],
    inactiveFooterSummary: {
      ja:
        "PhiladelphiaはGame 1の重さを引きずらず、MaxeyとEdgecombeのバックコートで流れを作り直した。\n" +
        "Edgecombeが30得点10リバウンド、Maxeyが29得点で計59点。さらに3P成功率でも76ersが19/39（48.7%）、Celticsが13/50（26.0%）と大差をつけて主導権を握った。\n" +
        "Bostonは第3Qに3点差まで戻したが、76ersが再加速して突き放し、シリーズを1-1に戻した。",
      en:
        "Philadelphia reset the tone after Game 1 through the Maxey-Edgecombe backcourt.\n" +
        "Edgecombe posted 30 points and 10 rebounds, Maxey added 29, and the pair combined for 59 while the 76ers also won the three-point battle decisively (19/39, 48.7%) over Boston (13/50, 26.0%).\n" +
        "The Celtics cut it to three in the third quarter, but Philadelphia accelerated again and pulled away to level the series at 1-1.",
    },
  },
  {
    id: "h2h-sixers-celtics-2026-04-23",
    dateEt: "2026-04-23",
    dateJst: "2026-04-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 100,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["J. Embiid"],
    inactiveFooterSummary: {
      ja:
        "CelticsはJayson TatumとJaylen Brownがそれぞれ25得点を記録し、終盤の勝負所でBostonの個の強さが出た。\n" +
        "76ersはJoel Embiid不在の中で粘り、試合終盤まで競ったが、4QにTatumが重要な得点を重ねて流れを渡さなかった。\n" +
        "Philadelphiaは守備では耐えたものの、ハーフコートで安定して点を取る形が足りず、最後に押し切られた。Celticsが接戦を取り、シリーズを2勝1敗とリード。",
      en:
        "Jayson Tatum and Jaylen Brown each scored 25 for Boston, and the Celtics’ individual shot-making showed up in the clutch.\n" +
        "Philadelphia hung around without Joel Embiid and stayed competitive late, but Tatum kept landing key buckets in the fourth to deny a real swing.\n" +
        "The 76ers held up defensively but lacked steady half-court scoring and were finally worn down. Boston escaped a tight game to take a 2-1 series lead.",
    },
  },
  {
    id: "h2h-sixers-celtics-2026-04-25",
    dateEt: "2026-04-25",
    dateJst: "2026-04-26",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 128,
    scoreRight: 96,
    /** Philadelphia（76ers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Celticsは1Qから34-18と主導権を握り、そのまま大差で押し切った。Payton Pritchardが32得点、Jayson Tatumが30得点11アシストを記録し、Philadelphia守備を崩し続けた。\n" +
        "76ersはJoel Embiidが復帰して26得点10リバウンド6アシストを残したが、チーム全体ではBostonの強度と展開力についていけなかった。\n" +
        "Celticsが3勝1敗でシリーズ突破に王手。",
      en:
        "Boston seized control early with a 34-18 first quarter and never let up. Payton Pritchard scored 32 and Jayson Tatum added 30 points and 11 assists, repeatedly stressing Philadelphia’s defense.\n" +
        "Joel Embiid returned with 26 points, 10 rebounds, and 6 assists, but the 76ers as a whole could not match Boston’s intensity or pace.\n" +
        "The Celtics moved to 3-1 and took a stranglehold on closing out the series.",
    },
  },
  {
    id: "h2h-sixers-celtics-2026-04-28",
    dateEt: "2026-04-28",
    dateJst: "2026-04-29",
    seriesGameLabel: "Game 5",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 97,
    scoreRight: 113,
    /** Boston（Celtics）ホーム — 76ers の敵地勝利 */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "76ers 113 - 97 Celtics。欠場者：76ers なし / Celtics なし。\n" +
        "76ersが敵地で勝利し、敗退を回避した試合。Joel Embiidが33得点・8アシストで中心となり、Celticsの守備を内外から崩した。Embiidはポストやミドルで得点するだけでなく、ヘルプを引きつけて周囲へ展開し、Philadelphiaの攻撃を落ち着かせた。Tyrese Maxeyも25得点・10リバウンドで、Embiidに依存しすぎない形を作った。\n" +
        "勝負を決めたのは第4Q。Celticsは終盤にシュートが完全に止まり、第4QのFGが3/22と大失速。76ersはそこを逃さず、28-11のランで一気に突き放した。BostonはJayson Tatumが24得点・16リバウンド、Jaylen Brownが22得点を記録したが、勝負どころでオフェンスの形を作れなかった。\n" +
        "Celticsはリードを作る時間帯もあったが、終盤は外角依存が強くなり、リングに圧力をかける攻撃が不足した。一方の76ersは守備強度を落とさず、リバウンドとトランジションでも集中を切らさなかった。シリーズはCeltics 3勝2敗のままだが、PhiladelphiaがGame 6へ望みをつないだ大きな勝利。",
      en:
        "76ers 113, Celtics 97. No absences for either team.\n" +
        "Philadelphia earned a road win to stay alive. Joel Embiid led the way with 33 points and 8 assists, stressing Boston’s defense inside and out—not only scoring from the post and mid-range, but drawing help and moving the ball to keep the 76ers’ attack composed. Tyrese Maxey added 25 points and 10 rebounds, giving the team a real second engine beyond Embiid.\n" +
        "The game broke open in the fourth: Boston’s offense stalled (3-for-22 FG in the quarter) while Philadelphia ripped off a 28-11 run. Jayson Tatum had 24 and 16 rebounds, Jaylen Brown 22, but the Celtics could not generate quality offense in the clutch.\n" +
        "Boston had its stretches in control, but late in the game leaned too much on the perimeter and not enough on rim pressure. The 76ers never let their defense slip, and they stayed connected on the glass and in transition. Boston still leads the series 3-2, but it was a massive win to force Game 6.",
    },
  },
];

function sixersCelticsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  sixersPpg: number;
  celticsPpg: number;
  sixersPapg: number;
  celticsPapg: number;
  sixersNet: number;
  celticsNet: number;
} {
  let sixersPts = 0;
  let celticsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`sixersCelticsH2H: missing scores for ${g.id}`);
    }
    /* 左=Celtics、右=76ers */
    celticsPts += g.scoreLeft;
    sixersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sixersPpg = r1(sixersPts / n);
  const celticsPpg = r1(celticsPts / n);
  const sixersPapg = celticsPpg;
  const celticsPapg = sixersPpg;
  const sixersNet = r1(sixersPpg - sixersPapg);
  const celticsNet = r1(celticsPpg - celticsPapg);
  return {
    sixersPpg,
    celticsPpg,
    sixersPapg,
    celticsPapg,
    sixersNet,
    celticsNet,
  };
}

export function sixersCelticsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-76ers") || !ids.has("nba-celtics")) {
    return null;
  }

  const {
    sixersPpg,
    celticsPpg,
    sixersPapg,
    celticsPapg,
    sixersNet,
    celticsNet,
  } = sixersCelticsH2HStatsFromGames(sixersCelticsH2HGames);

  if (homeTeamId === "nba-76ers") {
    return {
      homeAvgPts: sixersPpg,
      awayAvgPts: celticsPpg,
      homeAvgPtsAllowed: sixersPapg,
      awayAvgPtsAllowed: celticsPapg,
      homeNetRtg: sixersNet,
      awayNetRtg: celticsNet,
    };
  }
  if (homeTeamId === "nba-celtics") {
    return {
      homeAvgPts: celticsPpg,
      awayAvgPts: sixersPpg,
      homeAvgPtsAllowed: celticsPapg,
      awayAvgPtsAllowed: sixersPapg,
      homeNetRtg: celticsNet,
      awayNetRtg: sixersNet,
    };
  }
  return null;
}
