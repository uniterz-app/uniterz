/**
 * トレード Buzz — 手で集めた 2026-11-12〜20 の動き（日本時間）。
 * 確度順（rank 1 が最も確度が高い）。手更新。
 *
 * 出典の記者名・媒体は取材メモのまま。記事は二次配信（まとめ・X・転載）のものも含む。
 * `time: null` は時刻が取れなかったもの。`day` が不確かなものは本文に「日付は未確認」と書く。
 */
import type { NbaTradeBuzzItem } from "@/lib/predict/nbaTradeBuzz";

/** 取材の基準時刻（JST の表示用） */
export const NBA_TRADE_BUZZ_AS_OF_JST = "2026-11-20 13:07";

export const NBA_TRADE_BUZZ_CURATED: readonly NbaTradeBuzzItem[] = [
  {
    id: "murray",
    rank: 1,
    playerId: null,
    playerName: "Dejounte Murray",
    fromTeamAbbr: "NOP",
    confidence: "official",
    headlineJa:
      "本人がトレードを要求し、球団も認めた。行き先は未定。関心は Suns 中心で、Suns はドラフト補償の上乗せを求めているとされる。",
    events: [
      {
        day: "2026-11-20",
        time: "01:46",
        kind: "report",
        textJa:
          "Murray 側は Suns 行きを魅力的に見ている。ただし Suns はドラフト補償の上乗せがなければ真剣に検討しない構え。Mark Williams の手術もあり、Suns の最優先は PG ではなくセンター周りのサイズ補強とされる。Heat とはまだ意味のある接触はない。",
        sourceLabel: "Jake Fischer（The Stein Line・Hoops Rumors 要約）",
        sourceUrl: "https://marcstein.substack.com/p/nba-trade-talk-latest",
      },
      {
        day: "2026-11-19",
        time: "06:47",
        kind: "opinion",
        textJa:
          "Jalen Green との交換は、指名権が付かないと難しいと見る。",
        sourceLabel: "Michael Scotto（HoopsHype）",
        sourceUrl: "https://x.com/SiriusXMNBA/status/2123171173382967361",
      },
      {
        day: "2026-11-19",
        time: "00:45",
        kind: "report",
        textJa:
          "代理人事務所（クラッチ・スポーツ）が Heat に関心を問い合わせる予定。",
        sourceLabel: "Jake Fischer",
        sourceUrl:
          "https://www.talkbasket.net/228942-klutch-sports-to-contact-heat-about-dejounte-murray",
      },
      {
        day: "2026-11-17",
        time: null,
        kind: "market",
        textJa:
          "他球団は Murray を「売りにくい資産」と見ていて、引き取るなら1巡目指名権を求めている。",
        sourceLabel: "Chris Mannix（SI）・Brian Windhorst（ESPN）",
        sourceUrl:
          "https://www.talkbasket.net/228776-teams-want-a-first-round-pick-to-take-on-dejounte-murray",
      },
      {
        day: "2026-11-17",
        time: null,
        kind: "interest",
        textJa:
          "関心があるのは実質 Suns だけで、それも「せいぜい少し」程度。",
        sourceLabel: "Marc J. Spears（ESPN）",
        sourceUrl:
          "https://www.hoopshype.com/story/sports/nba/rumors/2026/11/16/spears-suns-only-team-interested-n-dejounte-murray-and-its-mild-interest-at-best/92818544007/",
      },
      {
        day: "2026-11-14",
        time: "07:33",
        kind: "statement",
        textJa: "Pelicans が公式声明で、要求を受けたことを認めた。",
        sourceLabel: "Chris Haynes（X）",
        sourceUrl: "https://x.com/ChrisBHaynes/status/2121371002429227476",
      },
      {
        day: "2026-11-14",
        time: "04:51",
        kind: "interest",
        textJa: "Suns が関心を示している。",
        sourceLabel: "Chris Haynes（X）",
        sourceUrl: "https://x.com/ChrisBHaynes/status/2121330238600921288",
      },
      {
        day: "2026-11-14",
        time: "04:50",
        kind: "report",
        textJa:
          "トレード希望を報道。代理人はリッチ・ポール。本人はちゃんと役割のある場所でプレーしたい。",
        sourceLabel: "Shams Charania（ESPN）",
        sourceUrl:
          "https://www.espn.com/nba/story/_/id/50473732/sources-dejounte-murray-wants-trade-pelicans",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "interest",
        textJa:
          "Murray 側は Jalen Green との交換を望んでいる。Suns は「まだ協議していない」。",
        sourceLabel: "Sam Amick（The Athletic）",
        sourceUrl:
          "https://www.nytimes.com/athletic/7779741/2026/11/13/dejounte-murray-trade-request-new-orleans-pelicans-suns/",
      },
    ],
  },
  {
    id: "jones",
    rank: 2,
    playerId: null,
    playerName: "Tre Jones",
    fromTeamAbbr: "CHI",
    confidence: "multi",
    headlineJa:
      "複数チームが問い合わせ中と報道。Jazz も標的の一人にしていたとされる。ただし Bulls は売りに出しているわけではない。",
    events: [
      {
        day: "2026-11-20",
        time: "10:47",
        kind: "interest",
        textJa:
          "同じ記事で、Jazz がバックコート強化の標的の一人にしていたと報じられた。Bulls 側は Utah の提示に関心を示さなかったとされる。",
        sourceLabel: "Grant Afseth（Fastbreak Journal）",
        sourceUrl:
          "https://fastbreakjournal.com/jazz-isaiah-collier-trade-talks-tre-jones-bulls/",
      },
      {
        day: "2026-11-20",
        time: "09:08",
        kind: "report",
        textJa:
          "11/19 放送の番組で、すでに複数チームが Bulls にジョーンズの件で問い合わせていると話した（拡散は 11/20 朝）。Bulls が売りに出しているわけではなく、他球団の需要が高い状態。",
        sourceLabel: "Zach Lowe（The Ringer・roundtable 転載）",
        sourceUrl:
          "https://roundtable.io/sports/nba/bulls/news/nba-insider-reveals-trade-intrigue-for-chicago-bulls-guard-tre-jones",
      },
    ],
  },
  {
    id: "nets",
    rank: 3,
    playerId: null,
    playerName: "Michael Porter Jr. / Julius Randle",
    fromTeamAbbr: "BKN",
    confidence: "multi",
    headlineJa:
      "Nets は全員の話を聞く構え。焦点はこの2人で、2月11日の期限までにベテランを売る見方がある。",
    events: [
      {
        day: "2026-11-14",
        time: null,
        kind: "report",
        textJa:
          "他球団の幹部の間では、2月11日の期限までにベテランを売るという見方がある。",
        sourceLabel: "Jake Fischer（Hoops Rumors）",
        sourceUrl:
          "https://www.hoopsrumors.com/2026/11/fischers-latest-nets-porter-jr-pacers-clippers-bucks-trade-strategy.html",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "report",
        textJa:
          "Nets は全員の話を聞く構え。焦点は Porter Jr. と Randle。",
        sourceLabel: "Sam Amick（Bleacher Report）",
        sourceUrl:
          "https://bleacherreport.com/articles/25532869-new-nba-trade-rumors-reveal-nets-will-listen-any-calls-amid-julius-randle-mpj-buzz",
      },
    ],
  },
  {
    id: "green",
    rank: 4,
    playerId: null,
    playerName: "Jalen Green",
    fromTeamAbbr: "PHX",
    confidence: "single",
    headlineJa:
      "Murray 交換の名前に出るが、Suns は本格協議をシーズン後半まで待つ見込み。本人は噂を気にしないと話す。",
    events: [
      {
        day: "2026-11-18",
        time: null,
        kind: "statement",
        textJa: "本人は「噂なんて気にしない」とコメント。",
        sourceLabel: "AZ Central （本人コメント）",
        sourceUrl:
          "https://www.azcentral.com/story/sports/nba/suns/2026/11/18/i-dont-care-phoenix-suns-guard-jalen-green-addresses-trade-rumors-dejounte-murray/92847351007/",
      },
      {
        day: "2026-11-14",
        time: null,
        kind: "report",
        textJa:
          "Suns は Jalen Green を「出せる選手」にしていると報道。",
        sourceLabel: "Chris Haynes",
        sourceUrl:
          "https://hoopswire.com/suns-make-jalen-green-available-in-trade-seek-help-at-point-guard/",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "market",
        textJa:
          "取材したチーム関係者は、本格的な協議はシーズン後半まで待つと話す。",
        sourceLabel: "Sam Amick",
        sourceUrl:
          "https://www.hoopsrumors.com/2026/11/amicks-latest-irving-davis-black-h-jones-j-green-more.html",
      },
    ],
  },
  {
    id: "collier",
    rank: 5,
    playerId: null,
    playerName: "Isaiah Collier",
    fromTeamAbbr: "UTA",
    confidence: "single",
    headlineJa:
      "Jazz がコリアーを含むトレードを協議しているとのリーグソース報道。相手候補の一人は Bulls の Tre Jones。単発の報道で、確定ではない。",
    events: [
      {
        day: "2026-11-20",
        time: "10:47",
        kind: "report",
        textJa:
          "バックコート強化を狙う Jazz が、コリアーを含むトレードを協議。Bulls の Tre Jones を標的の一人にしていたが、Bulls 側は Utah の提示に関心を示さなかったとされる。",
        sourceLabel: "Grant Afseth（Fastbreak Journal・リーグソース）",
        sourceUrl:
          "https://fastbreakjournal.com/jazz-isaiah-collier-trade-talks-tre-jones-bulls/",
      },
    ],
  },
  {
    id: "bucks",
    rank: 6,
    playerId: null,
    playerName: "Myles Turner / Kyle Kuzma",
    fromTeamAbbr: "MIL",
    confidence: "single",
    headlineJa:
      "Bucks はオフシーズンから2人を動かそうとしている。Jaime Jaquez Jr. と Ryan Rollins の問い合わせには応じていない。",
    events: [
      {
        day: "2026-11-13",
        time: null,
        kind: "report",
        textJa:
          "オフシーズンからこの2人を動かそうとしている。Jaime Jaquez Jr. と Ryan Rollins の問い合わせには応じていない。",
        sourceLabel: "Brett Siegel（ClutchPoints）",
        sourceUrl:
          "https://www.bballrumors.com/2026/11/two-nba-teams-open-to-trading-anybody.html",
      },
    ],
  },
  {
    id: "clippers",
    rank: 7,
    playerId: null,
    playerName: "Max Strus / Derrick Jones Jr. / Brook Lopez",
    fromTeamAbbr: "LAC",
    confidence: "single",
    headlineJa:
      "3人は動きやすいと報道。指名権を取り戻すため、Kris Dunn や場合によっては Brandon Ingram も売りに出るかもしれない。",
    events: [
      {
        day: "2026-11-14",
        time: null,
        kind: "report",
        textJa:
          "指名権を取り戻すため、Kris Dunn や場合によっては Brandon Ingram も売りに出るかもしれない。",
        sourceLabel: "Jake Fischer（Hoops Rumors）",
        sourceUrl:
          "https://www.hoopsrumors.com/2026/11/fischers-latest-nets-porter-jr-pacers-clippers-bucks-trade-strategy.html",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "report",
        textJa: "この3人が動きやすい。",
        sourceLabel: "Brett Siegel（ClutchPoints）",
        sourceUrl:
          "https://hoopswire.com/bucks-clippers-expected-to-entertain-offers-several-veterans-draw-trade-attention/",
      },
    ],
  },
  {
    id: "kings",
    rank: 8,
    playerId: null,
    playerName: "Domantas Sabonis / Zach LaVine / Malik Monk / Keegan Murray",
    fromTeamAbbr: "SAC",
    confidence: "single",
    headlineJa:
      "Acuff Jr. 以外なら協議に応じる構え。ただし Sabonis・LaVine・Monk は年俸が高く、買い手がつきにくい。",
    events: [
      {
        day: "2026-11-13",
        time: null,
        kind: "market",
        textJa:
          "Darius Acuff Jr. 以外なら誰とでも協議に応じる。Sabonis・LaVine・Monk は年俸が高すぎて買い手がつきにくい。",
        sourceLabel: "Sam Amick（Talkbasket）",
        sourceUrl:
          "https://www.talkbasket.net/227973-darius-acuff-jr-untouchable-as-kings-open-trade-talks",
      },
      {
        day: "2026-11-03",
        time: null,
        kind: "report",
        textJa:
          "Sabonis が出たがっているとの報道（11月初め）。",
        sourceLabel: "Tim MacMahon（HoopsHype）",
        sourceUrl:
          "https://www.hoopshype.com/story/sports/nba/rumors/2026/11/03/domantas-sabonis-wants-out-of-sacramento/92581138007/",
      },
    ],
  },
  {
    id: "davis",
    rank: 9,
    playerId: null,
    playerName: "Anthony Davis",
    fromTeamAbbr: "WAS",
    confidence: "single",
    headlineJa:
      "Wizards は20〜30試合ほど様子を見てから延長を考える。延長しなければ、2027年夏の FA 前に動く可能性がある。交渉の報道は今週なし。",
    events: [
      {
        day: "2026-11-18",
        time: null,
        kind: "opinion",
        textJa:
          "ESPN の番組で Warriors 行きが議論された。あくまで討論。",
        sourceLabel: "ESPN （番組討論・ClutchPoints）",
        sourceUrl:
          "https://clutchpoints.com/nba/warriors-rumors-espns-anthony-davis-trade-debate-brings-out-draymond-green-jimmy-butler-tease",
      },
      {
        day: "2026-11-18",
        time: null,
        kind: "report",
        textJa:
          "Wizards は20〜30試合ほど様子を見てから延長を考える（Windhorst の報道が再び引用された。初出は今月初めだが日付は未確認）。",
        sourceLabel: "Brian Windhorst（ESPN）",
        sourceUrl:
          "https://bleacherreport.com/articles/25534931-new-anthony-davis-trade-rumors-update-value-wizards-star-amid-contract-buzz",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "opinion",
        textJa:
          "Trae Young の約2億1290万ドルの延長がある以上、Davis にも大型契約を出すのは難しいと分析。",
        sourceLabel: "Sam Amick（The Athletic）",
        sourceUrl:
          "https://www.nytimes.com/athletic/7778064/2026/11/13/nba-trade-buzz-kyrie-irving-anthony-davis/",
      },
    ],
  },
  {
    id: "herbert",
    rank: 10,
    playerId: null,
    playerName: "Herbert Jones",
    fromTeamAbbr: "NOP",
    confidence: "single",
    headlineJa:
      "Pelicans の要求額が高く、契約と出場時間の減少もあって、他球団は手を出しにくい。",
    events: [
      {
        day: "2026-11-13",
        time: null,
        kind: "market",
        textJa:
          "要求額が高く、契約と出場時間の減少もあって他球団は手を出しにくい。",
        sourceLabel: "Sam Amick",
        sourceUrl:
          "https://www.hoopsrumors.com/2026/11/amicks-latest-irving-davis-black-h-jones-j-green-more.html",
      },
    ],
  },
  {
    id: "black",
    rank: 11,
    playerId: null,
    playerName: "Anthony Black",
    fromTeamAbbr: "ORL",
    confidence: "single",
    headlineJa:
      "他球団の幹部は放出もあると見ているが、球団に近い関係者はそれを否定している。",
    events: [
      {
        day: "2026-11-13",
        time: null,
        kind: "market",
        textJa:
          "他球団の幹部は放出もあると見ているが、球団に近い関係者はそれを否定している。",
        sourceLabel: "Sam Amick（Bleacher Report）",
        sourceUrl:
          "https://bleacherreport.com/articles/25532919-new-nba-trade-rumors-magics-anthony-black-after-contract-extension-talks-fizzled-out",
      },
    ],
  },
  {
    id: "pacers",
    rank: 12,
    playerId: null,
    playerName: "Pacers (buyers)",
    fromTeamAbbr: "IND",
    confidence: "single",
    headlineJa:
      "売り手ではなく補強を探す側。Tyrese Haliburton の離脱で5勝9敗と苦しく、中堅クラスの補強を探している。",
    events: [
      {
        day: "2026-11-18",
        time: "01:05",
        kind: "report",
        textJa:
          "Tyrese Haliburton の離脱で5勝9敗。中堅クラスの補強を探している。",
        sourceLabel: "Jake Fischer（X）",
        sourceUrl: "https://x.com/JakeLFischer/status/2122722746060952026",
      },
      {
        day: "2026-11-14",
        time: null,
        kind: "report",
        textJa: "中堅クラスの補強を探していると報道（Fischer）。",
        sourceLabel: "Jake Fischer",
        sourceUrl: null,
      },
    ],
  },
  {
    id: "murphy",
    rank: 13,
    playerId: null,
    playerName: "Trey Murphy III",
    fromTeamAbbr: "NOP",
    confidence: "single",
    headlineJa:
      "本人に移籍希望はなく、球団も放出に消極的。今夏には1巡目指名権2つ以上を含むオファーを断っていたとされる。",
    events: [
      {
        day: "2026-11-20",
        time: "02:18",
        kind: "report",
        textJa:
          "今夏、1巡目指名権2つ以上を含むオファーを Pelicans が断っていたと報じられた。",
        sourceLabel: "Michael Scotto（X）",
        sourceUrl: "https://x.com/MikeAScotto/status/2123465907276222827",
      },
      {
        day: "2026-11-20",
        time: "01:46",
        kind: "market",
        textJa:
          "本人に移籍希望はなく、球団も放出に消極的とされる（Fischer の記事を Hoops Rumors が要約）。",
        sourceLabel: "Jake Fischer（The Stein Line・Hoops Rumors 要約）",
        sourceUrl:
          "https://www.hoopsrumors.com/2026/11/trade-rumors-murray-suns-heat-murphy-mcbride.html",
      },
    ],
  },
  {
    id: "irving",
    rank: 14,
    playerId: null,
    playerName: "Kyrie Irving",
    fromTeamAbbr: "DAL",
    confidence: "single",
    headlineJa:
      "SNY の Begley が「Jazz が潜在候補として内部で検討」と報道。ただし本人が「誇張されている」と修正し、Dallas との交渉は報じられていない。",
    events: [
      {
        day: "2026-11-19",
        time: "23:24",
        kind: "statement",
        textJa:
          "Begley 本人が「報道内容は誇張されている」と訂正。Dallas との交渉開始ではない。",
        sourceLabel: "Ian Begley（SNY・X）",
        sourceUrl: "https://x.com/IanBegley/status/2123422256051507246",
      },
      {
        day: "2026-11-19",
        time: "23:17",
        kind: "report",
        textJa:
          "Jazz がカイリーを潜在的なトレード候補として内部で検討していると報道。",
        sourceLabel: "Ian Begley（SNY・X）",
        sourceUrl: "https://x.com/IanBegley/status/2123420400507855161",
      },
      {
        day: "2026-11-13",
        time: null,
        kind: "opinion",
        textJa:
          "名前は出ているが、Dallas は動かす気が薄く残る可能性が高いと見る。",
        sourceLabel: "Sam Amick（The Athletic）",
        sourceUrl:
          "https://www.nytimes.com/athletic/7778064/2026/11/13/nba-trade-buzz-kyrie-irving-anthony-davis/",
      },
    ],
  },
  {
    id: "mcbride",
    rank: 15,
    playerId: null,
    playerName: "Miles McBride",
    fromTeamAbbr: "NYK",
    confidence: "opinion",
    headlineJa:
      "記者の推測。契約最終年の McBride をフロントコート補強の駒に使う可能性を挙げたもので、Knicks が動いているという報道ではない。",
    events: [
      {
        day: "2026-11-20",
        time: "01:55",
        kind: "opinion",
        textJa:
          "ラジオ番組で、Landry Shamet の好調を踏まえ、契約最終年の McBride をフロントコート補強のトレード駒に使う可能性を挙げた。",
        sourceLabel: "Michael Scotto（HoopsHype・ラジオ / X）",
        sourceUrl: "https://x.com/MikeAScotto/status/2123460275395522744",
      },
    ],
  },
  {
    id: "reid",
    rank: 16,
    playerId: null,
    playerName: "Naz Reid",
    fromTeamAbbr: "CHA",
    confidence: "opinion",
    headlineJa:
      "交渉の報道ではなく、記者本人の見立て。「またトレードされる可能性はかなり高い」。",
    events: [
      {
        day: "2026-11-12",
        time: null,
        kind: "opinion",
        textJa:
          "自身のポッドキャストで「またトレードされる可能性はかなり高い」と話す（11/12 頃）。",
        sourceLabel: "Jon Krawczynski（Talkbasket）",
        sourceUrl:
          "https://www.talkbasket.net/227696-naz-reid-trade-chances-are-very-high",
      },
    ],
  },
  {
    id: "sporting-news-list",
    rank: 17,
    playerId: null,
    playerName: "Tyler Herro / Paolo Banchero / Trey Murphy III / Norman Powell ほか",
    fromTeamAbbr: null,
    confidence: "opinion",
    headlineJa:
      "記事の筆者による候補予想。記事自身も「売りに出している兆候はない」と書いている。",
    events: [
      {
        day: "2026-11-18",
        time: null,
        kind: "opinion",
        textJa:
          "2026-27 にトレードされやすい11人の候補を挙げた記事。筆者の予想にすぎない。",
        sourceLabel: "Sporting News",
        sourceUrl:
          "https://www.sportingnews.com/us/nba/news/nba-trade-candidates-anthony-davis-paolo-banchero-among-11-most-likely-get-moved-2026-27-season/021fddb6d6094bb12bc8d15b",
      },
    ],
  },
];
