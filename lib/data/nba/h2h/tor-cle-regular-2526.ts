import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const TOR_CLE_TEAM_IDS = ["nba-raptors", "nba-cavaliers"] as const;

/** H2H カードは左=キャブス、右=ラプターズで固定 */
const H2H_LEFT = "Cavaliers";
const H2H_RIGHT = "Raptors";

/** 2025-26 ラプターズ対キャブス（レギュラー3 + プレーオフ1） */
export const torCleH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-tor-cle-2025-10-31",
    dateEt: "2025-10-31",
    dateJst: "2025-11-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 101,
    scoreRight: 112,
    homeTeamSide: "left",
    injuriesLeft: [
      "D. Mitchell",
      "J. Allen",
      "M. Strus",
      "D. Garland",
      "S. Merrill",
    ],
    injuriesRight: ["J. Poeltl"],
  },
  {
    id: "h2h-tor-cle-2025-11-13",
    dateEt: "2025-11-13",
    dateJst: "2025-11-14",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 113,
    scoreRight: 126,
    homeTeamSide: "left",
    injuriesLeft: ["L. Ball", "D. Garland", "M. Strus", "J. Tyson"],
    injuriesRight: ["O. Agbaji", "J. Mogbo"],
  },
  {
    id: "h2h-tor-cle-2025-11-24",
    dateEt: "2025-11-24",
    dateJst: "2025-11-25",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 99,
    scoreRight: 110,
    homeTeamSide: "right",
    injuriesLeft: [
      "J. Allen",
      "D. Garland",
      "D. Hunter",
      "S. Merrill",
      "C. Porter Jr.",
      "M. Strus",
      "D. Wade",
      "I. Okoro",
    ],
    injuriesRight: ["R. Barrett"],
  },
  {
    id: "h2h-tor-cle-2026-04-18",
    dateEt: "2026-04-18",
    dateJst: "2026-04-19",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 126,
    scoreRight: 113,
    homeTeamSide: "left",
    injuriesLeft: ["T. Bryant"],
    injuriesRight: ["I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "キャブスはレギュラーシーズンで3敗した相手だったが、堅実に Game 1 を勝利。\n" +
        "ミッチェルが32得点で主導し、内外どちらからも得点を積み上げ、クリーブランドはシリーズの入りをしっかり取った。\n" +
        "トロントは点は取れたものの、アイソレーション、P&R など守り切れず後手に回った。",
      en:
        "Cleveland had lost all three regular-season meetings to this opponent but took Game 1 with steady execution.\n" +
        "Donovan Mitchell led with 32 points, the Cavs scored inside and out, and they set a firm tone to open the series.\n" +
        "Toronto still scored, but trailed reacting to isolations, pick-and-rolls, and other actions they could not shut down.",
    },
  },
];

/** 左=CLE・右=TOR のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function torCleH2HStatsFromGames(games: NbaH2HGameCard[]): {
  cavsPpg: number;
  raptorsPpg: number;
  cavsPapg: number;
  raptorsPapg: number;
  cavsNet: number;
  raptorsNet: number;
} {
  let clePts = 0;
  let torPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`torCleH2H: missing scores for ${g.id}`);
    }
    clePts += g.scoreLeft;
    torPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const cavsPpg = r1(clePts / n);
  const raptorsPpg = r1(torPts / n);
  /** 相手が取った得点 = 自チームの失点 */
  const cavsPapg = raptorsPpg;
  const raptorsPapg = cavsPpg;
  const raptorsNet = r1(raptorsPpg - raptorsPapg);
  const cavsNet = r1(cavsPpg - cavsPapg);
  return {
    cavsPpg,
    raptorsPpg,
    cavsPapg,
    raptorsPapg,
    cavsNet,
    raptorsNet,
  };
}

/** 上記4試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function torCleH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (
    !ids.has("nba-raptors") ||
    !ids.has("nba-cavaliers")
  ) {
    return null;
  }

  const {
    cavsPpg,
    raptorsPpg,
    cavsPapg,
    raptorsPapg,
    cavsNet,
    raptorsNet,
  } = torCleH2HStatsFromGames(torCleH2HGames);

  if (homeTeamId === "nba-raptors") {
    return {
      homeAvgPts: raptorsPpg,
      awayAvgPts: cavsPpg,
      homeAvgPtsAllowed: raptorsPapg,
      awayAvgPtsAllowed: cavsPapg,
      homeNetRtg: raptorsNet,
      awayNetRtg: cavsNet,
    };
  }
  if (homeTeamId === "nba-cavaliers") {
    return {
      homeAvgPts: cavsPpg,
      awayAvgPts: raptorsPpg,
      homeAvgPtsAllowed: cavsPapg,
      awayAvgPtsAllowed: raptorsPapg,
      homeNetRtg: cavsNet,
      awayNetRtg: raptorsNet,
    };
  }
  return null;
}
