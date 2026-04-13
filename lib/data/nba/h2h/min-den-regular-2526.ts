import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const MIN_DEN_TEAM_IDS = ["nba-nuggets", "nba-timberwolves"] as const;

/** H2H カードは左=ナゲッツ、右=ティルブズで固定 */
const H2H_LEFT = "Nuggets";
const H2H_RIGHT = "Timberwolves";

/** 2025-26 レギュラー・ティルブズ対ナゲッツ（4試合） */
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

/** 上記4試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
