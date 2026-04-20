import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const LAKERS_ROCKETS_TEAM_IDS = ["nba-lakers", "nba-rockets"] as const;

/** H2H カードは左=レイカーズ、右=ロケッツで固定 */
const H2H_LEFT = "Lakers";
const H2H_RIGHT = "Rockets";

/** 2025-26 ロケッツ対レイカーズ（レギュラー3 + プレーオフ1） */
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
  {
    id: "h2h-lakers-rockets-2026-04-18",
    dateEt: "2026-04-18",
    dateJst: "2026-04-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 98,
    homeTeamSide: "left",
    injuriesLeft: ["L. Doncic", "A. Reaves"],
    injuriesRight: ["S. Adams", "F. VanVleet"],
    inactiveFooterSummary: {
      ja:
        "レイカーズはルカ・リーブス不在でも勝ったのが大きい。\n" +
        "レイカーズが試合の入りから集中力を見せ、チーム全体で高いFG%をマークした。\n" +
        "ケナードが27得点、レブロンが19得点13アシストで勝利。\n" +
        "ロケッツはレイカーズのゾーンDFに対して解決の糸口を見つけられず、流れを一度も奪えないまま敗戦。",
      en:
        "A major statement win for the Lakers without Luka Dončić and Austin Reaves.\n" +
        "Los Angeles brought focus from the opening tip and posted a strong team field-goal percentage.\n" +
        "Luke Kennard scored 27; LeBron James added 19 points and 13 assists to close it out.\n" +
        "Houston never found answers against L.A.’s zone defense and couldn’t flip momentum once.",
    },
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

/** 上記4試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
