import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SIXERS_CELTICS_TEAM_IDS = ["nba-76ers", "nba-celtics"] as const;

/** H2Hカードは左=Celtics、右=76ers で固定（左右・スコア・ホーム表示・欠場を反転） */
const H2H_LEFT = "Celtics";
const H2H_RIGHT = "76ers";

/** 2025-26 レギュラー Celtics vs 76ers（4試合・2勝2敗） */
export const sixersCelticsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-sixers-celtics-2025-10-22",
    dateEt: "2025-10-22",
    dateJst: "2025-10-23",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 116,
    scoreRight: 117,
    homeTeamSide: "left",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["P. George", "J. McCain"],
  },
  {
    id: "h2h-sixers-celtics-2025-10-31",
    dateEt: "2025-10-31",
    dateJst: "2025-11-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 108,
    homeTeamSide: "right",
    injuriesLeft: ["J. Tatum", "R. Harper Jr."],
    injuriesRight: ["D. Barlow", "P. George", "J. McCain"],
  },
  {
    id: "h2h-sixers-celtics-2025-11-11",
    dateEt: "2025-11-11",
    dateJst: "2025-11-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 100,
    scoreRight: 102,
    homeTeamSide: "right",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["D. Barlow", "J. Embiid", "P. George"],
  },
  {
    id: "h2h-sixers-celtics-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 98,
    homeTeamSide: "left",
    injuriesLeft: ["J. Tatum"],
    injuriesRight: ["J. Embiid", "P. George"],
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
