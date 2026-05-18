import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const KNICKS_CAVALIERS_TEAM_IDS = [
  "nba-knicks",
  "nba-cavaliers",
] as const;

/** H2H カードは左=Knicks、右=Cavaliers で固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "Cavaliers";

/** 2025-26 Knicks vs Cavaliers（レギュラー3試合・対戦成績 Knicks 2勝1敗） */
export const knicksCavaliersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-knicks-cavaliers-2025-10-22",
    dateEt: "2025-10-22",
    dateJst: "2025-10-23",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 119,
    scoreRight: 111,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["J. Hart", "M. Robinson"],
    injuriesRight: ["D. Garland", "M. Strus"],
  },
  {
    id: "h2h-knicks-cavaliers-2025-12-25",
    dateEt: "2025-12-25",
    dateJst: "2025-12-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 126,
    scoreRight: 124,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["L. Shamet", "M. McBride"],
    injuriesRight: ["M. Strus"],
  },
  {
    id: "h2h-knicks-cavaliers-2026-02-24",
    dateEt: "2026-02-24",
    dateJst: "2026-02-25",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 94,
    scoreRight: 109,
    /** Cleveland（Cavaliers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["M. McBride"],
    injuriesRight: ["M. Strus"],
  },
];

function knicksCavaliersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  knicksPpg: number;
  cavaliersPpg: number;
  knicksPapg: number;
  cavaliersPapg: number;
  knicksNet: number;
  cavaliersNet: number;
} {
  let knicksPts = 0;
  let cavaliersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`knicksCavaliersH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    cavaliersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const knicksPpg = r1(knicksPts / n);
  const cavaliersPpg = r1(cavaliersPts / n);
  const knicksPapg = cavaliersPpg;
  const cavaliersPapg = knicksPpg;
  const knicksNet = r1(knicksPpg - knicksPapg);
  const cavaliersNet = r1(cavaliersPpg - cavaliersPapg);
  return {
    knicksPpg,
    cavaliersPpg,
    knicksPapg,
    cavaliersPapg,
    knicksNet,
    cavaliersNet,
  };
}

export function knicksCavaliersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-knicks") || !ids.has("nba-cavaliers")) {
    return null;
  }

  const {
    knicksPpg,
    cavaliersPpg,
    knicksPapg,
    cavaliersPapg,
    knicksNet,
    cavaliersNet,
  } = knicksCavaliersH2HStatsFromGames(knicksCavaliersH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: cavaliersPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: cavaliersPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: cavaliersNet,
    };
  }
  if (homeTeamId === "nba-cavaliers") {
    return {
      homeAvgPts: cavaliersPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: cavaliersPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: cavaliersNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
