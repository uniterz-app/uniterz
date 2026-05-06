import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_LAKERS_TEAM_IDS = ["nba-thunder", "nba-lakers"] as const;

/** H2H カードは左=Thunder、右=Lakers で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Lakers";

/** 2025-26 Thunder vs Lakers（レギュラー4 + プレーオフ Game 1） */
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
    injuriesLeft: [
      "J. Williams",
      "L. Dort",
      "A. Wiggins",
      "K. Williams",
      "N. Topic",
      "T. Sorber",
    ],
    injuriesRight: ["L. James"],
  },
  {
    id: "h2h-thunder-lakers-2026-02-09",
    dateEt: "2026-02-09",
    dateJst: "2026-02-10",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 119,
    scoreRight: 110,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [
      "S. Gilgeous-Alexander",
      "A. Mitchell",
      "N. Topic",
      "T. Sorber",
    ],
    injuriesRight: ["L. Doncic", "A. Thiero"],
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
    injuriesLeft: [],
    injuriesRight: ["L. Doncic"],
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
    injuriesLeft: ["S. Gilgeous-Alexander"],
    injuriesRight: [
      "L. Doncic",
      "L. James",
      "A. Reaves",
      "M. Smart",
      "J. Hayes",
    ],
  },
  {
    id: "h2h-thunder-lakers-2026-05-05-po-g1",
    dateEt: "2026-05-05",
    dateJst: "2026-05-06",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 108,
    scoreRight: 90,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["L. Doncic"],
    inactiveFooterSummary: {
      ja:
        "OKCは前半から大きくは離せなかったが、3Q終盤から4Qで一気に差を広げた。Chet Holmgrenが24得点12リバウンド、Shai Gilgeous-AlexanderとAjay Mitchellが18得点ずつ。ベンチ得点でも34-15と上回り、終盤の加速でLakersを振り切った。LakersはLeBron Jamesが27得点で粘ったが、Austin Reavesが不調で、チーム全体でも攻撃が重かった。4QにJared McCainの連続3Pで流れを持っていかれ、そのまま戻せなかった。Lakersのプレーオフ得点としてはかなり低い水準で、Jarred Vanderbiltの負傷退場も痛かった。シリーズはOklahoma Cityが1-0。",
      en:
        "OKC could not pull away early but stretched the lead late in the third and through the fourth. Chet Holmgren finished with 24 points and 12 rebounds, while Shai Gilgeous-Alexander and Ajay Mitchell each scored 18. The Thunder won the bench scoring battle 34-15 and used a late surge to separate from the Lakers. LeBron James paced Los Angeles with 27 points, but Austin Reaves struggled and the offense looked heavy. A run of Jared McCain threes in the fourth swung momentum for good. It was a low offensive night by Lakers playoff standards, and losing Jarred Vanderbilt to injury hurt as well. Oklahoma City leads the series 1-0.",
    },
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

/** 上記5試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
