import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_KNICKS_TEAM_IDS = ["nba-spurs", "nba-knicks"] as const;

/** H2H カードは左=Knicks、右=Spurs で固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "Spurs";

/** 2025-26 Knicks vs Spurs（NBA Cup含むRS 3試合） */
export const spursKnicksH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-knicks-2025-12-16-nba-cup-final",
    dateEt: "2025-12-16",
    dateJst: "2025-12-17",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 124,
    scoreRight: 113,
    homeTeamSide: "left",
    injuriesLeft: ["L. Shamet", "M. McBride"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-knicks-2025-12-31",
    dateEt: "2025-12-31",
    dateJst: "2026-01-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 132,
    scoreRight: 134,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["J. Hart", "M. Robinson", "L. Shamet"],
    injuriesRight: ["D. Vassell"],
  },
  {
    id: "h2h-spurs-knicks-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 89,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["M. McBride"],
    injuriesRight: ["M. Plumlee"],
    inactiveFooterSummary: {
      ja:
        "このカードのH2Hは、NBA CupをRSとして含めた集計でKnicksが2勝1敗。",
      en:
        "For this matchup, the Knicks lead the H2H 2-1 with the NBA Cup game counted as part of regular-season tracking.",
    },
  },
];

/** 左=NYK・右=SAS のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursKnicksH2HStatsFromGames(games: NbaH2HGameCard[]): {
  knicksPpg: number;
  spursPpg: number;
  knicksPapg: number;
  spursPapg: number;
  knicksNet: number;
  spursNet: number;
} {
  let knicksPts = 0;
  let spursPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursKnicksH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    spursPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const knicksPpg = r1(knicksPts / n);
  const spursPpg = r1(spursPts / n);
  const knicksPapg = spursPpg;
  const spursPapg = knicksPpg;
  const knicksNet = r1(knicksPpg - knicksPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    knicksPpg,
    spursPpg,
    knicksPapg,
    spursPapg,
    knicksNet,
    spursNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursKnicksH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-knicks") || !ids.has("nba-spurs")) {
    return null;
  }

  const {
    knicksPpg,
    spursPpg,
    knicksPapg,
    spursPapg,
    knicksNet,
    spursNet,
  } = spursKnicksH2HStatsFromGames(spursKnicksH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: spursNet,
    };
  }
  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: spursNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
