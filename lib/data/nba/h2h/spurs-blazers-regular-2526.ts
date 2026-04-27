import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_BLAZERS_TEAM_IDS = ["nba-spurs", "nba-blazers"] as const;

/** H2H カードは左=Spurs、右=Blazers で固定（プレーオフ試合カードの並びと一致） */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Blazers";

/** 2025-26 Spurs vs Trail Blazers（レギュラー3 + プレーオフ4） */
export const spursBlazersH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-blazers-2025-11-25",
    dateEt: "2025-11-25",
    dateJst: "2025-11-26",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 102,
    /** Portland（Blazers）ホーム — Spurs @ Trail Blazers */
    homeTeamSide: "right",
    injuriesLeft: ["V. Wembanyama", "S. Castle", "J. McLaughlin"],
    injuriesRight: ["J. Holiday", "D. Lillard", "M. Thybulle"],
  },
  {
    id: "h2h-spurs-blazers-2026-01-02",
    dateEt: "2026-01-02",
    dateJst: "2026-01-03",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 110,
    scoreRight: 115,
    /** San Antonio（Spurs）ホーム — Trail Blazers @ Spurs */
    homeTeamSide: "left",
    injuriesLeft: ["V. Wembanyama", "D. Vassell"],
    injuriesRight: [
      "J. Grant",
      "R. Williams III",
      "M. Thybulle",
      "B. Wesley",
      "D. Reath",
    ],
  },
  {
    id: "h2h-spurs-blazers-2026-04-07",
    dateEt: "2026-04-07",
    dateJst: "2026-04-08",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 101,
    /** San Antonio（Spurs）ホーム — Trail Blazers @ Spurs */
    homeTeamSide: "left",
    injuriesLeft: [
      "V. Wembanyama",
      "S. Castle",
      "K. Olynyk",
      "B. Biyombo",
      "M. Plumlee",
    ],
    injuriesRight: ["V. Krejci", "S. Sharpe", "D. Lillard"],
  },
  {
    id: "h2h-spurs-blazers-2026-04-19",
    dateEt: "2026-04-19",
    dateJst: "2026-04-20",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 98,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: ["D. Lillard"],
    inactiveFooterSummary: {
      ja:
        "Wembanyamaのプレーオフ初戦として強烈で、Game 1の最大テーマはそこだった。\n" +
        "記録級のデビューに加えて、Fox、Castle、Vassellまで噛み合い、San Antonioは若いコアがそのままシリーズの武器になる形を見せた。\n" +
        "BlazersもAvdija中心にしっかり対抗できる場面はあり、完全に力負けした初戦ではない。\n" +
        "最終的には、Spursが若い主力をまとめて機能させたのが大きかった。",
      en:
        "Victor Wembanyama’s playoff opener was the headliner—arguably the biggest story of Game 1.\n" +
        "Beyond a record-setting debut, Fox, Stephon Castle, and Devin Vassell all clicked, showing San Antonio’s young core can be the series’ engine.\n" +
        "Portland, led by Deni Avdija, had stretches where it answered back; this wasn’t a pure blowout where the Blazers looked overmatched from the jump.\n" +
        "In the end, the Spurs getting their young pillars to fire together made the difference.",
    },
  },
  {
    id: "h2h-spurs-blazers-2026-04-21",
    dateEt: "2026-04-21",
    dateJst: "2026-04-22",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 106,
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "試合の大きな転換点はWembanyamaの負傷退場だった。第2Qに転倒して脳震とうプロトコル入りとなり、その後Spursは14点リードを作りながら終盤を締め切れなかった。\n" +
        "ただ、Blazersは相手のアクシデント待ちで拾っただけではなく、Scoot Hendersonの31得点を軸に最後まで粘って奪った1勝だった。\n" +
        "終盤はHoliday、Robert Williams III、Camaraらも要所で絡み、San Antonioの失速を見逃さずホームコートを奪い返した。Portland目線では、Game 1よりかなり競争力を示した内容だった。",
      en:
        "The major turning point was Wembanyama leaving injured. He fell in the second quarter and entered concussion protocol, and the Spurs could not close despite building a 14-point lead.\n" +
        "Still, Portland did more than just benefit from the incident; it earned the win behind Scoot Henderson’s 31 points and a resilient finish.\n" +
        "Holiday, Robert Williams III, and Camara all delivered key late sequences, and the Blazers capitalized on San Antonio’s fade to steal home-court advantage. From Portland’s perspective, this was a much more competitive performance than Game 1.",
    },
  },
  {
    id: "h2h-spurs-blazers-2026-04-24",
    dateEt: "2026-04-24",
    dateJst: "2026-04-25",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 120,
    scoreRight: 108,
    /** Portland（Blazers）ホーム — Spurs @ Trail Blazers */
    homeTeamSide: "right",
    injuriesLeft: ["V. Wembanyama", "J. McLaughlin"],
    injuriesRight: ["D. Lillard"],
    inactiveFooterSummary: {
      ja:
        "Blazersは前半65点でリードし、3Qには82-67まで広げたが、そこからSpursが一気に反撃。\n" +
        "SpursはWembanyama不在でもCastleとHarperが得点源になり、3Q終盤から流れを完全に奪った。\n" +
        "Portlandは後半43点だけに失速し、特に4Qは21点で止まった。Spursは若手2人の爆発で逆転勝ちし、敵地でシリーズ主導権を取り返した。",
      en:
        "Portland led with 65 first-half points and pushed the margin to 82-67 in the third, but San Antonio flipped the game from there.\n" +
        "Even without Wembanyama, the Spurs found their offense through Castle and Harper, fully seizing momentum late in the third quarter.\n" +
        "The Blazers cooled off to just 43 points in the second half, including only 21 in the fourth. San Antonio’s two-young-guard surge powered a comeback road win and swung control of the series back.",
    },
  },
  {
    id: "h2h-spurs-blazers-2026-04-26",
    dateEt: "2026-04-26",
    dateJst: "2026-04-27",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 93,
    /** Portland（Blazers）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["D. Lillard"],
    inactiveFooterSummary: {
      ja:
        "Spursは前半に17点差を背負ったが、後半を74-35で圧倒して逆転勝利。Victor Wembanyamaが27得点12リバウンド7ブロックで攻守に存在感を示し、De'Aaron Foxも28得点7アシストで試合を動かした。\n" +
        "BlazersはDeni Avdijaが26得点、Jrue Holidayが20得点を挙げたが、後半に完全に失速。\n" +
        "Spursがシリーズ3勝1敗と優位に立った。",
      en:
        "San Antonio trailed by 17 in the first half but flipped the game with a 74-35 second half. Victor Wembanyama anchored both ends with 27 points, 12 rebounds, and 7 blocks; De'Aaron Fox added 28 points and 7 assists to steer the win.\n" +
        "Portland got 26 from Deni Avdija and 20 from Jrue Holiday but faded completely after halftime.\n" +
        "The Spurs seized a commanding 3-1 series edge.",
    },
  },
];

/** 左=SAS・右=POR のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursBlazersH2HStatsFromGames(games: NbaH2HGameCard[]): {
  spursPpg: number;
  blazersPpg: number;
  spursPapg: number;
  blazersPapg: number;
  spursNet: number;
  blazersNet: number;
} {
  let spursPts = 0;
  let blazersPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursBlazersH2H: missing scores for ${g.id}`);
    }
    spursPts += g.scoreLeft;
    blazersPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const spursPpg = r1(spursPts / n);
  const blazersPpg = r1(blazersPts / n);
  const spursPapg = blazersPpg;
  const blazersPapg = spursPpg;
  const blazersNet = r1(blazersPpg - blazersPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    spursPpg,
    blazersPpg,
    spursPapg,
    blazersPapg,
    spursNet,
    blazersNet,
  };
}

/** 上記7試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursBlazersH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-spurs") || !ids.has("nba-blazers")) {
    return null;
  }

  const {
    spursPpg,
    blazersPpg,
    spursPapg,
    blazersPapg,
    spursNet,
    blazersNet,
  } = spursBlazersH2HStatsFromGames(spursBlazersH2HGames);

  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: blazersPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: blazersPapg,
      homeNetRtg: spursNet,
      awayNetRtg: blazersNet,
    };
  }
  if (homeTeamId === "nba-blazers") {
    return {
      homeAvgPts: blazersPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: blazersPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: blazersNet,
      awayNetRtg: spursNet,
    };
  }
  return null;
}
