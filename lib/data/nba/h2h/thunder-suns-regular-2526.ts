import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_SUNS_TEAM_IDS = ["nba-thunder", "nba-suns"] as const;

/** H2Hカードは左=Thunder、右=Suns で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Suns";

/**
 * 2025-26 Thunder vs Suns（レギュラー5 + プレーオフ1）
 * 左列=Thunder得点、右列=Suns得点。
 */
export const thunderSunsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-thunder-suns-2025-11-28",
    dateEt: "2025-11-28",
    dateJst: "2025-11-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["A. Wiggins"],
    injuriesRight: ["G. Allen", "R. Dunn", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2025-12-10",
    dateEt: "2025-12-10",
    dateJst: "2025-12-11",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 138,
    scoreRight: 89,
    homeTeamSide: "left",
    injuriesLeft: ["I. Hartenstein", "I. Joe"],
    injuriesRight: ["D. Booker", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-01-04",
    dateEt: "2026-01-04",
    dateJst: "2026-01-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 108,
    homeTeamSide: "right",
    injuriesLeft: ["I. Hartenstein", "Jay. Williams"],
    injuriesRight: ["J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-02-11",
    dateEt: "2026-02-11",
    dateJst: "2026-02-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 136,
    scoreRight: 109,
    homeTeamSide: "right",
    injuriesLeft: ["S. Gilgeous-Alexander", "A. Mitchell"],
    injuriesRight: ["G. Allen", "D. Booker", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-04-12",
    dateEt: "2026-04-12",
    dateJst: "2026-04-13",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 135,
    homeTeamSide: "left",
    injuriesLeft: [
      "A. Caruso",
      "S. Gilgeous-Alexander",
      "I. Hartenstein",
      "C. Holmgren",
      "I. Joe",
      "A. Mitchell",
      "C. Wallace",
      "J. Williams",
      "Jay. Williams",
    ],
    injuriesRight: ["G. Allen", "D. Booker", "D. Brooks", "R. O'Neale"],
  },
  {
    id: "h2h-thunder-suns-2026-04-19",
    dateEt: "2026-04-19",
    dateJst: "2026-04-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 119,
    scoreRight: 84,
    homeTeamSide: "left",
    injuriesLeft: ["T. Sorber"],
    injuriesRight: ["M. Williams"],
    inactiveFooterSummary: {
      ja:
        "OKCは連覇候補らしい入りで、守備圧とトランジションで一気に試合を壊した。\n" +
        "SGAが爆発的な当たり日ではなくても勝てたこと、Jalen WilliamsやChetまで含めて全体で押し切れたことが大きい。\n" +
        "OKCはPOで更にDFのギアを上げて、Phoenixが自分の形に持ち込む前に守備で分断した。",
      en:
        "OKC opened like a repeat-title contender, blowing the game open with defensive pressure and transition.\n" +
        "Winning without Shai Gilgeous-Alexander needing a nuclear scoring night mattered—and the Thunder rolled as a group, with Jalen Williams and Chet Holmgren among those powering the push.\n" +
        "In the playoffs they shifted defense up another gear, splintering Phoenix on that end before the Suns could settle into their game.",
    },
  },
];

function thunderSunsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  thunderPpg: number;
  sunsPpg: number;
  thunderPapg: number;
  sunsPapg: number;
  thunderNet: number;
  sunsNet: number;
} {
  let thunderPts = 0;
  let sunsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`thunderSunsH2H: missing scores for ${g.id}`);
    }
    thunderPts += g.scoreLeft;
    sunsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sunsPpg = r1(sunsPts / n);
  const thunderPpg = r1(thunderPts / n);
  const sunsPapg = thunderPpg;
  const thunderPapg = sunsPpg;
  const sunsNet = r1(sunsPpg - sunsPapg);
  const thunderNet = r1(thunderPpg - thunderPapg);
  return {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  };
}

export function thunderSunsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-thunder") || !ids.has("nba-suns")) {
    return null;
  }

  const {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  } = thunderSunsH2HStatsFromGames(thunderSunsH2HGames);

  if (homeTeamId === "nba-suns") {
    return {
      homeAvgPts: sunsPpg,
      awayAvgPts: thunderPpg,
      homeAvgPtsAllowed: sunsPapg,
      awayAvgPtsAllowed: thunderPapg,
      homeNetRtg: sunsNet,
      awayNetRtg: thunderNet,
    };
  }
  if (homeTeamId === "nba-thunder") {
    return {
      homeAvgPts: thunderPpg,
      awayAvgPts: sunsPpg,
      homeAvgPtsAllowed: thunderPapg,
      awayAvgPtsAllowed: sunsPapg,
      homeNetRtg: thunderNet,
      awayNetRtg: sunsNet,
    };
  }
  return null;
}
