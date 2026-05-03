import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const TOR_CLE_TEAM_IDS = ["nba-raptors", "nba-cavaliers"] as const;

/** H2H カードは左=キャブス、右=ラプターズで固定 */
const H2H_LEFT = "Cavaliers";
const H2H_RIGHT = "Raptors";

/** 2025-26 ラプターズ対キャブス（レギュラー3 + プレーオフ6） */
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
        "Cavsは「RSで3敗した相手に、POで先に主導権を取り返した」試合。\n" +
        "Mitchellの得点力に加えて、Strusのベンチ火力、さらにHardenとAllenを含めた攻撃の選択肢が多く、Torontoに守る的を絞らせなかったのが大きい。\n" +
        "単なる勝利というより「Cavsがこのカードの不安要素をひとまず消したGame 1」。",
      en:
        "For the Cavs, this was the game where they seized the early playoff edge against a team that had beaten them three times in the regular season.\n" +
        "Alongside Mitchell’s scoring, Strus’s bench punch and a deep set of options—including Allen—kept Toronto from locking onto a single defensive focus.\n" +
        "More than a simple win, it was a Game 1 that put the matchup’s biggest doubts to rest, at least for now.",
    },
  },
  {
    id: "h2h-tor-cle-2026-04-20",
    dateEt: "2026-04-20",
    dateJst: "2026-04-21",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 105,
    homeTeamSide: "right",
    injuriesLeft: ["T. Bryant"],
    injuriesRight: ["I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "Cavsは前半から主導権を握り、終盤にRaptorsが詰めても落とさなかった。ミッチェルが30得点で第4Qに9得点、ハーデンが28得点5スティール、モブリーも11/13で25得点と効率よく続いた。Raptorsはバーンズがプレーオフ自己最多26得点、バレットが22得点だったが、Cavsのボールプレッシャーと上位3枚の得点力を止め切れず、シリーズは2-0になった。",
      en:
        "Cleveland led from the first half and never let the game slip away even when Toronto made late pushes. Mitchell scored 30 with 9 in the fourth quarter, Harden had 28 points and 5 steals, and Mobley stayed efficient with 25 on 11-for-13 shooting. Barnes set a new playoff career high with 26 for the Raptors and Barrett added 22, but they could not contain the Cavs’ ball pressure or the scoring punch of their top three, and the series went to 2-0.",
    },
  },
  {
    id: "h2h-tor-cle-2026-04-23",
    dateEt: "2026-04-23",
    dateJst: "2026-04-24",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 104,
    scoreRight: 126,
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "RaptorsはScottie BarnesとRJ Barrettを軸に、まず2点中心のフィジカルな展開へ持ち込んだ。Barnesはミドル、ポスト、ドライブから崩し、Barrettもコンタクトを受けながらペイントへ入り続けた。さらにCollin Murray-Boylesもインサイドで効き、Cavaliersの守備を内側へ引き寄せた。\n" +
        "試合を決めたのは第4Qの外角。Raptorsは4Qに3Pを8/9で決め、Jamison Battleが4本、RJ Barrettが3本、Brandon Ingramが1本を沈めた。フィジカルな2点攻勢で守備を収縮させ、最後はBattleとBarrettの外角で突き放し、ホームで1勝を挙げた。",
      en:
        "Toronto leaned on Scottie Barnes and RJ Barrett to turn the game into a physical, paint-first fight. Barnes scored from the mid-range, post, and off drives; Barrett kept attacking the rim through contact. Collin Murray-Boyles also made an impact inside and helped pull Cleveland’s defense inward.\n" +
        "The Raptors broke it open from deep in the fourth quarter, shooting 8-for-9 from three—Jamison Battle made four, RJ Barrett three, and Brandon Ingram one. After shrinking the defense with their two-point pressure, Battle and Barrett from the perimeter put the game away as Toronto earned its first home win of the series, 126-104.",
    },
  },
  {
    id: "h2h-tor-cle-2026-04-27",
    dateEt: "2026-04-27",
    dateJst: "2026-04-28",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 89,
    scoreRight: 93,
    /** Cleveland（Cavaliers）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "Raptorsは3Pが4/30と極端に入らない中、守備とフリースローで勝ち切った。Scottie BarnesとBrandon Ingramが各23得点を挙げ、終盤の重要な場面でも得点源になった。\n" +
        "CavsはDonovan Mitchellが20得点、James Hardenが19得点を記録したが、Hardenの7ターンオーバーを含めて攻撃が重かった。\n" +
        "Torontoが泥臭いロースコア戦を制し、シリーズを2勝2敗に戻した。",
      en:
        "Toronto shot just 4-for-30 from three but still grinded out the win behind defense and free throws. Scottie Barnes and Brandon Ingram each scored 23 and delivered late.\n" +
        "Cleveland got 20 from Donovan Mitchell and 19 from James Harden, but the offense stalled—including seven turnovers from Harden.\n" +
        "The Raptors won a gritty, low-scoring fight to even the series at 2-2.",
    },
  },
  {
    id: "h2h-tor-cle-2026-05-02",
    dateEt: "2026-05-02",
    dateJst: "2026-05-03",
    seriesGameLabel: "Game 5",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 125,
    scoreRight: 120,
    /** Toronto（Raptors）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "Clevelandは何度も12点差を追う展開から後半に逆転。第3Q終盤からの27-8ランで流れを変え、Dennis Schroderが第4Qに11得点。James Hardenは23得点9リバウンド5アシスト、Evan Mobleyも23得点。TorontoはRJ Barrettが25得点、Ja’Kobe Walterが20得点を挙げたが届かなかった。シリーズはCleveland 3-2。",
      en:
        "Cleveland erased multiple 12-point deficits before taking control in the second half. A 27-8 run late in the third flipped momentum, and Dennis Schröder scored 11 in the fourth. James Harden finished with 23, 9, and 5; Evan Mobley also had 23. RJ Barrett scored 25 for Toronto and Ja’Kobe Walter 20, but it wasn’t enough. Cleveland leads the series 3-2.",
    },
  },
  {
    id: "h2h-tor-cle-2026-05-03",
    dateEt: "2026-05-03",
    dateJst: "2026-05-04",
    seriesGameLabel: "Game 6",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 110,
    scoreRight: 112,
    wentToOvertime: true,
    /** Cleveland（Cavaliers）ホーム */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["B. Ingram", "I. Quickley"],
    inactiveFooterSummary: {
      ja:
        "TorontoはScottie Barnesが25得点14アシストでゲームを作り、RJ BarrettとJa’Kobe Walterも24得点ずつ記録。最後は延長残り1.2秒でBarrettが決勝3Pを決めてGame 7に持ち込んだ。ClevelandはEvan Mobleyが26得点14リバウンド、Donovan Mitchellが24得点、James Hardenも16得点9リバウンド9アシストで粘り、第4Qで11点差を追いついて延長に持ち込んだが、最後の一押しが足りなかった。\n" +
        "シリーズは3勝3敗でGame 7へ。",
      en:
        "Scottie Barnes piloted the win with 25 points and 14 assists, while RJ Barrett and Ja’Kobe Walter each scored 24. With 1.2 seconds left in overtime, Barrett buried the game-winning three to force Game 7. Cleveland hung in behind 26 and 14 from Evan Mobley, 24 from Donovan Mitchell, and 16, 9 rebounds, and 9 assists from James Harden—the Cavs erased an 11-point fourth-quarter deficit to reach OT but could not land the final punch.\n" +
        "The series is tied 3-3 heading into Game 7.",
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

/** 上記9試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
