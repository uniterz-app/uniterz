import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_LAKERS_TEAM_IDS = ["nba-thunder", "nba-lakers"] as const;

/** H2H カードは左=Thunder、右=Lakers で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Lakers";

/** 2025-26 Thunder vs Lakers（レギュラー4 + プレーオフ Game 4まで） */
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
  {
    id: "h2h-thunder-lakers-2026-05-07-po-g2",
    dateEt: "2026-05-07",
    dateJst: "2026-05-08",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 125,
    scoreRight: 107,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["J. Williams"],
    injuriesRight: ["L. Doncic", "J. Vanderbilt"],
    inactiveFooterSummary: {
      ja:
        "Lakersは2Qに35点を取り、前半を58-57でリード。Game1よりオフェンスは改善し、Austin Reavesが31得点、LeBronが23得点、八村が16得点。ただし後半にOKCの圧力に耐えられなかった。Lakersは19ターンオーバーから26失点。OKCは3Qに23-5のランで逆転し、そのまま試合を壊した。Chet HolmgrenとSGAが各22得点、ベンチ得点48、セカンドチャンス17点。Lakersは前半は戦えたが、後半のボール保持とリバウンドで差が出て0-2。",
      en:
        "Los Angeles scored 35 in the second quarter and led 58-57 at halftime—an improved offensive night after Game 1, with Austin Reaves scoring 31, LeBron James 23, and Rui Hachimura 16. But the Lakers could not withstand OKC’s pressure after the break, coughing up 19 turnovers for 26 Thunder points. Oklahoma City flipped the game with a 23-5 run in the third and never looked back. Chet Holmgren and Shai Gilgeous-Alexander each had 22, the Thunder bench scored 48, and OKC added 17 second-chance points. Los Angeles competed early, but ball security and rebounding swung the second half as OKC took a 2-0 series lead.",
    },
  },
  {
    id: "h2h-thunder-lakers-2026-05-09-po-g3",
    dateEt: "2026-05-09",
    dateJst: "2026-05-10",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 131,
    scoreRight: 108,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["J. Williams"],
    injuriesRight: ["L. Doncic"],
    inactiveFooterSummary: {
      ja:
        "前半はLakersが59-57でリード。Luka Doncic不在の中、八村塁が21点、LeBron JamesとAustin Reavesもプレーメイクで支え、前半までは十分に戦えていた。ただ後半はOKCの強度が一気に上回った。Thunderはトランジション、ペイントアタック、守備の圧力でLakersを崩し、Ajay Mitchellが24点・10アシスト、SGAも23点・9アシストで試合を支配した。Lakersは八村とLuke Kennardが得点したが、LeBronとReavesの効率が伸びず、後半の守備崩壊を止められなかった。OKCは3勝0敗でシリーズ突破に王手。",
      en:
        "Los Angeles led 59-57 at halftime without Luka Dončić—Rui Hachimura scored 21 while LeBron James and Austin Reaves kept the offense organized early. After the break, Oklahoma City’s intensity took over: transition attacks, paint pressure, and defensive heat broke the Lakers open. Ajay Mitchell posted 24 points and 10 assists, and Shai Gilgeous-Alexander added 23 points and 9 assists to steer the game. Hachimura and Luke Kennard chipped in scoring, but James and Reaves could not sustain efficiency as L.A.’s defense unraveled in the second half. OKC moved to a 3-0 series lead and earned match point.",
    },
  },
  {
    id: "h2h-thunder-lakers-2026-05-11-po-g4",
    dateEt: "2026-05-11",
    dateJst: "2026-05-12",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 110,
    /** Los Angeles（Lakers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["J. Williams"],
    injuriesRight: ["L. Doncic"],
    inactiveFooterSummary: {
      ja:
        "Oklahoma Cityが終盤の接戦を制し、Lakersを4勝0敗でスイープした。Shai Gilgeous-Alexanderは35得点でチームを牽引し、勝負どころのフリースローやアイソレーションで試合を締めた。Ajay Mitchellも28得点と大きく貢献し、Lakersの守備がSGAに寄った場面で得点源になった。LakersはLuka Dončićを欠く中、Austin Reavesが27得点、八村塁が25得点、LeBron Jamesが24得点・12リバウンドと粘った。第4QにはLakersが一時リードする場面もあったが、OKCは終盤の遂行力で上回った。Thunderはプレーオフ8連勝でカンファレンスファイナル進出。",
      en:
        "Oklahoma City closed a tight finish and swept the Lakers in four. Shai Gilgeous-Alexander led with 35 points, sealing the game at the line and in isolation in the biggest moments. Ajay Mitchell added 28 and punished moments when Los Angeles tilted its defense toward SGA. Without Luka Dončić, the Lakers got 27 from Austin Reaves, 25 from Rui Hachimura, and 24 points and 12 rebounds from LeBron James. Los Angeles even led briefly in the fourth, but OKC’s execution down the stretch won out. The Thunder are on an eight-game playoff winning streak and advance to the conference finals.",
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

/** 上記8試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
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
