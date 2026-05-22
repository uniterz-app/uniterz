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

/** 2025-26 Knicks vs Cavaliers（レギュラー3 + プレーオフ CF Game 2まで） */
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
  {
    id: "h2h-knicks-cavaliers-2026-05-19-po-g1",
    dateEt: "2026-05-19",
    dateJst: "2026-05-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 104,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    wentToOvertime: true,
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Cavsは4Q残り7:52で93-71、最大22点リード。しかしKnicksが終盤からOTにかけて44-11のラン。Jalen Brunsonが38点、終盤にHardenを狙う形で試合を壊した。Cavsは終盤12分45秒で11点、FG4本、ターンオーバー6。Landry Shametの同点3P、Mikal Bridgesのクラッチショットも大きかった。CavsはMitchell 29点、Harden 15点、Mobley 15点14R。シリーズはKnicksが1-0。",
      en:
        "Cleveland led 93-71 with 7:52 left in the fourth, up as many as 22, but New York closed regulation and overtime on a 44-11 run. Jalen Brunson scored 38 and targeted James Harden in the biggest moments down the stretch. The Cavaliers managed just 11 points on 4 field goals and 6 turnovers over the final 12:45. Landry Shamet’s tying three and Mikal Bridges’ clutch shot were pivotal. Cleveland got 29 from Donovan Mitchell, 15 from Harden, and 15 points and 14 rebounds from Evan Mobley. The Knicks lead the series 1-0 after a 115-104 overtime win.",
    },
  },
  {
    id: "h2h-knicks-cavaliers-2026-05-21-po-g2",
    dateEt: "2026-05-21",
    dateJst: "2026-05-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 93,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Cavsは1Q、Mobleyの入りが良く27-24でリード。ただその後アウトサイドが止まり、最終的に3Pは9/35。3QにKnicksが18-0ランを作って試合を決定づけた。Cavsは4Q序盤に7点差まで戻したが、FTミスと空いた3Pの失敗で追い切れず。KnicksはBrunsonが得点よりもゲームメイクに回り、Hartが5本の3Pで流れを作った。シリーズはNYK 2-0。",
      en:
        "Cleveland led 27-24 after the first quarter behind a strong start from Evan Mobley, but their perimeter offense stalled the rest of the way—they finished 9-for-35 from three. New York broke the game open with an 18-0 run in the third quarter. The Cavaliers trimmed the deficit to seven early in the fourth, but missed free throws and open threes prevented a full comeback. Jalen Brunson prioritized playmaking over scoring, while Josh Hart drilled five threes to swing momentum. The Knicks lead the series 2-0.",
    },
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
