import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_BLAZERS_TEAM_IDS = ["nba-spurs", "nba-blazers"] as const;

/** H2H カードは左=Spurs、右=Blazers で固定（プレーオフ試合カードの並びと一致） */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Blazers";

/** 2025-26 レギュラー Spurs vs Trail Blazers（3試合） */
export const spursBlazersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-blazers-2025-11-25",
    dateEt: "2025-11-25",
    dateJst: "2025-11-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 102,
    homeTeamSide: "left",
    injuriesLeft: ["S. Castle", "V. Wembanyama"],
    injuriesRight: [
      "S. Henderson",
      "J. Holiday",
      "D. Lillard",
      "M. Thybulle",
    ],
  },
  {
    id: "h2h-spurs-blazers-2026-01-02",
    dateEt: "2026-01-02",
    dateJst: "2026-01-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 110,
    scoreRight: 115,
    homeTeamSide: "right",
    injuriesLeft: ["D. Vassell", "V. Wembanyama"],
    injuriesRight: [
      "J. Grant",
      "S. Henderson",
      "J. Holiday",
      "D. Lillard",
      "M. Thybulle",
      "B. Wesley",
      "R. Williams III",
    ],
  },
  {
    id: "h2h-spurs-blazers-2026-04-07",
    dateEt: "2026-04-07",
    dateJst: "2026-04-08",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 101,
    homeTeamSide: "left",
    injuriesLeft: ["S. Castle", "V. Wembanyama"],
    injuriesRight: ["J. Grant", "D. Lillard"],
  },
];

/** 左=SAS・右=POR のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursBlazersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  spursPpg: number;
  blazersPpg: number;
  spursPapg: number;
  blazersPapg: number;
  spursNet: number;
  blazersNet: number;
} {
  let spursPts = 0;
  let blazersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursBlazersH2H: missing scores for ${g.id}`);
    }
    spursPts += g.scoreLeft;
    blazersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const spursPpg = r1(spursPts / n);
  const blazersPpg = r1(blazersPts / n);
  const spursPapg = blazersPpg;
  const blazersPapg = spursPpg;
  const blazersNet = r1(blazersPpg - blazersPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    spursPpg,
    blazersPpg,
    spursPapg,
    blazersPapg,
    spursNet,
    blazersNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursBlazersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-spurs") || !ids.has("nba-blazers")) {
    return null;
  }

  const {
    spursPpg,
    blazersPpg,
    spursPapg,
    blazersPapg,
    spursNet,
    blazersNet,
  } = spursBlazersH2HStatsFromGames(spursBlazersH2HGames);

  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: blazersPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: blazersPapg,
      homeNetRtg: spursNet,
      awayNetRtg: blazersNet,
    };
  }
  if (homeTeamId === "nba-blazers") {
    return {
      homeAvgPts: blazersPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: blazersPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: blazersNet,
      awayNetRtg: spursNet,
    };
  }
  return null;
}
