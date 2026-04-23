import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MAGIC_PISTONS_TEAM_IDS = ["nba-magic", "nba-pistons"] as const;

/** H2Hカードは左=Pistons、右=Magic で固定 */
const H2H_LEFT = "Pistons";
const H2H_RIGHT = "Magic";

/**
 * 2025-26 Magic vs Pistons（レギュラー4 + プレーオフ2）
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
