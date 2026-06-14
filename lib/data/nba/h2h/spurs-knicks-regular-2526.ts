import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_KNICKS_TEAM_IDS = ["nba-spurs", "nba-knicks"] as const;

/** H2H カードは左=Knicks、右=Spurs で固定 */
const H2H_LEFT = "Knicks";
const H2H_RIGHT = "Spurs";

/** 2025-26 Knicks vs Spurs（NBA Cup含むRS 3試合 + ファイナル Game 1–4） */
export const spursKnicksH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-knicks-2025-12-16-nba-cup-final",
    dateEt: "2025-12-16",
    dateJst: "2025-12-17",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 124,
    scoreRight: 113,
    homeTeamSide: "left",
    injuriesLeft: ["L. Shamet", "M. McBride"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-knicks-2025-12-31",
    dateEt: "2025-12-31",
    dateJst: "2026-01-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 132,
    scoreRight: 134,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["J. Hart", "M. Robinson", "L. Shamet"],
    injuriesRight: ["D. Vassell"],
  },
  {
    id: "h2h-spurs-knicks-2026-03-01",
    dateEt: "2026-03-01",
    dateJst: "2026-03-02",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 114,
    scoreRight: 89,
    /** New York（Knicks）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["M. McBride"],
    injuriesRight: ["M. Plumlee"],
    inactiveFooterSummary: {
      ja:
        "このカードのH2Hは、NBA CupをRSとして含めた集計でKnicksが2勝1敗。",
      en:
        "For this matchup, the Knicks lead the H2H 2-1 with the NBA Cup game counted as part of regular-season tracking.",
    },
  },
  {
    id: "h2h-spurs-knicks-2026-06-03-po-g1",
    dateEt: "2026-06-03",
    dateJst: "2026-06-04",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 95,
    /** San Antonio（Spurs）ホーム — Frost Bank Center */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Game 1はスパーズのホームであるサンアントニオのFrost Bank Centerで行われ、ニックスが105-95で勝利した。\n" +
        "前半はスパーズペース。フォックスやキャッスルのドライブ、ウェンビーのロールでニックスのウィークサイドを動かし、空いたコーナー3を決めてリードを作った。\n" +
        "3Q前半には、ウェンビーをインサイドに残す守備が機能し、スパーズが最大14点リード。ただその後、ニックスはKATを起点にミスマッチを突き、点差を一気に縮めた。\n" +
        "4Qはブランソンが試合を締めた。効率は高くなかったが、終盤に連続得点を決め、ニックスが最後を11-0のランで締めて逆転勝利。ニックスがGame 1を勝ち取り、シリーズは1-0。",
      en:
        "Game 1 was played at Frost Bank Center in San Antonio, and the Knicks won 105-95.\n" +
        "The first half went San Antonio's way. Drives from De'Aaron Fox and Stephon Castle and actions from Victor Wembanyama moved New York's weak-side defense, and the Spurs hit open corner threes to build a lead.\n" +
        "Early in the third quarter, a defensive scheme that kept Wembanyama inside worked, and San Antonio opened a lead as large as 14. But New York then attacked mismatches through Karl-Anthony Towns and cut the margin in a hurry.\n" +
        "The fourth quarter belonged to Jalen Brunson. His efficiency was not great, but he scored in bursts late, and the Knicks closed the game on an 11-0 run to complete the comeback. New York takes Game 1 and leads the series 1-0.",
    },
  },
  {
    id: "h2h-spurs-knicks-2026-06-05-po-g2",
    dateEt: "2026-06-05",
    dateJst: "2026-06-06",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 105,
    scoreRight: 104,
    /** San Antonio（Spurs）ホーム — Frost Bank Center */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Game 2は、Knicksが1点差の接戦を制してシリーズを2勝0敗とした試合。Spursは第4Qに入ってから流れをつかみ、一時は逆転が見えるところまで追い上げたが、最後の勝負どころで決め切れなかった。Wembanyamaは得点とリバウンドの両面で存在感を見せ、Spursの反撃の中心になった。一方でKnicksは、Brunsonが終盤のクラッチタイムで落ち着いて試合をまとめ、リードを守り切った。Spursにとっては内容自体は悪くなかったが、終盤のターンオーバーと最後の1本を仕留められなかったことが響いた。Knicksは接戦をものにし、シリーズの主導権を大きく握った。",
      en:
        "Game 2 was a one-point Knicks win that pushed New York to a 2-0 series lead. San Antonio seized momentum after the third quarter and climbed back to the brink of a comeback, but could not finish in the biggest moments. Victor Wembanyama was the center of the Spurs' push on both ends, scoring and rebounding with authority. On the other side, Jalen Brunson stayed composed in crunch time and closed out the game to protect the lead. San Antonio played well enough to win, but late turnovers and one final stop they could not get made the difference. New York took the tight game and tightened its grip on the series.",
    },
  },
  {
    id: "h2h-spurs-knicks-2026-06-08-po-g3",
    dateEt: "2026-06-08",
    dateJst: "2026-06-09",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 111,
    scoreRight: 115,
    /** New York（Knicks）ホーム — Madison Square Garden */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Game 3は、Spursが敵地で取り返してシリーズを2勝1敗に戻した試合。Wembanyamaが32得点を挙げ、攻守両面で存在感を発揮した。さらにCastleも重要な得点源として機能し、Spursはオフェンスの選択肢を増やすことに成功した。前半はKnicksもBrunsonを中心に粘ったが、Spursは後半に入ってから攻撃の精度を高め、第3Qで流れを引き寄せた。その後もサイズと勢いを活かして主導権を維持し、終盤のKnicksの反撃を振り切った。Knicksにとってはホームで落とした痛い1敗だったが、Spursにとってはシリーズを終わらせない大きな勝利となった。",
      en:
        "Game 3 was San Antonio's road win that cut the series deficit to 2-1. Victor Wembanyama scored 32 and made his presence felt on both ends. Stephon Castle also emerged as a key scoring option, giving the Spurs more ways to attack. New York hung in through the first half behind Jalen Brunson, but San Antonio sharpened its offense after the break and swung the game in the third quarter. The Spurs then used their size and momentum to stay in control and hold off New York's late push. A painful home loss for the Knicks, but a critical win for San Antonio to keep the series alive.",
    },
  },
  {
    id: "h2h-spurs-knicks-2026-06-10-po-g4",
    dateEt: "2026-06-10",
    dateJst: "2026-06-11",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 107,
    scoreRight: 106,
    /** New York（Knicks）ホーム — Madison Square Garden */
    homeTeamSide: "left",
    injuriesLeft: [],
    injuriesRight: [],
    inactiveFooterSummary: {
      ja:
        "Game 4は、Knicksが29点差をひっくり返す歴史的な逆転勝利を収め、シリーズを3勝1敗とした試合。Spursは前半だけで14本の3ポイントを沈め、76-49で折り返す完璧に近い内容だった。しかし後半に入ると流れが一変し、Knicksが守備の強度を上げながら少しずつ点差を詰めていった。Brunsonが得点面でチームを引っ張り、OG Anunobyも攻守で大きな存在感を見せた。Spursは前半の勢いを維持できず、終盤は1ポゼッションごとの勝負に持ち込まれた。最後はOGのチップインでKnicksが逆転し、勝てたはずの試合をSpursが落とす形になった。シリーズ全体の流れを大きく変える、Knicksにとって非常に大きな勝利だった。",
      en:
        "Game 4 was a historic Knicks comeback from a 29-point deficit that put New York up 3-1 in the series. San Antonio hit 14 threes in the first half alone and took a 76-49 lead into the break in near-perfect fashion. But the game flipped after halftime as New York raised its defensive intensity and chipped away at the margin. Jalen Brunson led the scoring charge, and OG Anunoby made a major two-way impact. The Spurs could not sustain their first-half surge, and the fourth quarter became a possession-by-possession fight. OG's putback gave the Knicks the lead for good, and San Antonio let a winnable game slip away. A massive victory for New York that shifted the entire feel of the series.",
    },
  },
];

/** 左=NYK・右=SAS のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursKnicksH2HStatsFromGames(games: NbaH2HGameCard[]): {
  knicksPpg: number;
  spursPpg: number;
  knicksPapg: number;
  spursPapg: number;
  knicksNet: number;
  spursNet: number;
} {
  let knicksPts = 0;
  let spursPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursKnicksH2H: missing scores for ${g.id}`);
    }
    knicksPts += g.scoreLeft;
    spursPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const knicksPpg = r1(knicksPts / n);
  const spursPpg = r1(spursPts / n);
  const knicksPapg = spursPpg;
  const spursPapg = knicksPpg;
  const knicksNet = r1(knicksPpg - knicksPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    knicksPpg,
    spursPpg,
    knicksPapg,
    spursPapg,
    knicksNet,
    spursNet,
  };
}

/** 上記7試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursKnicksH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-knicks") || !ids.has("nba-spurs")) {
    return null;
  }

  const {
    knicksPpg,
    spursPpg,
    knicksPapg,
    spursPapg,
    knicksNet,
    spursNet,
  } = spursKnicksH2HStatsFromGames(spursKnicksH2HGames);

  if (homeTeamId === "nba-knicks") {
    return {
      homeAvgPts: knicksPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: knicksPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: knicksNet,
      awayNetRtg: spursNet,
    };
  }
  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: knicksPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: knicksPapg,
      homeNetRtg: spursNet,
      awayNetRtg: knicksNet,
    };
  }
  return null;
}
