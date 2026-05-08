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
      en: "Mexico are co-hosts and one of CONCACAF's most consistent World Cup sides, having reached the Round of 16 in seven of the last eight editions.",
      ja: "共催国。直近8大会のうち7大会で BEST16 に進出する CONCACAF の常連。Estadio Azteca を擁し、本大会の開幕戦を担当する。",
    },
    fifaRank: 15,
    wcAppearances: 17,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  zaf: {
    nickname: { en: "Bafana Bafana", ja: "バファナ・バファナ" },
    confederation: "CAF",
    fifaRank: 60,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "Group" },
  },
  kor: {
    nickname: { en: "Taegeuk Warriors", ja: "テグク戦士" },
    confederation: "AFC",
    description: {
      en: "South Korea reached the semifinals on home soil in 2002 and have qualified for every World Cup since 1986. Captain Son Heung-min leads the new generation.",
      ja: "2002年自国開催で BEST4 に進出。1986年以降、本戦に連続出場するアジアの強豪。ソン・フンミンを擁する黄金世代。",
    },
    fifaRank: 25,
    wcAppearances: 11,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  cze: {
    nickname: { en: "Národní tým", ja: "ナーロドニー・ティーム" },
    confederation: "UEFA",
    fifaRank: 41,
    wcAppearances: 9,
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
      en: "Co-hosts Canada return to the World Cup for the third time, riding a generation led by Alphonso Davies and Jonathan David.",
      ja: "共催国として 3 度目の本戦出場。アルフォンソ・デイヴィスとジョナサン・デイヴィッドを擁する黄金世代が躍進中。",
    },
    fifaRank: 30,
    wcAppearances: 2,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  bih: {
    nickname: { en: "Zmajevi", ja: "ドラゴンズ" },
    confederation: "UEFA",
    fifaRank: 65,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "Group" },
  },
  qat: {
    nickname: { en: "Al-Annabi", ja: "アル＝アンナビ" },
    confederation: "AFC",
    fifaRank: 55,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  che: {
    nickname: { en: "Nati", ja: "ナティ" },
    confederation: "UEFA",
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
      en: "Brazil are the most successful nation in World Cup history with five titles (1958, 1962, 1970, 1994, 2002) and the only side to have appeared in every edition.",
      ja: "通算優勝5回（1958, 1962, 1970, 1994, 2002）の最多優勝国。全大会連続出場を続ける唯一の国でもあり、サッカー王国の代名詞。",
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
      en: "Morocco became the first African nation to reach a World Cup semifinal in 2022, beating Spain and Portugal en route to fourth place.",
      ja: "2022年大会でアフリカ勢初の BEST4 進出。スペイン・ポルトガルを撃破して 4 位に入った歴史的快進撃が記憶に新しい。",
    },
    fifaRank: 8,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "SF" },
  },
  hti: {
    nickname: { en: "Les Grenadiers", ja: "レ・グルナディエ" },
    confederation: "CONCACAF",
    fifaRank: 83,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1974, round: "Group" },
  },
  sct: {
    nickname: { en: "Tartan Army", ja: "タータン・アーミー" },
    confederation: "UEFA",
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
      en: "Co-hosts USA built a young core around Pulisic, McKennie and Reyna. Best result was a third-place finish in 1930.",
      ja: "共催国。クリスチャン・プリシッチを中心に若手主体のチームを構築。1930年大会の 3 位が最高成績。",
    },
    fifaRank: 16,
    wcAppearances: 11,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  pry: {
    nickname: { en: "La Albirroja", ja: "ラ・アルビロハ" },
    confederation: "CONMEBOL",
    fifaRank: 40,
    wcAppearances: 8,
    wcTitles: 0,
    lastWcResult: { year: 2010, round: "QF" },
  },
  aus: {
    nickname: { en: "Socceroos", ja: "サッカルーズ" },
    confederation: "AFC",
    fifaRank: 27,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  tur: {
    nickname: { en: "Ay-Yıldızlılar", ja: "クレセント＆スターズ" },
    confederation: "UEFA",
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
      en: "Germany have won the World Cup four times (1954, 1974, 1990, 2014). After back-to-back group-stage exits in 2018 and 2022 they are looking for a reset.",
      ja: "通算優勝 4 回（1954, 1974, 1990, 2014）の強豪。2018, 2022 と 2 大会連続でグループステージ敗退に終わり、再出発を期す。",
    },
    fifaRank: 10,
    wcAppearances: 20,
    wcTitles: 4,
    lastWcResult: { year: 2022, round: "Group" },
  },
  civ: {
    nickname: { en: "Les Éléphants", ja: "レ・ゼレファン" },
    confederation: "CAF",
    fifaRank: 34,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "Group" },
  },
  ecu: {
    nickname: { en: "La Tri", ja: "ラ・トリ" },
    confederation: "CONMEBOL",
    fifaRank: 23,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  cuw: {
    nickname: { en: "Famia Kòrsou", ja: "ファミア・コルソウ" },
    confederation: "CONCACAF",
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
      en: "The Netherlands have reached three World Cup finals (1974, 1978, 2010) without ever winning the trophy. Total Football's spiritual home.",
      ja: "W杯決勝に 3 度進出（1974, 1978, 2010）するも未だ優勝なし。トータルフットボールの故郷。",
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
      en: "Japan have qualified for every FIFA World Cup since 1998 and reached the Round of 16 four times. They beat Germany and Spain in 2022.",
      ja: "1998年以降、全ての FIFA ワールドカップに連続出場。Best16進出は4度。2022年カタール大会ではドイツとスペインを撃破するという衝撃を残した。",
    },
    fifaRank: 18,
    wcAppearances: 7,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  swe: {
    nickname: { en: "Blågult", ja: "ブロー・グルト" },
    confederation: "UEFA",
    fifaRank: 38,
    wcAppearances: 12,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "QF" },
  },
  tun: {
    nickname: { en: "Eagles of Carthage", ja: "カルタゴの鷲" },
    confederation: "CAF",
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
      en: "Belgium's golden generation peaked with a third-place finish in 2018. They are rebuilding around the next wave of attackers.",
      ja: "2018年大会で 3 位に入った黄金世代の遺産を受け継ぎつつ、新世代へとシフト中。",
    },
    fifaRank: 9,
    wcAppearances: 14,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  egy: {
    nickname: { en: "Pharaohs", ja: "ファラオズ" },
    confederation: "CAF",
    fifaRank: 29,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2018, round: "Group" },
  },
  irn: {
    nickname: { en: "Team Melli", ja: "チーム・メリ" },
    confederation: "AFC",
    fifaRank: 21,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  nzl: {
    nickname: { en: "All Whites", ja: "オール・ホワイツ" },
    confederation: "OFC",
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
      en: "Spain won the World Cup in 2010 with their iconic tiki-taka style, completing a historic Euro–World Cup–Euro treble between 2008 and 2012.",
      ja: "ティキ・タカで世界を席巻し、2010年大会で初優勝。2008–2012年の Euro–W杯–Euro 三冠を達成した黄金世代を経て、新世代の台頭が続く。",
    },
    fifaRank: 2,
    wcAppearances: 16,
    wcTitles: 1,
    lastWcResult: { year: 2022, round: "R16" },
  },
  cpv: {
    nickname: { en: "Tubarões Azuis", ja: "ブルー・シャークス" },
    confederation: "CAF",
    fifaRank: 69,
    wcAppearances: 0,
    wcTitles: 0,
  },
  sau: {
    nickname: { en: "Green Falcons", ja: "緑の鷹" },
    confederation: "AFC",
    fifaRank: 61,
    wcAppearances: 6,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  ury: {
    nickname: { en: "La Celeste", ja: "ラ・セレステ" },
    confederation: "CONMEBOL",
    description: {
      en: "Two-time champions (1930, 1950). Punching far above their weight, Uruguay remain a perennial South American power.",
      ja: "1930, 1950年大会で優勝経験を持つ南米の伝統国。人口比でみても世界屈指のサッカー大国。",
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
      en: "France are the back-to-back World Cup finalists (winners 2018, runners-up 2022) and one of two nations to reach four consecutive WC semifinals.",
      ja: "2018年に通算 2 度目の優勝、2022年は準優勝。常勝軍団としての地位を不動のものにしている。",
    },
    fifaRank: 1,
    wcAppearances: 16,
    wcTitles: 2,
    lastWcResult: { year: 2022, round: "Final" },
  },
  sen: {
    nickname: { en: "Lions of Teranga", ja: "テランガのライオン" },
    confederation: "CAF",
    fifaRank: 14,
    wcAppearances: 3,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "R16" },
  },
  irq: {
    nickname: { en: "Lions of Mesopotamia", ja: "メソポタミアのライオン" },
    confederation: "AFC",
    fifaRank: 57,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1986, round: "Group" },
  },
  nor: {
    nickname: { en: "Drillos", ja: "ドリロス" },
    confederation: "UEFA",
    description: {
      en: "Norway return to the World Cup for the first time since 1998, powered by Erling Haaland and Martin Ødegaard.",
      ja: "1998年以来となる本戦復帰。エルリング・ハーランドとマルティン・ウーデゴーアを擁する新世代が世界に挑む。",
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
      en: "Defending champions. Argentina's third World Cup triumph in 2022, led by Lionel Messi, gave the GOAT his coronation moment.",
      ja: "前回大会の覇者。2022 年大会で 3 度目の優勝を達成し、リオネル・メッシが悲願のタイトルを掲げた。",
    },
    fifaRank: 3,
    wcAppearances: 18,
    wcTitles: 3,
    lastWcResult: { year: 2022, round: "W" },
  },
  dza: {
    nickname: { en: "Les Fennecs", ja: "レ・フェネック" },
    confederation: "CAF",
    fifaRank: 28,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2014, round: "R16" },
  },
  aut: {
    nickname: { en: "Das Team", ja: "ダス・ティーム" },
    confederation: "UEFA",
    fifaRank: 24,
    wcAppearances: 7,
    wcTitles: 0,
    lastWcResult: { year: 1998, round: "Group" },
  },
  jor: {
    nickname: { en: "Al-Nashama", ja: "アル＝ナシャマ" },
    confederation: "AFC",
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
      en: "Cristiano Ronaldo's nation, Portugal have a deep talent pool led by Bernardo Silva, Bruno Fernandes and a wave of new attackers.",
      ja: "クリスティアーノ・ロナウドを擁し、世代交代を進める強豪。ベルナルド・シルヴァら中盤の質は世界トップクラス。",
    },
    fifaRank: 5,
    wcAppearances: 8,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "QF" },
  },
  cod: {
    nickname: { en: "Léopards", ja: "レオパール" },
    confederation: "CAF",
    fifaRank: 46,
    wcAppearances: 1,
    wcTitles: 0,
    lastWcResult: { year: 1974, round: "Group" },
  },
  uzb: {
    nickname: { en: "White Wolves", ja: "ホワイトウルブス" },
    confederation: "AFC",
    fifaRank: 50,
    wcAppearances: 0,
    wcTitles: 0,
  },
  col: {
    nickname: { en: "Los Cafeteros", ja: "ロス・カフェテロス" },
    confederation: "CONMEBOL",
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
      en: "England have won the World Cup once (1966) and reached the semifinals in 2018. A talent-laden squad continues to chase a second crown.",
      ja: "1966年大会で優勝経験を持つ近代サッカー発祥の国。2018年は BEST4。再びの戴冠を狙う強力布陣。",
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
      en: "Croatia reached the World Cup final in 2018 and finished third in 2022. A nation of just under 4 million producing world-class midfielders.",
      ja: "2018年大会準優勝、2022年大会 3 位。人口 400 万弱から世界トップ級の中盤を輩出するサッカー大国。",
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
      en: "Ghana reached the quarterfinals of the 2010 World Cup, becoming the third African nation ever to do so.",
      ja: "2010年大会で BEST8 まで進出し、アフリカ勢として歴史に残る快進撃を見せた。",
    },
    fifaRank: 74,
    wcAppearances: 4,
    wcTitles: 0,
    lastWcResult: { year: 2022, round: "Group" },
  },
  pan: {
    nickname: { en: "La Marea Roja", ja: "ラ・マレア・ロハ" },
    confederation: "CONCACAF",
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
