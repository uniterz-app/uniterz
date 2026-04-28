import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const THUNDER_SUNS_TEAM_IDS = ["nba-thunder", "nba-suns"] as const;

/** H2Hカードは左=Thunder、右=Suns で固定 */
const H2H_LEFT = "Thunder";
const H2H_RIGHT = "Suns";

/**
 * 2025-26 Thunder vs Suns（レギュラー5 + プレーオフ4）
 * 左列=Thunder得点、右列=Suns得点。
 */
export const thunderSunsH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-thunder-suns-2025-11-28",
    dateEt: "2025-11-28",
    dateJst: "2025-11-29",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 123,
    scoreRight: 119,
    homeTeamSide: "left",
    injuriesLeft: ["A. Wiggins"],
    injuriesRight: ["G. Allen", "R. Dunn", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2025-12-10",
    dateEt: "2025-12-10",
    dateJst: "2025-12-11",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 138,
    scoreRight: 89,
    homeTeamSide: "left",
    injuriesLeft: ["I. Hartenstein", "I. Joe"],
    injuriesRight: ["D. Booker", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-01-04",
    dateEt: "2026-01-04",
    dateJst: "2026-01-05",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 108,
    homeTeamSide: "right",
    injuriesLeft: ["I. Hartenstein", "Jay. Williams"],
    injuriesRight: ["J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-02-11",
    dateEt: "2026-02-11",
    dateJst: "2026-02-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 136,
    scoreRight: 109,
    homeTeamSide: "right",
    injuriesLeft: ["S. Gilgeous-Alexander", "A. Mitchell"],
    injuriesRight: ["G. Allen", "D. Booker", "J. Green"],
  },
  {
    id: "h2h-thunder-suns-2026-04-12",
    dateEt: "2026-04-12",
    dateJst: "2026-04-13",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 135,
    homeTeamSide: "left",
    injuriesLeft: [
      "A. Caruso",
      "S. Gilgeous-Alexander",
      "I. Hartenstein",
      "C. Holmgren",
      "I. Joe",
      "A. Mitchell",
      "C. Wallace",
      "J. Williams",
      "Jay. Williams",
    ],
    injuriesRight: ["G. Allen", "D. Booker", "D. Brooks", "R. O'Neale"],
  },
  {
    id: "h2h-thunder-suns-2026-04-19",
    dateEt: "2026-04-19",
    dateJst: "2026-04-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 119,
    scoreRight: 84,
    homeTeamSide: "left",
    injuriesLeft: ["T. Sorber"],
    injuriesRight: ["M. Williams"],
    inactiveFooterSummary: {
      ja:
        "OKCは連覇候補らしい入りで、守備圧とトランジションで一気に試合を壊した。\n" +
        "SGAが爆発的な当たり日ではなくても勝てたこと、Jalen WilliamsやChetまで含めて全体で押し切れたことが大きい。\n" +
        "OKCはPOで更にDFのギアを上げて、Phoenixが自分の形に持ち込む前に守備で分断した。",
      en:
        "OKC opened like a repeat-title contender, blowing the game open with defensive pressure and transition.\n" +
        "Winning without Shai Gilgeous-Alexander needing a nuclear scoring night mattered—and the Thunder rolled as a group, with Jalen Williams and Chet Holmgren among those powering the push.\n" +
        "In the playoffs they shifted defense up another gear, splintering Phoenix on that end before the Suns could settle into their game.",
    },
  },
  {
    id: "h2h-thunder-suns-2026-04-21",
    dateEt: "2026-04-21",
    dateJst: "2026-04-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 120,
    scoreRight: 107,
    homeTeamSide: "left",
    injuriesLeft: ["T. Sorber"],
    injuriesRight: ["J. Goodwin", "M. Williams"],
    inactiveFooterSummary: {
      ja:
        "SGAが37得点9アシスト、13/25FGでしっかり修正し、試合の中心を握った。Chet Holmgrenも19得点8リバウンド4ブロックで攻守両面に効き、Thunderはシリーズ2戦連続で内容の差を見せた。\n" +
        "PhoenixもGame 1よりは明確に対抗し、終盤には差を縮める場面もあった。ただそれでも、前半だけで11ターンオーバーを出し、OKCに走られる形を何度も作ってしまった。\n" +
        "この試合でOKCにとって唯一の不安材料は、J-dubが第3Qに左ハムストリングを痛めて退場したこと。エースと守備で押し返して2-0にした試合だった。",
      en:
        "Shai Gilgeous-Alexander responded with a controlled star performance—37 points and 9 assists on 13-of-25 shooting—to take command of the game. Chet Holmgren added 19 points, 8 rebounds, and 4 blocks, and Oklahoma City again showed a clear edge in overall execution.\n" +
        "Phoenix competed more cleanly than in Game 1 and even trimmed the margin late, but 11 first-half turnovers repeatedly fueled OKC transition chances.\n" +
        "The lone concern for the Thunder was J-Dub exiting in the third quarter with a left hamstring issue, but OKC still imposed its defense and top-end creation to move ahead 2-0.",
    },
  },
  {
    id: "h2h-thunder-suns-2026-04-26",
    dateEt: "2026-04-26",
    dateJst: "2026-04-27",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 121,
    scoreRight: 109,
    /** Phoenix（Suns）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["I. Joe", "T. Sorber", "Jay. Williams"],
    injuriesRight: ["J. Goodwin", "M. Williams"],
    inactiveFooterSummary: {
      ja:
        "OKCはShai Gilgeous-Alexanderが42得点8アシストで試合を支配。ターンオーバーを7本に抑え、終盤まで安定したオフェンスを継続した。\n" +
        "SunsはDillon Brooksが33得点、Jalen Greenも26得点で粘ったが、Devin Bookerが16得点に抑えられ、エース差がそのまま勝敗に出た。\n" +
        "OKCが3連勝でシリーズ突破に王手。",
      en:
        "Shai Gilgeous-Alexander dominated with 42 points and 8 assists; OKC held turnovers to seven and kept its offense steady deep into the game.\n" +
        "Phoenix got 33 from Dillon Brooks and 26 from Jalen Green, but Devin Booker was limited to 16 points—and the star gap showed on the scoreboard.\n" +
        "The Thunder’s third straight win put them on the brink of closing out the series.",
    },
  },
  {
    id: "h2h-thunder-suns-2026-04-28",
    dateEt: "2026-04-28",
    dateJst: "2026-04-29",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 131,
    scoreRight: 122,
    /** Oklahoma City（Thunder）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["Jay. Williams", "T. Sorber"],
    injuriesRight: ["M. Williams"],
    inactiveFooterSummary: {
      ja:
        "ThunderはShai Gilgeous-Alexanderが31点、Chet Holmgrenが24点。6人が二桁得点で、FG53%と高効率だった。SunsはBooker、Jalen Green、Dillon Brooks、Collin Gillespieが20点超えだったが、守備とリバウンドで耐えきれなかった。Bookerは前半2点から後半22点を返したが届かず。OKCが131-122で勝ち、4連勝でシリーズを突破。",
      en:
        "Shai Gilgeous-Alexander had 31 and Chet Holmgren 24; six Thunder players hit double figures on 53% shooting. Phoenix got 20+ from Devin Booker, Jalen Green, Dillon Brooks, and Collin Gillespie, but could not hold up on defense and the glass. Booker followed 2 first-half points with 22 in the second half, yet it wasn’t enough. OKC won 131-122, sweeping the series 4-0.",
    },
  },
];

function thunderSunsH2HStatsFromGames(games: NbaH2HGameCard[]): {
  thunderPpg: number;
  sunsPpg: number;
  thunderPapg: number;
  sunsPapg: number;
  thunderNet: number;
  sunsNet: number;
} {
  let thunderPts = 0;
  let sunsPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`thunderSunsH2H: missing scores for ${g.id}`);
    }
    thunderPts += g.scoreLeft;
    sunsPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const sunsPpg = r1(sunsPts / n);
  const thunderPpg = r1(thunderPts / n);
  const sunsPapg = thunderPpg;
  const thunderPapg = sunsPpg;
  const sunsNet = r1(sunsPpg - sunsPapg);
  const thunderNet = r1(thunderPpg - thunderPapg);
  return {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  };
}

export function thunderSunsH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-thunder") || !ids.has("nba-suns")) {
    return null;
  }

  const {
    thunderPpg,
    sunsPpg,
    thunderPapg,
    sunsPapg,
    thunderNet,
    sunsNet,
  } = thunderSunsH2HStatsFromGames(thunderSunsH2HGames);

  if (homeTeamId === "nba-suns") {
    return {
      homeAvgPts: sunsPpg,
      awayAvgPts: thunderPpg,
      homeAvgPtsAllowed: sunsPapg,
      awayAvgPtsAllowed: thunderPapg,
      homeNetRtg: sunsNet,
      awayNetRtg: thunderNet,
    };
  }
  if (homeTeamId === "nba-thunder") {
    return {
      homeAvgPts: thunderPpg,
      awayAvgPts: sunsPpg,
      homeAvgPtsAllowed: thunderPapg,
      awayAvgPtsAllowed: sunsPapg,
      homeNetRtg: thunderNet,
      awayNetRtg: sunsNet,
    };
  }
  return null;
}
