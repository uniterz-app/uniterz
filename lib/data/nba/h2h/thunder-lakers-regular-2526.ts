import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_LAKERS_TEAM_IDS = ["nba-thunder", "nba-lakers"] as const;

/** H2H カードは左=Thunder、右=Lakers で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Lakers";

/** 2025-26 Thunder vs Lakers（レギュラー3） */
export const thunderLakersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-thunder-lakers-2025-11-12",
    dateEt: "2025-11-12",
    dateJst: "2025-11-13",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 121,
    scoreRight: 92,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["L. Dort", "N. Topic", "A. Wiggins", "J. Williams", "Jay. Williams"],
    injuriesRight: ["L. James", "N. Smith Jr.", "G. Vincent"],
  },
  {
    id: "h2h-thunder-lakers-2026-04-02",
    dateEt: "2026-04-02",
    dateJst: "2026-04-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 139,
    scoreRight: 96,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["A. Caruso", "T. Sorber"],
    injuriesRight: ["M. Smart", "D. Knecht", "N. Smith Jr."],
  },
  {
    id: "h2h-thunder-lakers-2026-04-07",
    dateEt: "2026-04-07",
    dateJst: "2026-04-08",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 87,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["T. Sorber", "J. Williams"],
    injuriesRight: ["L. Doncic", "L. James", "A. Reaves", "M. Smart", "J. Hayes"],
  },
];

/** 左=OKC・右=LAL のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function thunderLakersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  thunderPpg: number;
  lakersPpg: number;
  thunderPapg: number;
  lakersPapg: number;
  thunderNet: number;
  lakersNet: number;
} {
  let thunderPts = 0;
  let lakersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`thunderLakersH2H: missing scores for ${g.id}`);
    }
    thunderPts += g.scoreLeft;
    lakersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const thunderPpg = r1(thunderPts / n);
  const lakersPpg = r1(lakersPts / n);
  const thunderPapg = lakersPpg;
  const lakersPapg = thunderPpg;
  const lakersNet = r1(lakersPpg - lakersPapg);
  const thunderNet = r1(thunderPpg - thunderPapg);
  return {
    thunderPpg,
    lakersPpg,
    thunderPapg,
    lakersPapg,
    thunderNet,
    lakersNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function thunderLakersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-thunder") || !ids.has("nba-lakers")) {
    return null;
  }

  const {
    thunderPpg,
    lakersPpg,
    thunderPapg,
    lakersPapg,
    thunderNet,
    lakersNet,
  } = thunderLakersH2HStatsFromGames(thunderLakersH2HGames);

  if (homeTeamId === "nba-thunder") {
    return {
      homeAvgPts: thunderPpg,
      awayAvgPts: lakersPpg,
      homeAvgPtsAllowed: thunderPapg,
      awayAvgPtsAllowed: lakersPapg,
      homeNetRtg: thunderNet,
      awayNetRtg: lakersNet,
    };
  }
  if (homeTeamId === "nba-lakers") {
    return {
      homeAvgPts: lakersPpg,
      awayAvgPts: thunderPpg,
      homeAvgPtsAllowed: lakersPapg,
      awayAvgPtsAllowed: thunderPapg,
      homeNetRtg: lakersNet,
      awayNetRtg: thunderNet,
    };
  }
  return null;
}
