import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_TIMBERWOLVES_TEAM_IDS = [
  "nba-spurs",
  "nba-timberwolves",
] as const;

/** H2H カードは左=Spurs、右=Timberwolves で固定 */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Timberwolves";

/** 2025-26 Spurs vs Timberwolves（レギュラー3） */
export const spursTimberwolvesH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-wolves-2025-11-30",
    dateEt: "2025-11-30",
    dateJst: "2025-12-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 125,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["S. Castle", "J. McLaughlin", "V. Wembanyama"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-wolves-2026-01-11",
    dateEt: "2026-01-11",
    dateJst: "2026-01-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 104,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["D. Vassell"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-wolves-2026-01-17",
    dateEt: "2026-01-17",
    dateJst: "2026-01-18",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 126,
    scoreRight: 123,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["D. Vassell"],
    injuriesRight: [],
  },
];

/** 左=SAS・右=MIN のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursTimberwolvesH2HStatsFromGames(games: NbaH2HGameCard[]): {
  spursPpg: number;
  wolvesPpg: number;
  spursPapg: number;
  wolvesPapg: number;
  spursNet: number;
  wolvesNet: number;
} {
  let spursPts = 0;
  let wolvesPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursTimberwolvesH2H: missing scores for ${g.id}`);
    }
    spursPts += g.scoreLeft;
    wolvesPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const spursPpg = r1(spursPts / n);
  const wolvesPpg = r1(wolvesPts / n);
  const spursPapg = wolvesPpg;
  const wolvesPapg = spursPpg;
  const wolvesNet = r1(wolvesPpg - wolvesPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    spursPpg,
    wolvesPpg,
    spursPapg,
    wolvesPapg,
    spursNet,
    wolvesNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursTimberwolvesH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-spurs") || !ids.has("nba-timberwolves")) {
    return null;
  }

  const {
    spursPpg,
    wolvesPpg,
    spursPapg,
    wolvesPapg,
    spursNet,
    wolvesNet,
  } = spursTimberwolvesH2HStatsFromGames(spursTimberwolvesH2HGames);

  if (homeTeamId === "nba-timberwolves") {
    return {
      homeAvgPts: wolvesPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: wolvesPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: wolvesNet,
      awayNetRtg: spursNet,
    };
  }
  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: wolvesPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: wolvesPapg,
      homeNetRtg: spursNet,
      awayNetRtg: wolvesNet,
    };
  }
  return null;
}
