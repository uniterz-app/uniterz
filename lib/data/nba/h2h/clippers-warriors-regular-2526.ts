import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const CLIPPERS_WARRIORS_TEAM_IDS = [
  "nba-clippers",
  "nba-warriors",
] as const;

/** H2Hカードは左=Clippers、右=Warriors で固定 */
const H2H_LEFT = "Clippers";
const H2H_RIGHT = "Warriors";

/** 2025-26 レギュラー Clippers vs Warriors（4試合） */
export const clippersWarriorsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-clippers-warriors-2025-10-28",
    dateEt: "2025-10-28",
    dateJst: "2025-10-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 79,
    scoreRight: 98,
    homeTeamSide: "right",
    injuriesLeft: ["B. Beal", "J. Miller", "K. Sanders"],
    injuriesRight: ["D. Melton"],
  },
  {
    id: "h2h-clippers-warriors-2026-01-05",
    dateEt: "2026-01-05",
    dateJst: "2026-01-06",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 102,
    homeTeamSide: "left",
    injuriesLeft: [
      "B. Beal",
      "B. Bogdanovic",
      "J. Harden",
      "D. Jones Jr.",
      "C. Paul",
    ],
    injuriesRight: ["L. Cryer", "Se. Curry", "M. Leons"],
  },
  {
    id: "h2h-clippers-warriors-2026-03-02",
    dateEt: "2026-03-02",
    dateJst: "2026-03-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 101,
    homeTeamSide: "right",
    injuriesLeft: ["B. Beal", "J. Collins"],
    injuriesRight: [
      "J. Butler III",
      "Se. Curry",
      "S. Curry",
      "G. Payton II",
      "K. Porzingis",
      "W. Richard",
    ],
  },
  {
    id: "h2h-clippers-warriors-2026-04-12",
    dateEt: "2026-04-12",
    dateJst: "2026-04-13",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 110,
    homeTeamSide: "left",
    injuriesLeft: [
      "B. Beal",
      "I. Jackson",
      "K. Leonard",
      "Y. Niederhauser",
    ],
    injuriesRight: ["J. Butler III", "D. Green", "M. Moody", "Q. Post"],
  },
];

function clippersWarriorsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  clippersPpg: number;
  warriorsPpg: number;
  clippersPapg: number;
  warriorsPapg: number;
  clippersNet: number;
  warriorsNet: number;
} {
  let clippersPts = 0;
  let warriorsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`clippersWarriorsH2H: missing scores for ${g.id}`);
    }
    clippersPts += g.scoreLeft;
    warriorsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const clippersPpg = r1(clippersPts / n);
  const warriorsPpg = r1(warriorsPts / n);
  const clippersPapg = warriorsPpg;
  const warriorsPapg = clippersPpg;
  const warriorsNet = r1(warriorsPpg - warriorsPapg);
  const clippersNet = r1(clippersPpg - clippersPapg);
  return {
    clippersPpg,
    warriorsPpg,
    clippersPapg,
    warriorsPapg,
    clippersNet,
    warriorsNet,
  };
}

export function clippersWarriorsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-clippers") || !ids.has("nba-warriors")) {
    return null;
  }

  const {
    clippersPpg,
    warriorsPpg,
    clippersPapg,
    warriorsPapg,
    clippersNet,
    warriorsNet,
  } = clippersWarriorsH2HStatsFromGames(clippersWarriorsH2HGames);

  if (homeTeamId === "nba-warriors") {
    return {
      homeAvgPts: warriorsPpg,
      awayAvgPts: clippersPpg,
      homeAvgPtsAllowed: warriorsPapg,
      awayAvgPtsAllowed: clippersPapg,
      homeNetRtg: warriorsNet,
      awayNetRtg: clippersNet,
    };
  }
  if (homeTeamId === "nba-clippers") {
    return {
      homeAvgPts: clippersPpg,
      awayAvgPts: warriorsPpg,
      homeAvgPtsAllowed: clippersPapg,
      awayAvgPtsAllowed: warriorsPapg,
      homeNetRtg: clippersNet,
      awayNetRtg: warriorsNet,
    };
  }
  return null;
}
