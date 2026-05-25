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

/** 2025-26 Knicks vs Cavaliers（レギュラー3 + プレーオフ CF Game 3まで） */
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
        "Knicksが後半に突き放して2勝0敗。Josh Hartがプレーオフ自己最多26点、Brunsonは19点14アシストで得点よりもゲームメイクに回った。Knicksの先発5人で96点、3Pも12本。前半はCavsもついていったが、3Qの18-0ランで流れが決定的に変わった。CavsはMitchellが26点を取ったが、後半44点止まりで、オフェンスが単発になった。",
      en:
        "New York pulled away in the second half to take a 2-0 series lead. Josh Hart set a new playoff high with 26 points, while Jalen Brunson had 19 points and 14 assists, prioritizing playmaking over scoring. The Knicks’ starting five combined for 96 points and 12 threes. Cleveland hung in through the first half, but an 18-0 third-quarter run flipped the game for good. Donovan Mitchell scored 26 for the Cavaliers, but they managed just 44 second-half points as their offense turned into one-off possessions.",
    },
  },
  {
    id: "h2h-knicks-cavaliers-2026-05-23-po-g3",
    dateEt: "2026-05-23",
    dateJst: "2026-05-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 121,
    scoreRight: 108,
    /** Cleveland（Cavaliers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Knicksが敵地でも勝って3勝0敗。Brunsonが30点、Bridgesが22点、Anunobyが21点。Townsは13点8リバウンド7アシストで、得点だけでなくハブ役として効いた。CavsはMobleyが24点、Mitchellが23点、Hardenが19点だったが、3Pは12/41、FTも12/19で効率が悪かった。4QはLandry Shametの連続3PでKnicksが引き離し、Cavsは守備でも流れを止めきれなかった。",
      en:
        "New York won on the road to take a 3-0 series lead. Jalen Brunson scored 30, Mikal Bridges 22, and OG Anunoby 21. Karl-Anthony Towns added 13 points, 8 rebounds, and 7 assists as a hub, not just a scorer. Cleveland got 24 from Evan Mobley, 23 from Donovan Mitchell, and 19 from James Harden, but shot 12-for-41 from three and 12-for-19 at the line. Landry Shamet’s consecutive threes in the fourth quarter broke the game open, and the Cavaliers could not slow New York on either end.",
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
