// lib/wc/teams.ts
//
// World Cup 出場国の "プロフィール" 静的データ。
// （色 = lib/teams-wc.ts、表示名 = lib/wc/wcCountry.ts と棲み分け）
//
// FIFA ランクは 2026 年 W杯本戦時点のスナップショット。月次で更新したい場合はこのファイルを書き換える。

export type WcConfederation =
  | "AFC"
  | "CAF"
  | "CONCACAF"
  | "CONMEBOL"
  | "OFC"
  | "UEFA";

export type WcRoundReached =
  | "Group"
  | "R16"
  | "QF"
  | "SF"
  | "3rd"
  | "Final"
  | "W";

export type WcLastResult = {
  /** 大会開催年 */
  year: number;
  round: WcRoundReached;
};

export type WcTeamProfile = {
  /** 通称 / ニックネーム */
  nickname?: { en: string; ja: string };
  /** 大陸連盟 */
  confederation: WcConfederation;
  /** 監督名（英語のみ。多言語化したい時は { en, ja } に） */
  manager?: string;
  /** チーム紹介（1〜2 段落） */
  description?: { en: string; ja: string };
  /** 現 FIFA ランク */
  fifaRank?: number;
  /** 前回（前月）の FIFA ランク（上下動表示用） */
  fifaRankPrev?: number;
  /** W杯本戦の出場回数（今回出場前まで） */
  wcAppearances?: number;
  /** W杯優勝回数 */
  wcTitles?: number;
  /** 直近大会の到達ラウンド */
  lastWcResult?: WcLastResult;
};

const WC_TEAM_PROFILES: Record<string, WcTeamProfile> = {
  // ============================
  // Group A
  // ============================
  mex: {
    nickname: { en: "El Tri", ja: "エル・トリ" },
    confederation: "CONCACAF",
    description: {
      en: "A World Cup mainstay long defined by reliable round-of-16 finishes, Mexico have not reached a quarterfinal since 1986. As co-hosts in 2026, breaking that barrier is the central storyline. Recent attacking concerns and an uneasy generational handover have softened their aura; the goal is a quarterfinal run on home soil.",
      ja: "W杯常連国で、長年ベスト16級の安定感を持ってきた。1986年以来ベスト8に届いておらず、今回は開催国としてその壁を破ることが最大テーマになる。近年は攻撃力や世代交代に不安もあり、以前ほど絶対的な印象はない。目標は地元開催でのベスト8以上。",
    },
    fifaRank: 15,
    wcAppearances: 17,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  zaf: {
    nickname: { en: "Bafana Bafana", ja: "バファナ・バファナ" },
    confederation: "CAF",
    description: {
      en: "Returning to the World Cup for the first time since 2010. The previous appearance came as hosts, so qualifying back on merit carries real weight for the nation. Speed and athleticism on the attack are paired with the cohesion of a domestic-based core. The target is a first-ever knockout-stage berth.",
      ja: "2010年大会以来のW杯復帰。前回出場時は開催国としての出場だったため、今回は予選を突破して戻ってきた意味が大きい。スピードと身体能力を生かした攻撃に加え、国内組中心の結束力も特徴。目標は国として初の決勝トーナメント進出。",
    },
    fifaRank: 60,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "Group" },
  },
  kor: {
    nickname: { en: "Taegeuk Warriors", ja: "テグク戦士" },
    confederation: "AFC",
    description: {
      en: "Asia's most consistent qualifier with 11 straight World Cups. Reached the semifinals at home in 2002 but have not gone past the round of 16 since. The Europe-based core of Son Heung-min, Kim Min-jae and Lee Kang-in offers attacking pace and defensive grit. While transitioning generations, the goal is escaping the group and a knockout-round berth.",
      ja: "11大会連続出場のアジア屈指の常連国。2002年大会ではベスト4まで進んだが、その後はベスト16の壁を越えられていない。Son Heung-min、Kim Min-jae、Lee Kang-inら欧州組が中心で、前線のスピードと守備の粘りが武器。世代交代を進めながらも、今大会の目標はグループ突破とベスト16以上。",
    },
    fifaRank: 25,
    wcAppearances: 11,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  cze: {
    nickname: { en: "Národní tým", ja: "ナーロドニー・ティーム" },
    confederation: "UEFA",
    description: {
      en: "First World Cup as the Czech Republic since 2006. Czechoslovakia reached a final in earlier eras, but for the modern Czech side this is a long-awaited return. A pragmatic style built on a tight defense, set pieces and aerial duels. The goal is escaping the group and reasserting the nation among Europe's mid-tier sides.",
      ja: "チェコ共和国としては2006年以来のW杯出場。旧チェコスロバキア時代にはW杯決勝進出歴もあるが、現在のチェコとしては久々の本大会になる。堅い守備、空中戦、セットプレーを軸にした現実的な戦い方が特徴。目標はグループ突破と、欧州中堅国としての存在感を示すこと。",
    },
    fifaRank: 41,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2006, round: "Group" },
  },

  // ============================
  // Group B
  // ============================
  can: {
    nickname: { en: "Les Rouges", ja: "ル・ルージュ" },
    confederation: "CONCACAF",
    description: {
      en: "Returning to the World Cup in 2022 after 36 years, Canada exited with three losses and felt the gap. Now as co-hosts they have a major environmental edge, with Alphonso Davies, Jonathan David and Tajon Buchanan supplying individual speed. Targets are a first ever World Cup win and a maiden knockout berth.",
      ja: "2022年大会では36年ぶりにW杯へ戻ったが、3連敗で大会を終え、世界との差を痛感した。今回は開催国として出場し、環境面のアドバンテージがある。Alphonso Davies、Jonathan David、Tajon Buchananらを中心に、スピードと個の突破力は高い。目標はカナダ代表としてのW杯初勝利と初の決勝トーナメント進出。",
    },
    fifaRank: 30,
    wcAppearances: 2,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  bih: {
    nickname: { en: "Zmajevi", ja: "ドラゴンズ" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since 2014. Once defined by Edin Džeko and Miralem Pjanić, the side is in transition. Less reliant on individual brilliance and more on a defensive structure that squeezes value out of limited chances. The goal is a first-ever knockout-round berth.",
      ja: "2014年以来のW杯出場。Edin Džeko、Miralem Pjanić世代の印象が強い国だが、現在は新しい形への移行期にある。個の爆発力よりも、守備を固めて少ないチャンスを生かす戦い方が基本になる。目標は国として初の決勝トーナメント進出。",
    },
    fifaRank: 65,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "Group" },
  },
  qat: {
    nickname: { en: "Al-Annabi", ja: "アル＝アンナビ" },
    confederation: "AFC",
    description: {
      en: "Made their World Cup debut as hosts in 2022 but lost all three games. This time they qualified on merit, with an Asian Cup–winning side built on midfield organization. The challenge is coping with the intensity of the World Cup proper; the first targets are a maiden World Cup point and win.",
      ja: "2022年大会では開催国として初出場したが、3連敗で厳しい結果に終わった。今回は予選を突破して本大会に出る形で、前回とは意味が違う。アジアカップ優勝経験があり、組織力と中盤のつなぎには特徴がある。課題はW杯本大会の強度に対応できるかで、まずは初勝ち点と初勝利が目標。",
    },
    fifaRank: 55,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  che: {
    nickname: { en: "Nati", ja: "ナティ" },
    confederation: "UEFA",
    description: {
      en: "Not a star-studded side, but a European team that rarely collapses on the big stage. Beat France at Euro 2020 and impressed at Euro 2024. Granit Xhaka and Manuel Akanji anchor a steady, well-managed group. The goal is escaping the group, with the quarterfinals as upside.",
      ja: "派手なスター軍団ではないが、国際大会で大崩れしない欧州の安定勢力。EURO 2020ではフランスを破り、EURO 2024でも存在感を見せた。Granit Xhaka、Manuel Akanjiらを中心に、守備組織と試合運びが安定している。目標はグループ突破、上振れすればベスト8。",
    },
    fifaRank: 19,
    wcAppearances: 12,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },

  // ============================
  // Group C
  // ============================
  bra: {
    nickname: { en: "Seleção", ja: "セレソン" },
    confederation: "CONMEBOL",
    description: {
      en: "The most successful nation in World Cup history and the only side to have appeared in every edition. Title-less since 2002 and inconsistent in CONMEBOL qualifying recently. Vinícius Júnior, Neymar and Raphinha headline one of the world's best attacks, with Marquinhos and Casemiro anchoring the spine. The goal is a sixth crown, with defensive stability and team cohesion the open questions.",
      ja: "唯一すべてのW杯に出場している最多優勝国。2002年以降は優勝から遠ざかっており、近年は南米予選でも不安定さを見せた。Vinícius Júnior、Neymar、Raphinhaら攻撃陣の個の力は世界最高級で、Marquinhos、Casemiroがチームの軸になる。目標は6度目の優勝で、課題は守備の安定とチームとしてのまとまり。",
    },
    fifaRank: 6,
    wcAppearances: 22,
    wcTitles: 5,
    lastWcResult: { year: 2022, round: "QF" },
  },
  mar: {
    nickname: { en: "Atlas Lions", ja: "アトラスの獅子" },
    confederation: "CAF",
    description: {
      en: "Became the first African nation to reach a World Cup semifinal in 2022, beating Belgium, Spain and Portugal on the way to fourth. Hakimi and Amrabat lead a side defined by intensity, duels and incisive counterattacks. No longer a surprise package; the aim is the quarterfinals or better, ideally another semifinal run.",
      ja: "2022年大会ではベルギーを破り、スペインとポルトガルも倒して、アフリカ勢初のベスト4入りを果たした。Achraf Hakimi、Sofyan Amrabatらを中心に、守備強度、球際、カウンターの鋭さが武器。今回はもうサプライズ枠ではなく、最初から警戒される強豪として大会に入る。目標はベスト8以上、理想は再びベスト4。",
    },
    fifaRank: 8,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "SF" },
  },
  hti: {
    nickname: { en: "Les Grenadiers", ja: "レ・グルナディエ" },
    confederation: "CONCACAF",
    description: {
      en: "Returning to the World Cup for the first time since 1974—a long-awaited comeback that is itself a major story. Speed and athleticism are present, but holding up defensively against top sides will be the challenge. Targets are a first-ever World Cup point and a meaningful presence on the world stage.",
      ja: "1974年以来のW杯復帰。長い空白を経て本大会に戻ってきた国で、出場自体に大きなストーリーがある。個のスピードと身体能力はあるが、強豪相手に守備をどこまで保てるかが課題になる。目標は初勝ち点と、世界大会で存在感を示すこと。",
    },
    fifaRank: 83,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1974, round: "Group" },
  },
  sct: {
    nickname: { en: "Tartan Army", ja: "タータン・アーミー" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since 1998. Scotland have never advanced from the group stage, and that remains the headline obstacle here. Andy Robertson and Scott McTominay lead a side built on duels, work rate and set pieces. The target is a first-ever knockout-round berth.",
      ja: "1998年以来のW杯復帰。過去のW杯では一度もグループ突破がなく、今回もそこが最大の壁になる。Andy Robertson、Scott McTominayらを中心に、球際、運動量、セットプレーが武器。目標は国として初の決勝トーナメント進出。",
    },
    fifaRank: 43,
    wcAppearances: 9,
    wcTitles: 0,
    lastWcResult: { year: 1998, round: "Group" },
  },

  // ============================
  // Group D
  // ============================
  usa: {
    nickname: { en: "USMNT", ja: "USMNT" },
    confederation: "CONCACAF",
    description: {
      en: "Co-hosts and one of the central narratives of 2026. Christian Pulisic, Weston McKennie, Gio Reyna and Folarin Balogun head a Europe-based core that may be the deepest in the country's history. After losing to the Netherlands in the 2022 round of 16, the bar is now set at the quarterfinals or better.",
      ja: "開催国の一つで、今回はホーム大会として大きな期待を背負う。Christian Pulisic、Weston McKennie、Gio Reyna、Folarin Balogunら欧州組が中心で、選手層は過去最高級に近い。2022年はベスト16でオランダに敗れ、まだ上位国との差も見えた。今回はベスト16ではなく、ベスト8以上が目標になる。",
    },
    fifaRank: 16,
    wcAppearances: 11,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  pry: {
    nickname: { en: "La Albirroja", ja: "ラ・アルビロハ" },
    confederation: "CONMEBOL",
    description: {
      en: "First World Cup since 2010. Defensive intensity, physicality and set pieces are traditional strengths, with the ability to drag any opponent into a tight game. They reached the quarterfinals in 2010 and pushed Spain hard. After a long absence, the goal is a knockout berth on the back of organized defending.",
      ja: "2010年以来のW杯復帰。伝統的に守備の粘り、球際、セットプレーに強みがあり、接戦に持ち込む力がある。2010年にはベスト8まで進み、スペインを苦しめた実績もある。久々の本大会で、目標は堅守を武器にしたグループ突破。",
    },
    fifaRank: 40,
    wcAppearances: 8,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "QF" },
  },
  aus: {
    nickname: { en: "Socceroos", ja: "サッカルーズ" },
    confederation: "AFC",
    description: {
      en: "A regular at every World Cup since 2006 and one of Asia's most stable sides. Reached the round of 16 in 2022 and pushed Argentina close. Strengths are height, physicality, defensive shape and set pieces—a side defined more by discipline than star power. The realistic goal is another knockout-round appearance.",
      ja: "2006年以降は継続してW杯に出場しているアジアの安定勢力。2022年大会ではベスト16まで進み、アルゼンチン相手にも粘りを見せた。高さ、フィジカル、守備組織、セットプレーが強みで、派手なスターよりも規律で戦うチーム。今回も現実的な目標は決勝トーナメント進出。",
    },
    fifaRank: 27,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  tur: {
    nickname: { en: "Ay-Yıldızlılar", ja: "クレセント＆スターズ" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since the 2002 third-place finish. Recent years have produced a wave of young, attack-minded players, with Turkey making a statement at the Euros. Hakan Çalhanoğlu, Arda Güler and Kenan Yıldız lead the new generation. After a long absence, the target is escaping the group.",
      ja: "2002年大会で3位に入って以来のW杯出場。近年は若くて攻撃的なタレントが増えており、EUROでも勢いのあるチームとして存在感を示した。Hakan Çalhanoğlu、Arda Güler、Kenan Yıldızらが中心になる。目標は久々の本大会でのグループ突破。",
    },
    fifaRank: 22,
    wcAppearances: 2,
    wcTitles: 0,
    lastWcResult: { year: 2002, round: "3rd" },
  },

  // ============================
  // Group E
  // ============================
  deu: {
    nickname: { en: "Die Mannschaft", ja: "ディ・マンシャフト" },
    confederation: "UEFA",
    description: {
      en: "Four-time World Cup champions but eliminated in the group stage at both 2018 and 2022. Jamal Musiala and Florian Wirtz headline a creative young core charged with reviving a storied name. Talent is plentiful, but defensive stability and clutch play are the open questions; the realistic target is the quarters with title contention as the ceiling.",
      ja: "W杯4度優勝の伝統国だが、2018年、2022年は連続でグループステージ敗退に終わった。Jamal Musiala、Florian Wirtzら創造性のある若手を中心に、名門復活がテーマになる。タレントは十分だが、守備の安定と勝負強さが課題。目標は最低でもベスト8、理想は優勝争い。",
    },
    fifaRank: 10,
    wcAppearances: 20,
    wcTitles: 4,
    lastWcResult: { year: 2022, round: "Group" },
  },
  civ: {
    nickname: { en: "Les Éléphants", ja: "レ・ゼレファン" },
    confederation: "CAF",
    description: {
      en: "Once defined by the Drogba generation, Côte d'Ivoire are now rebuilding around a new wave. They have failed to escape their group in three previous attempts. Athleticism, intensity and individual quality up front—led by Simon Adingra, Nicolas Pépé and Amad Diallo—are the calling cards. The goal is a first-ever knockout berth.",
      ja: "Drogba世代の印象が強い国だが、現在は新しい世代で再構築している。過去3度のW杯ではすべてグループステージ敗退で、まだ決勝トーナメント進出がない。身体能力、強度、前線の個が武器で、Simon Adingra、Nicolas Pépé、Amad Dialloらが中心になる。目標は国として初のグループ突破。",
    },
    fifaRank: 34,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "Group" },
  },
  ecu: {
    nickname: { en: "La Tri", ja: "ラ・トリ" },
    confederation: "CONMEBOL",
    description: {
      en: "A young, intense South American side trending upward. Opened 2022 with a win over Qatar but failed to advance. Built around Moisés Caicedo and Piero Hincapié in midfield, with high upside on both ends. The target is the round of 16 or better, with plenty of room left to grow.",
      ja: "近年の南米で評価を上げている若くて強度の高いチーム。2022年大会では開幕戦でカタールを破ったが、グループ突破には届かなかった。Moisés Caicedo、Piero Hincapiéらを中心に、中盤の守備力と推進力が武器。目標はベスト16以上で、チームの伸びしろは大きい。",
    },
    fifaRank: 23,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  cuw: {
    nickname: { en: "Famia Kòrsou", ja: "ファミア・コルソウ" },
    confederation: "CONCACAF",
    description: {
      en: "First-ever World Cup and a historic feat for a Caribbean micro-nation. Many players carry Dutch ties and bring real technical quality. Just reaching the tournament is its own story; the target is a first World Cup point and leaving a mark as one of the standout debutants.",
      ja: "初のW杯出場で、カリブ海の小国として歴史的な快挙。オランダ系のルーツを持つ選手も多く、技術面に特徴がある。規模の小さい国ながら本大会にたどり着いたことで、大会前から注目度は高い。目標は勝ち点獲得と、初出場国として爪痕を残すこと。",
    },
    fifaRank: 82,
    wcAppearances: 0,
    wcTitles: 0,
  },

  // ============================
  // Group F
  // ============================
  nld: {
    nickname: { en: "Oranje", ja: "オランイェ" },
    confederation: "UEFA",
    description: {
      en: "Three-time finalists without a World Cup title. Anchored defensively by Virgil van Dijk, with Frenkie de Jong driving the midfield and a fast front line. Lost the 2022 quarterfinal to Argentina on penalties; the goal is the quarters or beyond, with a long-awaited first crown as the ceiling.",
      ja: "W杯優勝はないが、準優勝3回の強豪国。Virgil van Dijkを中心とした守備、Frenkie de Jongの中盤、前線のスピードが軸になる。2022年大会ではベスト8でアルゼンチンにPK戦で敗れた。目標はベスト8以上で、理想は悲願の初優勝。",
    },
    fifaRank: 7,
    wcAppearances: 11,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "QF" },
  },
  jpn: {
    nickname: { en: "Samurai Blue", ja: "サムライブルー" },
    confederation: "AFC",
    description: {
      en: "Made global headlines in 2022, beating Germany and Spain to top the group, before losing to Croatia on penalties in the round of 16—again falling short of a first quarterfinal. Captain Wataru Endo anchors the midfield, with Zion Suzuki in goal and a Europe-based core of Kubo, Daichi Kamada, Kaishu Sano and Doan, plus Ayase Ueda up front—the deepest squad in the country's history. Beyond rapid counterattacks, the side now has the ability to break opponents down with the ball; the goal is a first-ever quarterfinal run.",
      ja: "前回の2022年大会ではドイツとスペインを倒してグループ首位通過を果たし、世界に大きな衝撃を与えた。一方で、ベスト16ではクロアチアにPK戦で敗れ、またしてもベスト8の壁を越えられなかった。キャプテンの遠藤航を軸に、GKの鈴木彩艶、久保建英、鎌田大地、佐野海舟、堂安律ら欧州組が中心で、前線には上田綺世もいる。選手層は過去最高級で、速攻だけでなくボールを持って崩す力も上がっており、目標は日本サッカー初のベスト8以上。",
    },
    fifaRank: 18,
    wcAppearances: 7,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  swe: {
    nickname: { en: "Blågult", ja: "ブロー・グルト" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since 2018. Beyond the Ibrahimović era, with Alexander Isak and Viktor Gyökeres providing one of the most exciting front lines around. Height, physicality and vertical speed make them dangerous on the attack; defensive consistency is the question, and the target is the round of 16 or better.",
      ja: "2018年以来のW杯復帰。Zlatan Ibrahimović後の世代に移り、Alexander Isak、Viktor Gyökeresら前線の質が非常に高い。高さ、フィジカル、縦への速さもあり、攻撃面では面白いチーム。課題は守備の安定で、目標はベスト16以上。",
    },
    fifaRank: 38,
    wcAppearances: 12,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "QF" },
  },
  tun: {
    nickname: { en: "Eagles of Carthage", ja: "カルタゴの鷲" },
    confederation: "CAF",
    description: {
      en: "A North African regular at the World Cup, becoming a steady fixture. Tunisia beat France in 2022 but failed to advance. The defense holds up against bigger sides, but attacking output is a concern. The long-awaited first knockout-round berth is the goal.",
      ja: "W杯常連になりつつある北アフリカの堅実なチーム。2022年大会ではフランスを破ったが、グループ突破には届かなかった。守備組織が整っており、格上相手にもロースコアに持ち込める一方、攻撃の迫力は課題。目標は悲願の初グループ突破。",
    },
    fifaRank: 44,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },

  // ============================
  // Group G
  // ============================
  bel: {
    nickname: { en: "Red Devils", ja: "レッド・デビルズ" },
    confederation: "UEFA",
    description: {
      en: "The 2018 third-place golden generation has aged into a transition. Blending Kevin De Bruyne and Romelu Lukaku with younger players is the central challenge. Less of a tournament favorite now, but individual quality remains high; the goal is a knockout berth amid the rebuild.",
      ja: "2018年大会で3位に入った黄金世代はピークを過ぎ、現在は移行期にある。Kevin De Bruyne、Romelu Lukakuらの経験に、若い世代をどう組み合わせるかがテーマ。以前ほど圧倒的な優勝候補ではないが、個の力はまだ高い。目標は世代交代しながらの決勝トーナメント進出。",
    },
    fifaRank: 9,
    wcAppearances: 14,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  egy: {
    nickname: { en: "Pharaohs", ja: "ファラオズ" },
    confederation: "CAF",
    description: {
      en: "African Cup of Nations heavyweights yet to make a real World Cup mark. Mohamed Salah is the focal point, with the side likely to defend deep and lean on his finishing. The 2018 campaign ended in three losses, so both performance and results are needed; the target is a first knockout-round appearance.",
      ja: "アフリカネーションズカップでは強豪だが、W杯本大会ではまだ大きな結果を残せていない。Mohamed Salahが最大の注目選手で、守備を固めて彼の決定力に託す形が基本になる。前回出場した2018年は3連敗で終わったため、今回は内容と結果の両方が求められる。目標は久々の勝利と初の決勝トーナメント進出。",
    },
    fifaRank: 29,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "Group" },
  },
  irn: {
    nickname: { en: "Team Melli", ja: "チーム・メリ" },
    confederation: "AFC",
    description: {
      en: "Asian heavyweights who have never advanced from the World Cup group stage. Mehdi Taremi and captain Alireza Jahanbakhsh lead an experienced attack, leaning on a defensive block and quick counters. Political concerns around tournament participation have been reported, but at present they remain in the field. The goal is a first-ever knockout berth.",
      ja: "アジア予選では安定して強いが、W杯本大会ではまだ決勝トーナメントに進んだことがない。Mehdi TaremiとキャプテンのAlireza Jahanbakhshを中心に、経験豊富な攻撃陣が守備を固めてからカウンターで仕留める形が基本。政治的な問題で大会参加を巡る懸念も報じられているが、現時点では出場国に含まれる。目標は国として初のグループ突破。",
    },
    fifaRank: 21,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  nzl: {
    nickname: { en: "All Whites", ja: "オール・ホワイツ" },
    confederation: "OFC",
    description: {
      en: "First World Cup since 2010. Famously went unbeaten in three group games at that tournament without winning any. Built around Chris Wood with size, physicality and defensive discipline. There is no large talent pool, but they grind low-scoring games. The goal is a first-ever World Cup win for the nation.",
      ja: "2010年以来のW杯出場。2010年大会では未勝利ながら無敗でグループステージを終えた珍しいチームだった。Chris Woodを中心に、高さ、フィジカル、守備の規律が特徴。大きなタレント量はないが、ロースコアで粘る力はある。目標は国としてのW杯初勝利。",
    },
    fifaRank: 85,
    wcAppearances: 2,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "Group" },
  },

  // ============================
  // Group H
  // ============================
  esp: {
    nickname: { en: "La Roja", ja: "ラ・ロハ" },
    confederation: "UEFA",
    description: {
      en: "2010 champions, currently rebuilt around a young core that is restoring their elite feel. Lamine Yamal, Pedri, Rodri and Nico Williams set the tempo with elite ball retention and counterpressing. Coming off strong Euros showings, the next golden generation is taking shape; the aim is a first crown since 2010.",
      ja: "2010年王者で、近年は若い才能を中心に再び強豪感を取り戻している。Lamine Yamal、Pedri、Rodri、Nico Williamsらを中心に、保持力と即時奪回の質が高い。EUROでも高い評価を受け、次の黄金世代に近い雰囲気がある。目標は2010年以来のW杯制覇。",
    },
    fifaRank: 2,
    wcAppearances: 16,
    wcTitles: 1,
    lastWcResult: { year: 2022, round: "R16" },
  },
  cpv: {
    nickname: { en: "Tubarões Azuis", ja: "ブルー・シャークス" },
    confederation: "CAF",
    description: {
      en: "First World Cup and one of the symbolic debutants of 2026. A small-population nation with many Europe-based players; merely powering through African qualifying is itself a remarkable feat. Defensive grit, athleticism and quick attacking are the strengths. The goal is a first World Cup point and a strong impression as a debutant.",
      ja: "初のW杯出場で、2026年大会の象徴的な初出場国の一つ。人口規模の小さい国ながら、欧州でプレーする選手を多く抱え、アフリカ予選を突破したこと自体が大きな快挙。守備の粘り、身体能力、速い攻撃が武器になる。目標は初勝ち点と、初出場国として強い印象を残すこと。",
    },
    fifaRank: 69,
    wcAppearances: 0,
    wcTitles: 0,
  },
  sau: {
    nickname: { en: "Green Falcons", ja: "緑の鷹" },
    confederation: "AFC",
    description: {
      en: "Reached the round of 16 in 1994 and pulled off one of the great upsets in tournament history by beating champions Argentina in 2022. Compact defending and quick transitions are their hallmarks, with resilience and momentum as weapons. The target is a first knockout berth since 1994.",
      ja: "1994年大会でベスト16に進んだ実績があるアジアの常連国。2022年大会では優勝国アルゼンチンを破り、大会最大級の番狂わせを起こした。守備ブロックを作ってから速く攻める形が基本で、粘り強さと勢いが武器。目標は1994年以来の決勝トーナメント進出。",
    },
    fifaRank: 61,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  ury: {
    nickname: { en: "La Celeste", ja: "ラ・セレステ" },
    confederation: "CONMEBOL",
    description: {
      en: "Two-time champions and a true tradition-rich power. Now transitioning from Suárez and Cavani to Federico Valverde, Darwin Núñez and Ronald Araújo. Under Marcelo Bielsa they press aggressively to win the ball back high. The target is the quarterfinals, with a deep semifinal run as the upside.",
      ja: "W杯2度優勝の伝統国。Luis Suárez、Edinson Cavani世代から、Federico Valverde、Darwin Núñez、Ronald Araújoらの世代へ移行している。Marcelo Bielsa体制では前から奪いにいく強度の高いチームになっている。目標はベスト8以上、上振れすればベスト4も狙える。",
    },
    fifaRank: 17,
    wcAppearances: 14,
    wcTitles: 2,
    lastWcResult: { year: 2022, round: "Group" },
  },

  // ============================
  // Group I
  // ============================
  fra: {
    nickname: { en: "Les Bleus", ja: "レ・ブルー" },
    confederation: "UEFA",
    description: {
      en: "Champions in 2018 and runners-up in 2022—the most consistent recent World Cup nation. Kylian Mbappé heads a deep squad with world-class players in every line. Generations are turning while the talent pool remains overwhelming. They are an obvious title contender; the goal is a third World Cup crown.",
      ja: "2018年優勝、2022年準優勝と、近年のW杯で最も安定している強豪の一つ。Kylian Mbappéを中心に、攻撃、守備、中盤すべてに世界級の選手が揃う。世代交代を進めながらも選手層は極めて厚く、明確な優勝候補。目標は3度目のW杯制覇。",
    },
    fifaRank: 1,
    wcAppearances: 17,
    wcTitles: 2,
    lastWcResult: { year: 2022, round: "Final" },
  },
  sen: {
    nickname: { en: "Lions of Teranga", ja: "テランガのライオン" },
    confederation: "CAF",
    description: {
      en: "Reached the quarterfinals in 2002 and remain Africa's most consistent World Cup performer. Physicality, defensive intensity and pace up front are the calling cards, blending the experience of Sadio Mané and Kalidou Koulibaly with younger Europe-based talent. The target is escaping the group, with another 2002-style run on the table.",
      ja: "2002年大会でベスト8に進んだアフリカの強豪。近年もアフリカの中では安定感が高く、フィジカル、守備強度、前線のスピードを兼ね備える。Sadio Mané、Kalidou Koulibaly世代の経験に加え、若い欧州組もいる。目標はグループ突破と、2002年級の躍進。",
    },
    fifaRank: 14,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  irq: {
    nickname: { en: "Lions of Mesopotamia", ja: "メソポタミアのライオン" },
    confederation: "AFC",
    description: {
      en: "Returning to the World Cup for the first time since 1986—a near-40-year gap. Long absent from the world stage, Iraq are back having battled through qualifying. Aymen Hussein leads a side strong on resilient defending, set pieces and aerial play. Targets are a maiden World Cup win and points on the board.",
      ja: "1986年以来、40年ぶりのW杯復帰。長く本大会から遠ざかっていたが、今回は予選を勝ち抜いて世界舞台に戻ってきた。Aymen Husseinを中心に、粘り強い守備、セットプレー、前線の高さが武器になる。目標はW杯初勝利と勝ち点獲得。",
    },
    fifaRank: 57,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1986, round: "Group" },
  },
  nor: {
    nickname: { en: "Drillos", ja: "ドリロス" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since 1998. Erling Haaland and Martin Ødegaard form a world-class attacking spine—on individual quality alone, Norway can challenge the top sides. After a long absence, this is a major moment for the nation; the target is a first-ever knockout-round berth.",
      ja: "1998年以来のW杯復帰。Erling HaalandとMartin Ødegaardという世界級の攻撃軸を持ち、個の破壊力だけなら強豪国にも通用する。長く本大会から遠ざかっていたため、国としても大きな復帰になる。目標は初の決勝トーナメント進出。",
    },
    fifaRank: 31,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 1998, round: "R16" },
  },

  // ============================
  // Group J
  // ============================
  arg: {
    nickname: { en: "La Albiceleste", ja: "ラ・アルビセレステ" },
    confederation: "CONMEBOL",
    description: {
      en: "Defending champions. With Lionel Messi at the heart, Argentina won their long-awaited title in 2022 and now arrive chasing back-to-back. Lautaro Martínez, Julián Álvarez, Enzo Fernández and Alexis Mac Allister give the side a deep mid-prime core. The story is Messi's condition and the generational handover; the target is the title.",
      ja: "前回2022年大会の王者。Lionel Messiを中心に悲願の優勝を果たし、今回は連覇を狙う立場で大会に入る。Lautaro Martínez、Julián Álvarez、Enzo Fernández、Alexis Mac Allisterら中堅世代も充実しており、チームの完成度は高い。焦点はMessiのコンディションと世代交代のバランスで、目標は当然優勝。",
    },
    fifaRank: 3,
    wcAppearances: 18,
    wcTitles: 3,
    lastWcResult: { year: 2022, round: "W" },
  },
  dza: {
    nickname: { en: "Les Fennecs", ja: "レ・フェネック" },
    confederation: "CAF",
    description: {
      en: "Reached the round of 16 in 2014 and pushed Germany into extra time—a result that still defines them. Technical attackers and North African resilience are their identity. The Mahrez generation is past its peak with a new wave emerging; the target is a first knockout berth since 2014.",
      ja: "2014年大会ではベスト16に進み、延長戦までドイツを苦しめた印象が強い。テクニックのある攻撃陣と、北アフリカらしい粘り強さが特徴。Riyad Mahrez世代のピークは過ぎつつあるが、新しい世代への移行も進んでいる。目標は2014年以来のグループ突破。",
    },
    fifaRank: 28,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "R16" },
  },
  aut: {
    nickname: { en: "Das Team", ja: "ダス・ティーム" },
    confederation: "UEFA",
    description: {
      en: "First World Cup since 1998. Under Ralf Rangnick, Austria have built around high pressing and intense work rate, drawing real attention at Euro 2024 with their performances. The collective is well coached and polished. After a long absence, the target is a knockout-round berth.",
      ja: "1998年以来のW杯復帰。近年はRalf Rangnick体制で評価を上げ、高い位置からのプレスと運動量を武器にしている。EURO 2024でも内容面で注目され、チームとしての完成度は高い。久々の本大会で、目標はまず決勝トーナメント進出。",
    },
    fifaRank: 24,
    wcAppearances: 7,
    wcTitles: 0,
    lastWcResult: { year: 1998, round: "Group" },
  },
  jor: {
    nickname: { en: "Al-Nashama", ja: "アル＝ナシャマ" },
    confederation: "AFC",
    description: {
      en: "First-ever World Cup. Built momentum at the Asian Cup with a counter-attacking style; Mousa Al-Tamari leads the front line with pace and resilience defining the team. As a debutant nation, the goals are a first World Cup point and, if possible, a first win.",
      ja: "国として初のW杯出場。近年はアジアカップで存在感を高め、守備から速く攻めるスタイルで評価を上げてきた。Mousa Al-Tamariらを中心に、前線のスピードと粘り強い守備が武器になる。初出場国としてまずは勝ち点獲得、可能なら初勝利が大きな目標。",
    },
    fifaRank: 63,
    wcAppearances: 0,
    wcTitles: 0,
  },

  // ============================
  // Group K
  // ============================
  prt: {
    nickname: { en: "A Seleção das Quinas", ja: "セレソン・ダス・キナス" },
    confederation: "UEFA",
    description: {
      en: "Transitioning from the Cristiano Ronaldo era to a deep generation led by Bruno Fernandes, Bernardo Silva, Rafael Leão and Vitinha, with Rúben Dias and Diogo Costa behind them. Among Europe's most talent-rich attacks, with countless options going forward. The questions are rotation discipline and tournament-long defensive consistency; the goal is a first World Cup title.",
      ja: "Cristiano Ronaldoの時代から、Bruno Fernandes、Bernardo Silva、Rafael Leão、Vitinhaらを中心とする厚い世代へ移っている。Rúben Dias、Diogo Costaが後方を支え、タレント量では欧州トップ級で攻撃の選択肢は非常に多い。課題はスター選手の使い分けと、大会を通した守備の安定。目標は国として初のW杯優勝。",
    },
    fifaRank: 5,
    wcAppearances: 8,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "QF" },
  },
  cod: {
    nickname: { en: "Léopards", ja: "レオパール" },
    confederation: "CAF",
    description: {
      en: "Returning to the World Cup for the first time since 1974, when they appeared as Zaire—a major milestone for the modern DRC. Yoane Wissa and Cédric Bakambu lead a vertically aggressive attack defined by athleticism. After a long absence, the targets are a first World Cup win and points on the board.",
      ja: "1974年以来のW杯復帰。当時はザイールとして出場しており、現在のDRコンゴとしては非常に大きな節目になる。Yoane Wissa、Cédric Bakambuらを中心に、身体能力と縦への推進力が特徴。長い空白を経た復帰だけに、まずは勝ち点獲得と初勝利が目標。",
    },
    fifaRank: 46,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1974, round: "Group" },
  },
  uzb: {
    nickname: { en: "White Wolves", ja: "ホワイトウルブス" },
    confederation: "AFC",
    description: {
      en: "Long the perennial near-miss of Asian qualifying, Uzbekistan are finally on the World Cup stage. A landmark moment for Central Asian football and a true milestone for the country. Eldor Shomurodov and Abbosbek Fayzullaev are central, with defensive discipline and midfield grit defining the side. As a debutant they can aim beyond merely earning points.",
      ja: "長年アジア予選であと一歩届かなかったが、ついに初のW杯出場を決めた。中央アジア勢としても大きな意味を持つ出場で、国としての節目になる。Eldor Shomurodov、Abbosbek Fayzullaevらが中心で、守備の規律と中盤の粘りが特徴。初出場ながら、勝ち点獲得以上を狙えるチーム。",
    },
    fifaRank: 50,
    wcAppearances: 0,
    wcTitles: 0,
  },
  col: {
    nickname: { en: "Los Cafeteros", ja: "ロス・カフェテロス" },
    confederation: "CONMEBOL",
    description: {
      en: "With James Rodríguez at the heart, Colombia reached the quarterfinals in 2014 and the round of 16 in 2018. They missed 2022 entirely, so this is a comeback campaign. Luis Díaz, Jhon Arias and James offer attacking flair; the target is escaping the group, with the quarterfinals as upside.",
      ja: "2014年大会ではJames Rodríguezを中心にベスト8へ進み、世界に強い印象を残した。2018年もベスト16まで進んだが、2022年は出場を逃したため、今回は復帰の大会になる。Luis Díaz、Jhon Arias、James Rodríguezら攻撃の個は魅力的。目標はグループ突破、上振れすればベスト8。",
    },
    fifaRank: 13,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "R16" },
  },

  // ============================
  // Group L
  // ============================
  eng: {
    nickname: { en: "Three Lions", ja: "スリー・ライオンズ" },
    confederation: "UEFA",
    description: {
      en: "Recent years have stacked up World Cup semifinals and Euro final runs without lifting silverware. Harry Kane, Jude Bellingham and Bukayo Saka head one of the best attacks in the world. A near-golden generation arrives with the highest of expectations; the goal is a first World Cup since 1966.",
      ja: "近年はW杯ベスト4、EURO決勝進出など結果を積み上げているが、タイトルには届いていない。Harry Kane、Jude Bellingham、Bukayo Sakaらを擁し、攻撃陣は世界最高級。黄金世代に近い陣容で、期待値は非常に高い。目標は1966年以来のW杯優勝。",
    },
    fifaRank: 4,
    wcAppearances: 16,
    wcTitles: 1,
    lastWcResult: { year: 2022, round: "QF" },
  },
  hrv: {
    nickname: { en: "Vatreni", ja: "ヴァトレニ" },
    confederation: "UEFA",
    description: {
      en: "2018 finalists and 2022 third-place finishers, with extraordinary recent tournament resilience. The Modrić era is winding down, but technique in midfield and game management remain. Outsized results for a country of this size; the goal is to grind through another knockout run and push for a deep finish.",
      ja: "2018年準優勝、2022年3位と、近年のW杯で驚異的な勝負強さを見せている国。Luka Modrić世代は終盤だが、中盤の技術と試合運びのうまさは健在。人口規模を考えると異常なほど安定して結果を残してきた。目標は再び決勝トーナメントで粘り、上位進出を狙うこと。",
    },
    fifaRank: 11,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "3rd" },
  },
  gha: {
    nickname: { en: "Black Stars", ja: "ブラックスターズ" },
    confederation: "CAF",
    description: {
      en: "Reached the quarterfinals in 2010 and came within one penalty of becoming the first African nation to make a World Cup semifinal. Athleticism, vertical speed and individual flair up front are strengths, though consistency has been a recent issue. Thomas Partey, Iñaki Williams and Antoine Semenyo lead the attack; the goal is escaping the group, ideally another 2010-style run.",
      ja: "2010年大会でベスト8まで進み、アフリカ勢初のベスト4にあと一歩まで迫った国。身体能力、縦への速さ、前線の個の力が武器だが、近年は安定感に課題もある。Thomas Partey、Iñaki Williams、Antoine Semenyoらが攻撃の中心になる。目標はグループ突破、理想は2010年のような躍進。",
    },
    fifaRank: 74,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  pan: {
    nickname: { en: "La Marea Roja", ja: "ラ・マレア・ロハ" },
    confederation: "CONCACAF",
    description: {
      en: "Back at the World Cup for the first time since 2018. Their first appearance ended in heavy losses but provided invaluable experience. Defensive organization, resilience and grinding low-scoring games are their style. Targets are a first World Cup point and, ideally, a first win.",
      ja: "2018年以来のW杯出場。前回大会では初出場ながら世界の強豪と戦い、結果は厳しかったが国として大きな経験を得た。組織的な守備、粘り強さ、ロースコアに持ち込む戦い方が特徴。目標はW杯初勝ち点、可能なら初勝利。",
    },
    fifaRank: 33,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "Group" },
  },
};

/**
 * teamId（"wc-jpn" 形式）からプロフィールを引く。
 * 未登録は null。
 */
export function getWcTeamProfile(
  teamId: string | null | undefined,
): WcTeamProfile | null {
  if (!teamId || !teamId.startsWith("wc-")) return null;
  const iso3 = teamId.slice(3).toLowerCase();
  return WC_TEAM_PROFILES[iso3] ?? null;
}

/**
 * 表示用ヘルパー: 直近大会の到達ラウンドを言語別ラベルに。
 */
export function formatWcRoundReached(
  round: WcRoundReached,
  language: "ja" | "en",
): string {
  if (language === "en") {
    switch (round) {
      case "Group":
        return "Group Stage";
      case "R16":
        return "Round of 16";
      case "QF":
        return "Quarterfinals";
      case "SF":
        return "Semifinals";
      case "3rd":
        return "3rd Place";
      case "Final":
        return "Runner-up";
      case "W":
        return "Champions";
    }
  }
  switch (round) {
    case "Group":
      return "グループステージ敗退";
    case "R16":
      return "ベスト16";
    case "QF":
      return "ベスト8";
    case "SF":
      return "ベスト4";
    case "3rd":
      return "3位";
    case "Final":
      return "準優勝";
    case "W":
      return "優勝";
  }
}

/**
 * 表示用ヘルパー: 大陸連盟ラベル（フルスペル / 略称）。
 */
export function formatWcConfederation(
  c: WcConfederation,
  language: "ja" | "en",
): string {
  if (language === "en") {
    switch (c) {
      case "AFC":
        return "AFC (Asia)";
      case "CAF":
        return "CAF (Africa)";
      case "CONCACAF":
        return "CONCACAF (North & Central America)";
      case "CONMEBOL":
        return "CONMEBOL (South America)";
      case "OFC":
        return "OFC (Oceania)";
      case "UEFA":
        return "UEFA (Europe)";
    }
  }
  switch (c) {
    case "AFC":
      return "AFC（アジア）";
    case "CAF":
      return "CAF（アフリカ）";
    case "CONCACAF":
      return "CONCACAF（北中米カリブ）";
    case "CONMEBOL":
      return "CONMEBOL（南米）";
    case "OFC":
      return "OFC（オセアニア）";
    case "UEFA":
      return "UEFA（ヨーロッパ）";
  }
}
