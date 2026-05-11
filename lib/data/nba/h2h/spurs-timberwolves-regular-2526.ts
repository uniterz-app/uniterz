import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";

export const SPURS_TIMBERWOLVES_TEAM_IDS = [
  "nba-spurs",
  "nba-timberwolves",
] as const;

/** H2H カードは左=Spurs、右=Timberwolves で固定 */
const H2H_LEFT = "Spurs";
const H2H_RIGHT = "Timberwolves";

/** 2025-26 Spurs vs Timberwolves（レギュラー3 + プレーオフ Game 4まで） */
export const spursTimberwolvesH2HGames: NbaH2HGameCard[] = [
  {
    id: "h2h-spurs-wolves-2025-11-30",
    dateEt: "2025-11-30",
    dateJst: "2025-12-01",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 112,
    scoreRight: 125,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["S. Castle", "J. McLaughlin", "V. Wembanyama"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-wolves-2026-01-11",
    dateEt: "2026-01-11",
    dateJst: "2026-01-12",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 103,
    scoreRight: 104,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["D. Vassell"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-wolves-2026-01-17",
    dateEt: "2026-01-17",
    dateJst: "2026-01-18",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 126,
    scoreRight: 123,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["D. Vassell"],
    injuriesRight: [],
  },
  {
    id: "h2h-spurs-wolves-2026-05-05-po-g1",
    dateEt: "2026-05-05",
    dateJst: "2026-05-06",
    seriesGameLabel: "Game 1",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 102,
    scoreRight: 104,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["D. DiVincenzo", "A. Dosunmu"],
    inactiveFooterSummary: {
      ja:
        "Minnesotaは接戦を終盤でひっくり返した。Julius Randleが21得点、Jaden McDanielsとTerrence Shannon Jr.が各16得点。Anthony Edwardsは負傷から復帰しベンチから18得点を挙げ、終盤の7-0ランで流れを引き寄せた。San AntonioはVictor Wembanyamaが11得点15リバウンド12ブロックのトリプルダブル級、Dylan Harperが18得点、Stephon CastleとJulian Champagnieが各17得点だったが、最後のChampagnieのブザービーター3Pが外れて敗れた。シリーズはMinnesotaが1-0。",
      en:
        "Minnesota flipped a tight game late. Julius Randle scored 21, while Jaden McDaniels and Terrence Shannon Jr. each had 16. Anthony Edwards returned from injury and scored 18 off the bench, helping fuel a late 7-0 run. San Antonio got a triple-double-level night from Victor Wembanyama (11 points, 15 rebounds, 12 blocks), 18 from Dylan Harper, and 17 apiece from Stephon Castle and Julian Champagnie, but Julian Champagnie’s buzzer-beating three missed as Minnesota escaped. Minnesota leads the series 1-0.",
    },
  },
  {
    id: "h2h-spurs-wolves-2026-05-07-po-g2",
    dateEt: "2026-05-07",
    dateJst: "2026-05-08",
    seriesGameLabel: "Game 2",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 133,
    scoreRight: 95,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: [],
    injuriesRight: ["D. DiVincenzo"],
    inactiveFooterSummary: {
      ja:
        "SpursがGame1の敗戦から完全に修正して大勝。序盤からテンポと守備強度でWolvesを圧倒し、全スターターが二桁得点。Stephon Castleが19得点、Victor Wembanyamaも19得点を記録。WolvesはAnthony Edwardsがベンチ出場で12得点に留まり、Julius Randle、Jaden McDaniels、Terrence Shannon Jr.も各12得点止まり。Spursは3Qで一気に試合を壊し、シリーズを1-1に戻した。",
      en:
        "The Spurs made a full adjustment from Game 1 and rolled to a blowout win. They controlled pace and defensive intensity early, and all starters scored in double figures. Stephon Castle scored 19, and Victor Wembanyama added 19. For Minnesota, Anthony Edwards came off the bench and finished with 12, while Julius Randle, Jaden McDaniels, and Terrence Shannon Jr. also had 12 each. San Antonio broke the game open in the third quarter and tied the series 1-1.",
    },
  },
  {
    id: "h2h-spurs-wolves-2026-05-08-po-g3",
    dateEt: "2026-05-08",
    dateJst: "2026-05-09",
    seriesGameLabel: "Game 3",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 115,
    scoreRight: 108,
    /** Minnesota（Timberwolves）ホーム */
    homeTeamSide: "right",
    injuriesLeft: ["D. Jones"],
    injuriesRight: ["D. DiVincenzo"],
    inactiveFooterSummary: {
      ja:
        "SpursはVictor Wembanyamaが39得点15リバウンド5ブロックの支配的な内容。インサイドの高さ、リムプロテクト、終盤の決定力でWolvesを上回った。WolvesはAnthony Edwardsが復帰して粘ったが、Wembanyamaを止め切れず、勝負所でSpursに主導権を握られた。これでSpursが2-1とシリーズリード。",
      en:
        "Victor Wembanyama dominated with 39 points, 15 rebounds, and 5 blocks—San Antonio’s interior size, rim protection, and late-game finishing carried the night. Anthony Edwards returned and kept Minnesota competitive, but the Wolves could not slow Wembanyama in the biggest moments as the Spurs seized control down the stretch. San Antonio leads the series 2-1.",
    },
  },
  {
    id: "h2h-spurs-wolves-2026-05-11-po-g4",
    dateEt: "2026-05-11",
    dateJst: "2026-05-12",
    seriesGameLabel: "Game 4",
    leftTeamDisplay: H2H_LEFT,
    rightTeamDisplay: H2H_RIGHT,
    scoreLeft: 109,
    scoreRight: 114,
    /** San Antonio（Spurs）ホーム */
    homeTeamSide: "left",
    injuriesLeft: ["D. Jones"],
    injuriesRight: ["D. DiVincenzo"],
    inactiveFooterSummary: {
      ja:
        "最大の分岐点はWembanyamaの2Q退場。Spursは守備の中心を失ったが、HarperとFoxが各24点、Castleも20点で粘り、終盤まで接戦に持ち込んだ。最後に試合を決めたのはAnthony Edwards。36点中16点を4Qに集中させ、勝負どころで連続得点。GobertとNaz Reidもインサイドで支えた。Wolvesが苦しみながらも勝ち切り、シリーズを2-2に戻した。",
      en:
        "The turning point was Wembanyama's ejection in the second quarter. Without their defensive anchor, the Spurs still fought—Harper and Fox scored 24 each, and Castle added 20 to keep it close down the stretch. But Anthony Edwards took over when it mattered most, pouring in 16 of his 36 points in the fourth quarter with clutch buckets in crunch time. Gobert and Naz Reid provided interior support. Minnesota gutted out a tough road win to even the series at 2-2.",
    },
  },
];

/** 左=SAS・右=MIN のスコアから H2H の PPG / PAPG（小数1桁）を算出 */
function spursTimberwolvesH2HStatsFromGames(games: NbaH2HGameCard[]): {
  spursPpg: number;
  wolvesPpg: number;
  spursPapg: number;
  wolvesPapg: number;
  spursNet: number;
  wolvesNet: number;
} {
  let spursPts = 0;
  let wolvesPts = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) {
      throw new Error(`spursTimberwolvesH2H: missing scores for ${g.id}`);
    }
    spursPts += g.scoreLeft;
    wolvesPts += g.scoreRight;
  }
  const n = games.length;
  const r1 = (x: number) => Number(x.toFixed(1));
  const spursPpg = r1(spursPts / n);
  const wolvesPpg = r1(wolvesPts / n);
  const spursPapg = wolvesPpg;
  const wolvesPapg = spursPpg;
  const wolvesNet = r1(wolvesPpg - wolvesPapg);
  const spursNet = r1(spursPpg - spursPapg);
  return {
    spursPpg,
    wolvesPpg,
    spursPapg,
    wolvesPapg,
    spursNet,
    wolvesNet,
  };
}

/** 上記7試合からの H2H 平均（小数1桁）。パネル左=ホーム、右=アウェイ。 */
export function spursTimberwolvesH2HAveragesForSides({
  homeTeamId,
  awayTeamId,
}: {
  homeTeamId: string;
  awayTeamId: string;
}): NbaH2HAverages | null {
  const ids = new Set([homeTeamId, awayTeamId]);
  if (!ids.has("nba-spurs") || !ids.has("nba-timberwolves")) {
    return null;
  }

  const {
    spursPpg,
    wolvesPpg,
    spursPapg,
    wolvesPapg,
    spursNet,
    wolvesNet,
  } = spursTimberwolvesH2HStatsFromGames(spursTimberwolvesH2HGames);

  if (homeTeamId === "nba-timberwolves") {
    return {
      homeAvgPts: wolvesPpg,
      awayAvgPts: spursPpg,
      homeAvgPtsAllowed: wolvesPapg,
      awayAvgPtsAllowed: spursPapg,
      homeNetRtg: wolvesNet,
      awayNetRtg: spursNet,
    };
  }
  if (homeTeamId === "nba-spurs") {
    return {
      homeAvgPts: spursPpg,
      awayAvgPts: wolvesPpg,
      homeAvgPtsAllowed: spursPapg,
      awayAvgPtsAllowed: wolvesPapg,
      homeNetRtg: spursNet,
      awayNetRtg: wolvesNet,
    };
  }
  return null;
}
