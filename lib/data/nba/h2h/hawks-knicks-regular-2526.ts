import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const HAWKS_KNICKS_TEAM_IDS = ["nba-hawks", "nba-knicks"] as const;

/** H2H カードは左=ニックス、右=ホークスで固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "Hawks";

/** 2025-26 レギュラー・ニックス対ホークス（3試合） */
export const hawksKnicksH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-hawks-knicks-2025-12-27",
    dateEt: "2025-12-27",
    dateJst: "2025-12-28",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 128,
    scoreRight: 125,
    homeTeamSide: "right",
    injuriesLeft: ["J. Hart", "M. McBride", "L. Shamet"],
    injuriesRight: ["K. Porzingis"],
  },
  {
    id: "h2h-hawks-knicks-2026-01-02",
    dateEt: "2026-01-02",
    dateJst: "2026-01-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 99,
    scoreRight: 111,
    homeTeamSide: "left",
    injuriesLeft: [
      "J. Hart",
      "M. Robinson",
      "L. Shamet",
      "K. Towns",
    ],
    injuriesRight: ["T. Young"],
  },
  {
    id: "h2h-hawks-knicks-2026-04-06",
    dateEt: "2026-04-06",
    dateJst: "2026-04-07",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 105,
    homeTeamSide: "right",
    injuriesLeft: ["T. Jemison III"],
    injuriesRight: ["J. Landale"],
  },
];

/** 左=NYK・右=ATL のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function hawksKnicksH2HStatsFromGames(games: NbaH2HGameCard[]): {
  hawksPpg: number;
  knicksPpg: number;
  hawksPapg: number;
  knicksPapg: number;
  hawksNet: number;
  knicksNet: number;
} {
  let hawksPts = 0;
  let knicksPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`hawksKnicksH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    hawksPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const hawksPpg = r1(hawksPts / n);
  const knicksPpg = r1(knicksPts / n);
  const hawksPapg = knicksPpg;
  const knicksPapg = hawksPpg;
  const knicksNet = r1(knicksPpg - knicksPapg);
  const hawksNet = r1(hawksPpg - hawksPapg);
  return {
    hawksPpg,
    knicksPpg,
    hawksPapg,
    knicksPapg,
    hawksNet,
    knicksNet,
  };
}

/** 上記3試合からの H2H 平均（小数1桁）。 */
export function hawksKnicksH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-hawks") || !ids.has("nba-knicks")) {
    return null;
  }

  const {
    hawksPpg,
    knicksPpg,
    hawksPapg,
    knicksPapg,
    hawksNet,
    knicksNet,
  } = hawksKnicksH2HStatsFromGames(hawksKnicksH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: hawksPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: hawksPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: hawksNet,
    };
  }
  if (homeTeamId === "nba-hawks") {
    return {
      homeAvgPts: hawksPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: hawksPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: hawksNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
