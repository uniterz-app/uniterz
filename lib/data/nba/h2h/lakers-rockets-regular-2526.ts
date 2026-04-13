import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const LAKERS_ROCKETS_TEAM_IDS = ["nba-lakers", "nba-rockets"] as const;

/** H2H カードは左=レイカーズ、右=ロケッツで固定 */
const H2H_LEFT = "Lakers";
const H2H_RIGHT = "Rockets";

/** 2025-26 レギュラー・ロケッツ対レイカーズ（3試合） */
export const lakersRocketsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-lakers-rockets-2025-12-25",
    dateEt: "2025-12-25",
    dateJst: "2025-12-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 96,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["J. Hayes", "G. Vincent"],
    injuriesRight: ["F. VanVleet"],
  },
  {
    id: "h2h-lakers-rockets-2026-03-16",
    dateEt: "2026-03-16",
    dateJst: "2026-03-17",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 100,
    scoreRight: 92,
    homeTeamSide: "right",
    injuriesLeft: ["M. Kleber"],
    injuriesRight: [
      "S. Adams",
      "J. Davison",
      "J. Tate",
      "F. VanVleet",
    ],
  },
  {
    id: "h2h-lakers-rockets-2026-03-18",
    dateEt: "2026-03-18",
    dateJst: "2026-03-19",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 124,
    scoreRight: 116,
    homeTeamSide: "right",
    injuriesLeft: ["M. Kleber"],
    injuriesRight: [
      "S. Adams",
      "T. Newton",
      "J. Tate",
      "F. VanVleet",
    ],
  },
];

/** 左=LAL・右=HOU のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function lakersRocketsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  lakersPpg: number;
  rocketsPpg: number;
  lakersPapg: number;
  rocketsPapg: number;
  lakersNet: number;
  rocketsNet: number;
} {
  let lakersPts = 0;
  let rocketsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`lakersRocketsH2H: missing scores for ${g.id}`);
    }
    lakersPts += g.scoreLeft;
    rocketsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const lakersPpg = r1(lakersPts / n);
  const rocketsPpg = r1(rocketsPts / n);
  const lakersPapg = rocketsPpg;
  const rocketsPapg = lakersPpg;
  const rocketsNet = r1(rocketsPpg - rocketsPapg);
  const lakersNet = r1(lakersPpg - lakersPapg);
  return {
    lakersPpg,
    rocketsPpg,
    lakersPapg,
    rocketsPapg,
    lakersNet,
    rocketsNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function lakersRocketsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-lakers") || !ids.has("nba-rockets")) {
    return null;
  }

  const {
    lakersPpg,
    rocketsPpg,
    lakersPapg,
    rocketsPapg,
    lakersNet,
    rocketsNet,
  } = lakersRocketsH2HStatsFromGames(lakersRocketsH2HGames);

  if (homeTeamId === "nba-rockets") {
    return {
      homeAvgPts: rocketsPpg,
      awayAvgPts: lakersPpg,
      homeAvgPtsAllowed: rocketsPapg,
      awayAvgPtsAllowed: lakersPapg,
      homeNetRtg: rocketsNet,
      awayNetRtg: lakersNet,
    };
  }
  if (homeTeamId === "nba-lakers") {
    return {
      homeAvgPts: lakersPpg,
      awayAvgPts: rocketsPpg,
      homeAvgPtsAllowed: lakersPapg,
      awayAvgPtsAllowed: rocketsPapg,
      homeNetRtg: lakersNet,
      awayNetRtg: rocketsNet,
    };
  }
  return null;
}
