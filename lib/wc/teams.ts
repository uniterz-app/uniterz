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
      en: "A World Cup regular who reached the round of 16 at seven straight tournaments from 1994 through 2018. They exited in the group stage in 2022, so they no longer carry the same aura of inevitability. Their only quarterfinal runs came as hosts in 1970 and 1986. As co-hosts again, whether they can break the quarterfinal barrier is the central storyline. The team prioritizes pressing, intensity and quick transitions over possession.",
      ja: "W杯常連国で、1994年から2018年まで7大会連続でベスト16に進出してきた安定国。ただし2022年はグループ敗退に終わり、以前ほどの絶対感はない。過去のベスト8は1970年、1986年の自国開催時のみ。今回は開催国として、再びベスト8の壁を破れるかが最大テーマ。チームはポゼッションよりも、プレス、強度、素早い切り替えを軸に戦う。",
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
      en: "Returning to the World Cup for the first time since 2010. Their previous appearance came as hosts, so qualifying on merit this time carries real weight. After a dip in form, Hugo Broos has led a rebuild that saw them edge out Nigeria to reach the tournament. A domestic-based core—especially the Mamelodi Sundowns bloc—brings cohesion; they defend as a unit and counter quickly. The target is a first-ever knockout-stage berth.",
      ja: "2010年大会以来のW杯復帰。前回は開催国としての出場だったため、今回は予選を突破して戻ってきた意味が大きい。近年は低迷もあったが、ヒューゴ・ブロース体制で再建が進み、ナイジェリアを上回って本大会出場を決めた。国内リーグ所属選手、特にマメロディ・サンダウンズ勢を中心にした連携と結束力が特徴で、戦い方は組織的な守備からのカウンターが軸。目標は国として初の決勝トーナメント進出。",
    },
    fifaRank: 60,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "Group" },
  },
  kor: {
    nickname: { en: "Taegeuk Warriors", ja: "太極戦士" },
    confederation: "AFC",
    description: {
      en: "One of Asia's foremost World Cup nations, making their 12th finals appearance. They reached the semifinals at home in 2002 but have not gone past the round of 16 since. Son Heung-min, Kim Min-jae, Lee Kang-in and Hwang Hee-chan head a Europe-experienced core whose pace and individual quality drive the attack. Fitness and tactical cohesion among the key players remain concerns; the goal is escaping the group and a knockout-round berth.",
      ja: "アジア屈指のW杯常連国で、今大会が通算12回目の出場。2002年大会ではベスト4まで進んだが、その後はベスト16の壁を越えられていない。Son Heung-min、Kim Min-jae、Lee Kang-in、Hwang Hee-chanら欧州経験豊富な選手が中心で、前線のスピードと個の打開力が武器。ただし主力のコンディションやシステム面には不安もあり、今大会の目標はグループ突破とベスト16以上。",
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
      en: "First World Cup as the Czech Republic in 20 years, since 2006. Czechoslovakia finished runners-up in 1934 and 1962, but for the modern Czech side this is a long-awaited return. A pragmatic style built on a tight defense, physicality, set pieces and aerial duels. Tomáš Souček, Ladislav Krejčí and Patrik Schick lead a side that values organization and resilience over flair. The goal is escaping the group and reasserting the nation among Europe's mid-tier sides.",
      ja: "チェコ共和国としては2006年以来、20年ぶりのW杯出場。旧チェコスロバキア時代には1934年、1962年に準優勝しているが、現在のチェコとしては久々の本大会になる。堅い守備、フィジカル、空中戦、セットプレーを軸にした現実的な戦い方が特徴。Tomáš Souček、Ladislav Krejčí、Patrik Schickらを中心に、派手さよりも組織力と勝負強さで戦う。目標はグループ突破と、欧州中堅国としての存在感を示すこと。",
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
      en: "They returned to the World Cup in 2022 after 36 years but exited with three straight losses and a sobering sense of the gap at this level. As co-hosts they can count on home backing. Jonathan David, Tajon Buchanan and Stephen Eustáquio supply pace and drive; if Alphonso Davies hits top form, he becomes a major weapon. Targets are a first World Cup win for Canada and a maiden knockout berth.",
      ja: "2022年大会で36年ぶりにW杯へ戻ったが、3連敗で大会を終え、世界との差を痛感した。今回は開催国として出場し、ホームの後押しを受けられる立場にある。Jonathan David、Tajon Buchanan、Stephen Eustáquioらを中心にスピードと推進力は高く、Alphonso Daviesの状態が上がれば大きな武器になる。目標はカナダ代表としてのW杯初勝利と、初の決勝トーナメント進出。",
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
      en: "First World Cup since 2014. The golden generation built around Edin Džeko still defines the country's image, but Sergej Barbarez is shaping a new team. The 40-year-old Džeko remains a spiritual leader while younger and overseas-based players join a side still in rebuild mode. Intense defending, fast vertical attacks and quick transitions are the hallmarks. The goal is a first-ever knockout-round berth.",
      ja: "2014年以来のW杯出場。Edin Džekoを中心とした黄金世代の印象が強い国だが、現在はSergej Barbarez監督のもとで新しいチームへ移行している。40歳のDžekoが精神的支柱として残る一方、若手や国外育ちの選手も加わり、チームは再建期にある。戦い方は激しい守備、縦に速い攻撃、切り替えの速さが軸。目標は国として初の決勝トーナメント進出。",
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
      en: "They debuted as hosts in 2022 but lost all three games. Qualifying on merit this time gives the campaign a different meaning. Much of the Asian Cup–winning core remains, with Akram Afif and Almoez Ali leading the attack and long-standing cohesion a strength. The question is whether a domestic-league-heavy squad can handle World Cup intensity; the first targets are a maiden point and win.",
      ja: "2022年大会では開催国として初出場したが、3連敗で厳しい結果に終わった。今回は予選を突破して本大会に出る形で、前回とは意味が違う。アジアカップを制した主力を多く残し、Akram Afif、Almoez Aliを中心とした攻撃と、長く一緒に戦ってきた組織力が特徴。課題は国内リーグ中心の選手たちが、W杯本大会の強度に対応できるか。まずは初勝ち点と初勝利が目標。",
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
      en: "Not a star-studded side, but a European team that rarely collapses on the big stage. They beat France at Euro 2020 and impressed again at Euro 2024. Granit Xhaka, Manuel Akanji and Gregor Kobel anchor steady defensive organization, game management and experience. At the World Cup, however, they have been stuck at the round of 16 in recent years—breaking that ceiling is the theme. The goal is escaping the group, with the quarterfinals as upside.",
      ja: "派手なスター軍団ではないが、国際大会で大崩れしない欧州の安定勢力。EURO 2020ではフランスを破り、EURO 2024でも存在感を見せた。Granit Xhaka、Manuel Akanji、Gregor Kobelらを中心に、守備組織、試合運び、経験値が安定している。一方でW杯では近年ベスト16止まりが続いており、今大会はその壁を破れるかがテーマ。目標はグループ突破、上振れすればベスト8。",
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
      en: "The only nation to have appeared at every World Cup and five-time champions. They have not won the title since 2002 and have looked uneven in recent CONMEBOL qualifying. Vinícius Júnior, Neymar and Raphinha headline one of the world's best attacks, backed by experienced figures such as Bruno Guimarães, Casemiro, Marquinhos and Alisson. Neymar's fitness, mobility around Casemiro and overall cohesion remain concerns. The goal is a sixth crown.",
      ja: "唯一すべてのW杯に出場している最多5回優勝国。2002年以降は優勝から遠ざかっており、近年は南米予選でも不安定さを見せた。Vinícius Júnior、Neymar、Raphinhaら攻撃陣の個の力は世界最高級で、Bruno Guimarães、Casemiro、Marquinhos、Alissonら経験ある選手も揃う。ただしNeymarのコンディション、Casemiro周辺の機動力、チームとしてのまとまりには不安もある。目標は6度目の優勝。",
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
      en: "In 2022 they beat Belgium, Spain and Portugal to become the first African nation to reach a World Cup semifinal. Achraf Hakimi and Sofyan Amrabat anchor a side built on defensive intensity, duels and sharp counters. Brahim Díaz and Ismael Saibari add more attacking options than in Qatar. They are no longer a surprise package and enter as a side to fear from the start. The aim is the quarterfinals or better, ideally another semifinal run.",
      ja: "2022年大会ではベルギーを破り、スペインとポルトガルも倒して、アフリカ勢初のベスト4入りを果たした。Achraf Hakimi、Sofyan Amrabatを中心に、守備強度、球際、カウンターの鋭さが武器。さらにBrahim DíazやIsmael Saibariら攻撃的なタレントも加わり、前回よりも攻撃の選択肢は増えている。今回はもうサプライズ枠ではなく、最初から警戒される強豪として大会に入る。目標はベスト8以上、理想は再びベスト4。",
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
      en: "A first World Cup in 52 years, since 1974. Merely returning is a major story for a nation that has been away so long. The squad features many diaspora players based in Europe and North America, with pace, vertical drive and sharp counters as strengths. A recent 4-0 friendly win over New Zealand showed momentum, but holding up defensively against Brazil, Morocco and Scotland is the test. Targets are a first point and first win.",
      ja: "1974年以来、52年ぶりのW杯復帰。長い空白を経て本大会に戻ってきた国で、出場自体に大きなストーリーがある。チームは欧州や北米でプレーするディアスポラ選手を多く含み、個のスピード、縦への推進力、カウンターの鋭さが武器。直近の強化試合でもニュージーランドを4-0で破り、勢いはある。ただしブラジル、モロッコ、スコットランド相手に守備をどこまで保てるかが課題。目標は初勝ち点と初勝利。",
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
      en: "First World Cup since 1998. They have never advanced from the group stage, and that remains the headline obstacle. Andy Robertson's leadership, Scott McTominay's goals and the work rate of John McGinn and Lewis Ferguson underpin a side that wins through duels, hard running and set pieces. They are not flashy, but tough to break down. The target is a first-ever knockout-round berth.",
      ja: "1998年以来のW杯復帰。過去のW杯では一度もグループ突破がなく、今回もそこが最大の壁になる。Andy Robertsonのリーダーシップ、Scott McTominayの得点力、John McGinnやLewis Fergusonの運動量を軸に、球際、ハードワーク、セットプレーで勝負するチーム。派手さはないが、粘り強く試合を壊さない強さがある。目標は国として初の決勝トーナメント進出。",
    },
    fifaRank: 43,
    wcAppearances: 8,
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
      en: "Co-hosts carrying major expectations on home soil. Christian Pulisic, Weston McKennie, Gio Reyna, Folarin Balogun and Tyler Adams head a Europe-based core that may be the deepest squad the country has assembled. They lost to the Netherlands in the 2022 round of 16 and still looked a step below the elite. Under Mauricio Pochettino, midfield intensity and individual quality up front are strengths, but centre-back depth and defensive stability are concerns. The target is the quarterfinals or better for the first time since 2002.",
      ja: "開催国の一つで、今回はホーム大会として大きな期待を背負う。Christian Pulisic、Weston McKennie、Gio Reyna、Folarin Balogun、Tyler Adamsら欧州組が中心で、選手層は過去最高級に近い。2022年はベスト16でオランダに敗れ、まだ上位国との差も見えた。Mauricio Pochettino体制では中盤の強度と前線の個の力が武器になる一方、CBの層や守備の安定には不安もある。今回はベスト16ではなく、2002年以来のベスト8以上が目標になる。",
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
      en: "First World Cup since 2010. Traditionally strong in defensive grit, duels, physicality and collective intensity, Gustavo Alfaro has steered them back to basics. They usually set up in a 4-4-2, defend first and rely on Julio Enciso, Miguel Almirón and Diego Gómez to convert limited chances. They reached the quarterfinals in 2010 and pushed Spain hard. After a long absence, the goal is a knockout berth on the back of organized defending.",
      ja: "2010年以来のW杯復帰。伝統的に守備の粘り、球際、フィジカル、集団としての強度に強みがある国で、Gustavo Alfaro監督の下で原点回帰した。基本は4-4-2を軸に、まず守備を固め、少ないチャンスをJulio Enciso、Miguel Almiron、Diego Gomezらの個で生かす形。2010年にはベスト8まで進み、スペインを苦しめた実績もある。久々の本大会で、目標は堅守を武器にしたグループ突破。",
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
      en: "A regular at every World Cup since 2006 and one of Asia's most stable sides. They reached the round of 16 in 2022 and pushed Argentina close. Under Tony Popovic they base play on a back three, emphasizing defensive organization and physicality to drag games tight. Height, set pieces and discipline are strengths, with young pace from Nestory Irankunda and Jordan Bos adding thrust. The realistic goal is another knockout-round appearance.",
      ja: "2006年以降は継続してW杯に出場しているアジアの安定勢力。2022年大会ではベスト16まで進み、アルゼンチン相手にも粘りを見せた。Tony Popovic体制では3バックをベースに守備組織とフィジカル強度を高め、接戦に持ち込む戦い方が基本。高さ、セットプレー、規律に加え、Nestory IrankundaやJordan Bosら若手の推進力も武器になる。今回も現実的な目標は決勝トーナメント進出。",
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
      en: "Their first World Cup in 24 years after finishing third in 2002. A wave of young, attack-minded talent has emerged, and under Vincenzo Montella they carry momentum from Euro 2024. Hakan Çalhanoğlu anchors midfield, with Arda Güler, Kenan Yıldız, Orkun Kökçü and Ferdi Kadıoğlu at the heart of the side. Creativity and explosiveness are strengths, but the lack of a proven No. 9 is a concern. The target is escaping the group.",
      ja: "2002年大会で3位に入って以来、24年ぶりのW杯出場。近年は若くて攻撃的なタレントが増えており、Vincenzo Montella監督の下でEURO 2024から続く勢いを持つチームになっている。Hakan Çalhanoğluが中盤の軸となり、Arda Güler、Kenan Yıldız、Orkun Kökçü、Ferdi Kadıoğluらが中心になる。創造性と爆発力はある一方、絶対的な9番がいない点は課題。目標は久々の本大会でのグループ突破。",
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
      en: "Four-time World Cup champions but eliminated in the group stage at both 2018 and 2022. Jamal Musiala and Florian Wirtz supply high-end creativity, with experienced figures such as Joshua Kimmich and Manuel Neuer still in the mix. Julian Nagelsmann is tasked with restoring the national team, but defensive stability, late-game composure and the right No. 9 remain open questions. The realistic target is the quarterfinals, with title contention as the ceiling.",
      ja: "W杯4度優勝の伝統国だが、2018年、2022年は連続でグループステージ敗退に終わった。Jamal Musiala、Florian Wirtzを中心に創造性は高く、Joshua Kimmich、Manuel Neuerら経験ある選手も残る。Julian Nagelsmann体制で名門復活を狙うが、守備の安定、試合終盤の勝負強さ、CFの最適解は課題。目標は最低でもベスト8、理想は優勝争い。",
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
      en: "Still associated with the Drogba era, they have regained momentum after winning the Africa Cup of Nations and are building around a new generation. They have failed to escape their group in three previous World Cups. Simon Adingra, Amad Diallo and Nicolas Pépé provide individual quality up front, with Franck Kessié and Ibrahim Sangaré adding midfield intensity. Under Emerse Faé they are more than just athletic—a more organized side. The goal is a first-ever knockout berth.",
      ja: "Drogba世代の印象が強い国だが、現在はAFCON優勝を経て、新しい世代で再び力をつけている。過去3度のW杯ではすべてグループステージ敗退で、まだ決勝トーナメント進出がない。Simon Adingra、Amad Diallo、Nicolas Pépéら前線の個に加え、Franck Kessié、Ibrahim Sangaréら中盤の強度も武器。Emerse Faé体制で、身体能力だけでなく組織力もあるチームになっている。目標は国として初のグループ突破。",
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
      en: "A young, intense South American side trending upward. They beat Qatar in their 2022 opener but failed to advance. Moisés Caicedo is the midfield engine, backed by a strong defensive spine in Piero Hincapié, Willian Pacho and Pervis Estupiñán, with young talent in Kendry Páez and experience from Enner Valencia. The target is the round of 16 or better, with the quarterfinals as upside.",
      ja: "近年の南米で評価を上げている、若くて強度の高いチーム。2022年大会では開幕戦でカタールを破ったが、グループ突破には届かなかった。Moisés Caicedoが中盤のエンジンで、Piero Hincapié、Willian Pacho、Pervis Estupiñánらを擁する守備陣も大きな強み。さらにKendry Páezのような若い才能、Enner Valenciaの経験もある。目標はベスト16以上で、上振れすればベスト8も狙える。",
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
      en: "A first World Cup and a historic feat for a small Caribbean nation. Many players have Dutch roots, with Europe-based figures such as Tahith Chong and Leandro Bacuna at the core. The fact that 78-year-old Dick Advocaat is in charge is a story in itself—experience and discipline are strengths. They are arguably the weakest side in the group on paper; the target is a first point and a memorable debut.",
      ja: "初のW杯出場で、カリブ海の小国として歴史的な快挙。オランダ系のルーツを持つ選手が多く、Tahith Chong、Leandro Bacunaら欧州経験のある選手が中心になる。78歳のDick Advocaatが率いる点も大きな話題で、経験と規律を持ち込めるのは強み。ただしグループ内では戦力的に最も厳しい立場で、目標は勝ち点獲得と、初出場国として爪痕を残すこと。",
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
      en: "Three-time finalists without a World Cup title. They lost to Argentina on penalties in the 2022 quarterfinals. Virgil van Dijk anchors the defense, Frenkie de Jong the midfield, with individual quality up front from Memphis Depay and Donyell Malen. Ronald Koeman is chasing a long-awaited first crown, but Frenkie's fitness and attacking explosiveness are concerns. The goal is the quarterfinals or better, with the title as the ceiling.",
      ja: "W杯優勝はないが、準優勝3回の強豪国。2022年大会ではベスト8でアルゼンチンにPK戦で敗れた。Virgil van Dijkを中心とした守備、Frenkie de Jongの中盤、Memphis DepayやDonyell Malenら前線の個が軸になる。Ronald Koeman体制で悲願の初優勝を狙うが、Frenkieのコンディションや攻撃の爆発力には不安もある。目標はベスト8以上、理想は初優勝。",
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
      en: "They stunned the world in 2022 by beating Germany and Spain to top their group, but lost to Croatia on penalties in the round of 16 and again fell short of a first quarterfinal. Captain Ko Itakura now leads a Europe-based core of Zion Suzuki, Takefusa Kubo, Daichi Kamada, Ritsu Doan and Ayase Ueda after Wataru Endo's injury withdrawal, with Shuto Machino called up as his replacement. Without Kaoru Mitoma, Keito Nakamura, Kubo and Doan are the main attacking options. They can break teams down with the ball as well as on the counter; the goal is a first-ever quarterfinal run.",
      ja: "前回の2022年大会ではドイツとスペインを倒してグループ首位通過を果たし、世界に大きな衝撃を与えた。一方で、決勝トーナメント1回戦ではクロアチアにPK戦で敗れ、またしてもベスト8の壁を越えられなかった。遠藤航の離脱後、主将の板倉滉を軸に、鈴木彩艶、久保建英、鎌田大地、堂安律、上田綺世ら欧州組が中心。代わりに町野修斗が追加招集された。三笘薫不在なら、中村敬斗、久保、堂安が攻撃の主役候補になる。速攻だけでなく、ボールを持って崩す力も上がっており、目標は日本サッカー初のベスト8以上。",
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
      en: "First World Cup since 2018. Beyond the Ibrahimović era, Alexander Isak, Viktor Gyökeres and Anthony Elanga form a very high-quality front line. Under Graham Potter, how to fit that attacking talent together is a major theme. Height, physicality and vertical speed are strengths, with experienced defenders such as Victor Lindelöf, but overall defensive stability is a concern. The target is a knockout berth, with the round of 16 as upside.",
      ja: "2018年以来のW杯復帰。Zlatan Ibrahimović後の世代に移り、Alexander Isak、Viktor Gyökeres、Anthony Elangaら前線の質は非常に高い。Graham Potter体制で、前線のタレントをどう共存させるかが大きなテーマになる。高さ、フィジカル、縦への速さに加え、Victor Lindelöfら経験ある守備陣もいるが、チーム全体の守備安定は課題。目標は決勝トーナメント進出、上振れすればベスト16以上。",
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
      en: "A steady North African World Cup regular. They beat France in 2022 but failed to advance. Under Sabri Lamouchi, defensive organization is a strength—they qualified without conceding. Creative attacking play and goals remain concerns; whether Hannibal Mejbri and others can make the difference is key. The goal is a long-awaited first knockout-round berth.",
      ja: "W杯常連になりつつある北アフリカの堅実なチーム。2022年大会ではフランスを破ったが、グループ突破には届かなかった。Sabri Lamouchi体制では守備組織が強みで、予選を無失点で突破した点は大きい。一方で、攻撃の創造性と得点力は課題で、Hannibal Mejbriらがどこまで違いを作れるかが鍵になる。目標は悲願の初グループ突破。",
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
      en: "The golden generation that finished third in 2018 has passed its peak and Belgium are in transition. The challenge is blending experienced figures such as Kevin De Bruyne, Romelu Lukaku and Thibaut Courtois with a new wave including Jérémy Doku, Amadou Onana and Charles De Ketelaere. They are no longer overwhelming title favorites, but individual quality and experience remain high. The target is a knockout berth, with the quarterfinals as upside.",
      ja: "2018年大会で3位に入った黄金世代はピークを過ぎ、現在は移行期にある。Kevin De Bruyne、Romelu Lukaku、Thibaut Courtoisら経験ある選手に、Jeremy Doku、Amadou Onana、Charles De Ketelaereら新しい世代をどう組み合わせるかがテーマ。以前ほど圧倒的な優勝候補ではないが、個の力と経験値はまだ高い。目標は決勝トーナメント進出、上振れすればベスト8以上。",
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
      en: "African Cup of Nations heavyweights yet to make a real World Cup mark. Mohamed Salah is the focal point, with Omar Marmoush and Trezeguet also key in attack. Under Hossam Hassan they will realistically defend deep and rely on individual quality up front. Their last appearance in 2018 ended in three straight losses, so both performance and results matter this time. The target is a first World Cup win and a first knockout-round berth.",
      ja: "アフリカネーションズカップでは強豪だが、W杯本大会ではまだ大きな結果を残せていない。Mohamed Salahが最大の注目選手で、Omar Marmoush、Trezeguetらも攻撃の重要な駒になる。Hossam Hassan体制では現実的に守備を固めながら、前線の個で得点を狙う形が基本。前回出場した2018年は3連敗で終わっており、今回は内容と結果の両方が求められる。目標はW杯初勝利と、国として初の決勝トーナメント進出。",
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
      en: "Asian heavyweights who have never advanced from the World Cup group stage. Mehdi Taremi, Alireza Jahanbakhsh, Saman Ghoddos, Saeid Ezatolahi and Alireza Beiranvand head an experienced core. They defend deep and lean on physicality and counters. Political concerns around tournament participation have been reported, but at present they remain in the field. The goal is a first-ever knockout berth.",
      ja: "アジア予選では安定して強いが、W杯本大会ではまだ決勝トーナメントに進んだことがない。Mehdi Taremi、Alireza Jahanbakhsh、Saman Ghoddos、Saeid Ezatolahi、Alireza Beiranvandら経験豊富な選手が中心。守備を固め、フィジカルとカウンターで勝負する形が基本になる。政治的な問題で大会参加を巡る懸念も報じられているが、現時点では出場国に含まれる。目標は国として初のグループ突破。",
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
      en: "First World Cup since 2010. They famously went unbeaten in three group games that year without winning any. Chris Wood leads a side built on height, physicality and defensive discipline, with overseas-based players such as Tyler Bindon, Marko Stamenic and Liberato Cacace—but they lack the depth of others in the group. A recent 4-0 friendly loss to Haiti highlighted defensive concerns. The goal is a first-ever World Cup win for the nation.",
      ja: "2010年以来のW杯出場。2010年大会では未勝利ながら無敗でグループステージを終えた珍しいチームだった。Chris Woodを中心に、高さ、フィジカル、守備の規律が特徴。Tyler Bindon、Marko Stamenic、Liberato Cacaceら海外組もいるが、タレント量では同組の国に劣る。直近の強化試合ではハイチに0-4で敗れており、守備の安定は大きな課題。目標は国としてのW杯初勝利。",
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
      en: "2010 champions rebuilding around young talent under Luis de la Fuente. Lamine Yamal, Pedri, Rodri, Nico Williams and Dani Olmo set the tempo with elite retention, counterpressing and wide threat. Since winning Euro 2024 they look like the next golden generation and enter as title contenders—but Yamal and Nico Williams need to be confirmed fit right before the tournament. The aim is a first crown since 2010.",
      ja: "2010年王者で、近年は若い才能を中心に再び強豪感を取り戻している。Luis de la Fuente体制の下、Lamine Yamal、Pedri、Rodri、Nico Williams、Dani Olmoらを中心に、保持力、即時奪回、サイドの突破力が高い。EURO 2024優勝以降、次の黄金世代に近い雰囲気があり、今大会でも優勝候補の一角。ただしYamalとNico Williamsには大会直前のコンディション確認が必要。目標は2010年以来のW杯制覇。",
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
      en: "A first World Cup and one of the symbolic debutants of 2026. A small nation with many Europe-based players; qualifying from Africa was itself a remarkable feat. Roberto Lopes, Logan Costa, Jamiro Monteiro and Ryan Mendes lead an experienced core built on defensive grit and quick attacking. The goal is a first point and a strong impression as a debutant.",
      ja: "初のW杯出場で、2026年大会の象徴的な初出場国の一つ。人口規模の小さい国ながら、欧州でプレーする選手を多く抱え、アフリカ予選を突破したこと自体が大きな快挙。Roberto Lopes、Logan Costa、Jamiro Monteiro、Ryan Mendesら経験ある選手を軸に、守備の粘りと速い攻撃で勝負する。目標は初勝ち点と、初出場国として強い印象を残すこと。",
    },
    fifaRank: 69,
    wcAppearances: 0,
    wcTitles: 0,
  },
  sau: {
    nickname: { en: "Green Falcons", ja: "緑の鷹" },
    confederation: "AFC",
    description: {
      en: "Reached the round of 16 in 1994 and beat champions Argentina in 2022 in one of the great World Cup upsets. Under Georgios Donis, Salem Al-Dawsari, Firas Al-Buraikan, Mohammed Kanno and Saud Abdulhamid are central. A domestic-league-heavy squad relies on resilient defending, work rate and quick transitions. The target is a first knockout berth since 1994.",
      ja: "1994年大会でベスト16に進んだ実績があるアジアの常連国。2022年大会では優勝国アルゼンチンを破り、大会最大級の番狂わせを起こした。今大会はGeorgios Donis体制で、Salem Al Dawsari、Firas Al Buraikan、Mohammed Kanno、Saud Abdulhamidらが中心。国内リーグ所属選手が多く、粘り強い守備、運動量、切り替えの速さが武器になる。目標は1994年以来の決勝トーナメント進出。",
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
      en: "Two-time World Cup champions in transition from the Suárez and Cavani era to a new generation led by Federico Valverde, Manuel Ugarte, Rodrigo Bentancur, Darwin Núñez and Ronald Araújo. Under Marcelo Bielsa they press high with intense midfield work rate and aggressive defending. The target is the quarterfinals, with a deep semifinal run as upside.",
      ja: "W杯2度優勝の伝統国。Luis Suárez、Edinson Cavani世代から、Federico Valverde、Manuel Ugarte、Rodrigo Bentancur、Darwin Núñez、Ronald Araújoらの世代へ移行している。Marcelo Bielsa体制では前から奪いにいく強度の高いチームになっており、中盤の運動量と守備のアグレッシブさが大きな武器。目標はベスト8以上、上振れすればベスト4も狙える。",
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
      en: "Champions in 2018 and runners-up in 2022—the most consistent recent World Cup nation. Kylian Mbappé leads a squad stocked with world-class talent such as Ousmane Dembélé, Aurélien Tchouaméni, Eduardo Camavinga and William Saliba in every line. Didier Deschamps is overseeing what may be the culmination of his tenure, with generational change underway but depth still overwhelming. They are clear title favourites; the goal is a third World Cup crown.",
      ja: "2018年優勝、2022年準優勝と、近年のW杯で最も安定している強豪の一つ。Kylian Mbappéを中心に、Ousmane Dembélé、Aurélien Tchouaméni、Eduardo Camavinga、William Salibaら各ポジションに世界級の選手が揃う。Didier Deschamps体制の集大成となる大会で、世代交代を進めながらも選手層は極めて厚い。明確な優勝候補で、目標は3度目のW杯制覇。",
    },
    fifaRank: 1,
    wcAppearances: 16,
    wcTitles: 2,
    lastWcResult: { year: 2022, round: "Final" },
  },
  sen: {
    nickname: { en: "Lions of Teranga", ja: "テランガのライオン" },
    confederation: "CAF",
    description: {
      en: "Reached the quarterfinals in 2002 and remain one of Africa's strongest World Cup nations. They combine defensive intensity, physicality and pace up front. Experienced figures such as Sadio Mané, Kalidou Koulibaly and Édouard Mendy are joined by Europe-based talent including Nicolas Jackson, Iliman Ndiaye, Ismaïla Sarr, Pape Matar Sarr and Lamine Camara. The target is escaping the group, with another 2002-style run on the table.",
      ja: "2002年大会でベスト8に進んだアフリカの強豪。近年もアフリカの中では安定感が高く、守備強度、フィジカル、前線のスピードを兼ね備える。Sadio Mané、Kalidou Koulibaly、Édouard Mendyら経験ある選手に加え、Nicolas Jackson、Iliman Ndiaye、Ismaïla Sarr、Pape Matar Sarr、Lamine Camaraら欧州組も揃う。目標はグループ突破と、2002年級の躍進。",
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
      en: "Their first World Cup in 40 years, since 1986. Under Graham Arnold they won the intercontinental playoff to return to the world stage. Aymen Hussein leads the attack, with Zidane Iqbal, Ali Jassim and Ali Al-Hamadi also key. Resilient defending, set pieces and aerial strength are strengths, but a group with France, Senegal and Norway is brutal. Targets are a maiden World Cup win and points on the board.",
      ja: "1986年以来、40年ぶりのW杯復帰。長く本大会から遠ざかっていたが、Graham Arnold監督の下でプレーオフを勝ち抜き、世界舞台に戻ってきた。Aymen Husseinを中心に、Zidane Iqbal、Ali Jasim、Ali Al-Hamadiらも攻撃の重要な駒になる。粘り強い守備、セットプレー、前線の高さが武器。ただし同組はフランス、セネガル、ノルウェーでかなり厳しい。目標はW杯初勝利と勝ち点獲得。",
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
      en: "First World Cup since 1998. Erling Haaland and Martin Ødegaard form a world-class attacking spine whose individual quality can trouble any side. Under Ståle Solbakken they scored freely in qualifying, with Haaland, Ødegaard and Alexander Sørloth giving them elite firepower. World Cup experience and defensive stability are concerns. The target is a knockout berth for the first time since 1998, with the quarterfinals as upside.",
      ja: "1998年以来のW杯復帰。Erling HaalandとMartin Ødegaardという世界級の攻撃軸を持ち、個の破壊力だけなら強豪国にも通用する。Ståle Solbakken体制では予選で圧倒的な得点力を見せ、Haaland、Ødegaard、Alexander Sørlothを中心に攻撃力は大会屈指。一方で、W杯本大会の経験値や守備の安定は課題。目標は1998年以来の決勝トーナメント進出、上振れすればベスト8。",
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
      en: "Defending champions. Lionel Messi led them to a long-awaited title in 2022 and they arrive chasing back-to-back crowns at his sixth World Cup. Lautaro Martínez, Julián Álvarez, Enzo Fernández, Alexis Mac Allister and Rodrigo De Paul give them a deep mid-prime core. Ángel Di María has retired from international football; the focus is Messi's fitness and managing the generational handover. The target is the title.",
      ja: "前回2022年大会の王者。Lionel Messiを中心に悲願の優勝を果たし、今回は連覇を狙う立場で大会に入る。Messiは自身6度目のW杯で、Lautaro Martínez、Julián Álvarez、Enzo Fernández、Alexis Mac Allister、Rodrigo De Paulら中堅世代も充実している。Angel Di Maríaは代表を退いており、焦点はMessiのコンディションと世代交代のバランス。目標は当然優勝。",
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
      en: "They reached the round of 16 in 2014 and pushed Germany into extra time—a result that still defines them. The Mahrez generation is past its peak, but Mahrez remains the attacking focal point in a new-look side featuring Ibrahim Maza, Rayan Aït-Nouri, Ramy Bensebaini and Luca Zidane. Technical attackers, North African duelling and resilience are the hallmarks. The target is a first knockout berth since 2014.",
      ja: "2014年大会ではベスト16に進み、延長戦までドイツを苦しめた印象が強い。Riyad Mahrez世代のピークは過ぎつつあるが、現在もMahrezが攻撃の中心で、Ibrahim Maza、Rayan Aït-Nouri、Ramy Bensebaini、Luca Zidaneらを含む新しいチームへ移行している。テクニックのある攻撃陣と、北アフリカらしい球際の強さ、粘り強さが特徴。目標は2014年以来のグループ突破。",
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
      en: "First World Cup since 1998. Under Ralf Rangnick they have risen on the back of high pressing, work rate and fast vertical attacks. David Alaba, Marcel Sabitzer, Konrad Laimer and Christoph Baumgartner are central figures in a side that impressed at Euro 2024. They are well coached and among the leading candidates to advance behind Argentina in Group J. The target is a knockout-round berth.",
      ja: "1998年以来のW杯復帰。Ralf Rangnick体制で評価を上げ、高い位置からのプレス、運動量、縦に速い攻撃を武器にしている。David Alaba、Marcel Sabitzer、Konrad Laimer、Christoph Baumgartnerらを中心に、EURO 2024でも内容面で注目された。チームとしての完成度は高く、グループJではアルゼンチンに次ぐ突破候補。久々の本大会で、目標は決勝トーナメント進出。",
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
      en: "A first World Cup for the nation. They have built momentum with an Asian Cup runners-up finish and an Arab Cup final run, defending deep and countering quickly. Under Jamal Sellami, Mousa Al-Tamari leads with pace and resilient defending, but doubts over Yazan Al-Naimat's fitness are a major attacking concern. As debutants, the goals are a first point and, if possible, a first win.",
      ja: "国として初のW杯出場。近年はアジアカップ準優勝やアラブカップ決勝進出で存在感を高め、守備から速く攻めるスタイルで評価を上げてきた。Jamal Sellami体制で、Mousa Al-Tamariを中心に、前線のスピードと粘り強い守備が武器になる。一方でYazan Al-Naimatの負傷不安は攻撃面の大きな懸念。初出場国としてまずは勝ち点獲得、可能なら初勝利が大きな目標。",
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
      en: "Cristiano Ronaldo is at his sixth World Cup while Portugal transition to a deep generation led by Bruno Fernandes, Bernardo Silva, Vitinha, Rafael Leão and João Neves. Rúben Dias, Nuno Mendes and Diogo Costa anchor the back line in a squad with elite European talent. Managing stars including Ronaldo and defensive consistency over the tournament are the challenges. The goal is a first World Cup title.",
      ja: "Cristiano Ronaldoが6度目のW杯に臨む一方で、Bruno Fernandes、Bernardo Silva、Vitinha、Rafael Leão、João Nevesらを中心とする厚い世代へ移っている。Rúben Dias、Nuno Mendes、Diogo Costaが後方を支え、タレント量では欧州トップ級。課題はRonaldoを含めたスター選手の使い分けと、大会を通した守備の安定。目標は国として初のW杯優勝。",
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
      en: "Returning to the World Cup for the first time since 1974, when they appeared as Zaire—a major milestone for the modern DRC. Under Sébastien Desabre, Yoane Wissa, Cédric Bakambu, Fiston Mayele and Chancel Mbemba are central. Athleticism, vertical drive and individual quality up front are strengths, but holding up defensively against top sides is the test. After a long absence, the targets are points and a first World Cup win.",
      ja: "1974年以来のW杯復帰。当時はザイールとして出場しており、現在のDRコンゴとしては非常に大きな節目になる。Sébastien Desabre監督の下、Yoane Wissa、Cédric Bakambu、Fiston Mayele、Chancel Mbembaらが中心。身体能力、縦への推進力、前線の個は魅力がある一方、強豪相手に守備をどこまで保てるかが課題。長い空白を経た復帰だけに、まずは勝ち点獲得とW杯初勝利が目標。",
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
      en: "Long the perennial near-miss of Asian qualifying, Uzbekistan have finally reached the World Cup—a landmark for Central Asian football and the nation. Eldor Shomurodov, Abbosbek Fayzullaev and Abdukodir Khusanov are central to a side built on defensive discipline, midfield grit and counters. As debutants they can aim beyond a point, including a possible third-place finish.",
      ja: "長年アジア予選であと一歩届かなかったが、ついに初のW杯出場を決めた。中央アジア勢としても大きな意味を持つ出場で、国としての節目になる。Eldor Shomurodov、Abbosbek Fayzullaev、Abdukodir Khusanovらが中心で、守備の規律、中盤の粘り、カウンターが特徴。初出場ながら、3位突破も含めて勝ち点獲得以上を狙えるチーム。",
    },
    fifaRank: 50,
    wcAppearances: 0,
    wcTitles: 0,
  },
  col: {
    nickname: { en: "Los Cafeteros", ja: "ロス・カフェテロス" },
    confederation: "CONMEBOL",
    description: {
      en: "James Rodríguez led them to the quarterfinals in 2014 in a campaign that left a lasting impression. They reached the round of 16 in 2018 but missed 2022, so this is a comeback. Under Néstor Lorenzo, Luis Díaz, Jhon Arias, James Rodríguez, Daniel Muñoz and Richard Ríos are central, with wide thrust, individual quality and South American duelling as strengths. The target is escaping the group, with the quarterfinals as upside.",
      ja: "2014年大会ではJames Rodríguezを中心にベスト8へ進み、世界に強い印象を残した。2018年もベスト16まで進んだが、2022年は出場を逃したため、今回は復帰の大会になる。Néstor Lorenzo体制で、Luis Díaz、Jhon Arias、James Rodríguez、Daniel Muñoz、Richard Ríosらが中心。サイドの推進力、個の打開、南米らしい球際の強さが武器。目標はグループ突破、上振れすればベスト8。",
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
      en: "Recent years have stacked up World Cup semifinals and Euro final runs without lifting silverware. Under Thomas Tuchel, Harry Kane, Jude Bellingham, Bukayo Saka and Declan Rice are central. Phil Foden, Cole Palmer, Trent Alexander-Arnold and Harry Maguire were left out while Eberechi Eze, Morgan Rogers, Ollie Watkins and Ivan Toney were picked in a bold selection. The goal is a first World Cup since 1966.",
      ja: "近年はW杯ベスト4、EURO決勝進出など結果を積み上げているが、タイトルには届いていない。Thomas Tuchel体制で、Harry Kane、Jude Bellingham、Bukayo Saka、Declan Riceらが中心になる。Phil Foden、Cole Palmer、Trent Alexander-Arnold、Harry Maguireが外れた一方、Eberechi Eze、Morgan Rogers、Ollie Watkins、Ivan Toneyらが選ばれており、大胆な人選になった。目標は1966年以来のW杯優勝。",
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
      en: "2018 finalists and 2022 third-place finishers, with extraordinary recent tournament resilience. Luka Modrić is 40 and this may well be his last World Cup. Joško Gvardiol, Mateo Kovačić, Ivan Perišić, Andrej Kramarić and Ante Budimir are also in the squad, blending experience and youth. Midfield technique and game management remain strengths. The goal is to grind through another knockout run and push for a deep finish.",
      ja: "2018年準優勝、2022年3位と、近年のW杯で驚異的な勝負強さを見せている国。Luka Modrićは40歳で、今大会が最後のW杯になる可能性が高い。Joško Gvardiol、Mateo Kovačić、Ivan Perišić、Andrej Kramarić、Ante Budimirらも入り、経験と若さはある。中盤の技術と試合運びは健在で、目標は再び決勝トーナメントで粘り、上位進出を狙うこと。",
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
      en: "Reached the quarterfinals in 2010 and came within one penalty of becoming the first African nation to make a World Cup semifinal. Athleticism, vertical speed and individual flair up front are strengths, though consistency has been a recent issue. Thomas Partey anchors midfield while Antoine Semenyo, Iñaki Williams, Jordan Ayew, Ernest Nuamah and Abdul Fatawu lead the attack. Injuries to Mohammed Kudus and Alexander Djiku are a major blow. The goal is escaping the group, ideally another 2010-style run.",
      ja: "2010年大会でベスト8まで進み、アフリカ勢初のベスト4にあと一歩まで迫った国。身体能力、縦への速さ、前線の個の力が武器だが、近年は安定感に課題もある。Thomas Parteyが中盤の軸となり、Antoine Semenyo、Iñaki Williams、Jordan Ayew、Ernest Nuamah、Abdul Fatawuらが攻撃を担う。一方でMohammed KudusとAlexander Djikuの負傷離脱は大きな痛手。目標はグループ突破、理想は2010年のような躍進。",
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
      en: "Back at the World Cup for a second time since 2018. On their debut they lost all three games but gained invaluable experience for the nation. Under Thomas Christiansen, captain Aníbal Godoy, Adalberto Carrasquilla and Ismael Díaz are central. Defensive organization, resilience and grinding low-scoring games are their style. Targets are a first World Cup point and, ideally, a first win.",
      ja: "2018年以来2度目のW杯出場。前回大会では初出場ながら3戦全敗で、国として大きな経験を得た。Thomas Christiansen体制で、主将Aníbal Godoy、Adalberto Carrasquilla、Ismael Díazらが中心になる。組織的な守備、粘り強さ、ロースコアに持ち込む戦い方が特徴。目標はW杯初勝ち点、可能なら初勝利。",
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
