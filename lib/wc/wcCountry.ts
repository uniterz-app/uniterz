// lib/wc/wcCountry.ts

/**
 * World Cup の teamId は "wc-{ISO3 lower}" を使う。
 *  - 例外: イングランド = "wc-eng" / スコットランド = "wc-sct" （flag-icons の gb-eng / gb-sct に対応）
 *
 * flag-icons の class は ISO2 lower なので、ISO3→ISO2 を引く。
 *
 * 出場国を増やすときは、ここに ISO3→ISO2 と表示名を追加するだけでOK。
 */

type WcCountry = {
  iso2: string;
  /** flag-icons の class 名（例: "jp" / "gb-eng" / "kr"） */
  flag: string;
  /** 英語表記 */
  name: string;
  /** 日本語表記 */
  nameJa: string;
};

const WC_COUNTRIES: Record<string, WcCountry> = {
  // === Group A ===
  mex: { iso2: "mx", flag: "mx", name: "Mexico", nameJa: "メキシコ" },
  zaf: { iso2: "za", flag: "za", name: "South Africa", nameJa: "南アフリカ" },
  kor: { iso2: "kr", flag: "kr", name: "South Korea", nameJa: "韓国" },
  cze: { iso2: "cz", flag: "cz", name: "Czechia", nameJa: "チェコ" },

  // === Group B ===
  can: { iso2: "ca", flag: "ca", name: "Canada", nameJa: "カナダ" },
  bih: {
    iso2: "ba",
    flag: "ba",
    name: "Bosnia & Herzegovina",
    nameJa: "ボスニア・ヘルツェゴビナ",
  },
  qat: { iso2: "qa", flag: "qa", name: "Qatar", nameJa: "カタール" },
  che: { iso2: "ch", flag: "ch", name: "Switzerland", nameJa: "スイス" },

  // === Group C ===
  bra: { iso2: "br", flag: "br", name: "Brazil", nameJa: "ブラジル" },
  mar: { iso2: "ma", flag: "ma", name: "Morocco", nameJa: "モロッコ" },
  hti: { iso2: "ht", flag: "ht", name: "Haiti", nameJa: "ハイチ" },
  sct: {
    iso2: "gb-sct",
    flag: "gb-sct",
    name: "Scotland",
    nameJa: "スコットランド",
  },

  // === Group D ===
  usa: { iso2: "us", flag: "us", name: "USA", nameJa: "アメリカ" },
  pry: { iso2: "py", flag: "py", name: "Paraguay", nameJa: "パラグアイ" },
  aus: { iso2: "au", flag: "au", name: "Australia", nameJa: "オーストラリア" },
  tur: { iso2: "tr", flag: "tr", name: "Türkiye", nameJa: "トルコ" },

  // === Group E ===
  deu: { iso2: "de", flag: "de", name: "Germany", nameJa: "ドイツ" },
  civ: {
    iso2: "ci",
    flag: "ci",
    name: "Côte d'Ivoire",
    nameJa: "コートジボワール",
  },
  ecu: { iso2: "ec", flag: "ec", name: "Ecuador", nameJa: "エクアドル" },
  cuw: { iso2: "cw", flag: "cw", name: "Curaçao", nameJa: "キュラソー" },

  // === Group F ===
  nld: { iso2: "nl", flag: "nl", name: "Netherlands", nameJa: "オランダ" },
  jpn: { iso2: "jp", flag: "jp", name: "Japan", nameJa: "日本" },
  swe: { iso2: "se", flag: "se", name: "Sweden", nameJa: "スウェーデン" },
  tun: { iso2: "tn", flag: "tn", name: "Tunisia", nameJa: "チュニジア" },

  // === Group G ===
  bel: { iso2: "be", flag: "be", name: "Belgium", nameJa: "ベルギー" },
  egy: { iso2: "eg", flag: "eg", name: "Egypt", nameJa: "エジプト" },
  irn: { iso2: "ir", flag: "ir", name: "Iran", nameJa: "イラン" },
  nzl: { iso2: "nz", flag: "nz", name: "New Zealand", nameJa: "ニュージーランド" },

  // === Group H ===
  esp: { iso2: "es", flag: "es", name: "Spain", nameJa: "スペイン" },
  cpv: { iso2: "cv", flag: "cv", name: "Cabo Verde", nameJa: "カーボベルデ" },
  sau: { iso2: "sa", flag: "sa", name: "Saudi Arabia", nameJa: "サウジアラビア" },
  ury: { iso2: "uy", flag: "uy", name: "Uruguay", nameJa: "ウルグアイ" },

  // === Group I ===
  fra: { iso2: "fr", flag: "fr", name: "France", nameJa: "フランス" },
  sen: { iso2: "sn", flag: "sn", name: "Senegal", nameJa: "セネガル" },
  irq: { iso2: "iq", flag: "iq", name: "Iraq", nameJa: "イラク" },
  nor: { iso2: "no", flag: "no", name: "Norway", nameJa: "ノルウェー" },

  // === Group J ===
  arg: { iso2: "ar", flag: "ar", name: "Argentina", nameJa: "アルゼンチン" },
  dza: { iso2: "dz", flag: "dz", name: "Algeria", nameJa: "アルジェリア" },
  aut: { iso2: "at", flag: "at", name: "Austria", nameJa: "オーストリア" },
  jor: { iso2: "jo", flag: "jo", name: "Jordan", nameJa: "ヨルダン" },

  // === Group K ===
  prt: { iso2: "pt", flag: "pt", name: "Portugal", nameJa: "ポルトガル" },
  cod: { iso2: "cd", flag: "cd", name: "DR Congo", nameJa: "DRコンゴ" },
  uzb: { iso2: "uz", flag: "uz", name: "Uzbekistan", nameJa: "ウズベキスタン" },
  col: { iso2: "co", flag: "co", name: "Colombia", nameJa: "コロンビア" },

  // === Group L ===
  eng: {
    iso2: "gb-eng",
    flag: "gb-eng",
    name: "England",
    nameJa: "イングランド",
  },
  hrv: { iso2: "hr", flag: "hr", name: "Croatia", nameJa: "クロアチア" },
  gha: { iso2: "gh", flag: "gh", name: "Ghana", nameJa: "ガーナ" },
  pan: { iso2: "pa", flag: "pa", name: "Panama", nameJa: "パナマ" },
};

const WC_NAME_ALIASES: Record<string, keyof typeof WC_COUNTRIES> = {
  "united states": "usa",
  "united states of america": "usa",
  us: "usa",
  america: "usa",
  "south korea": "kor",
  "korea republic": "kor",
  korea: "kor",
  "bosnia and herzegovina": "bih",
  "bosnia & herzegovina": "bih",
  "cote d'ivoire": "civ",
  "côte d'ivoire": "civ",
  "ivory coast": "civ",
  curacao: "cuw",
  curaçao: "cuw",
  netherlands: "nld",
  holland: "nld",
  japan: "jpn",
  germany: "deu",
  brazil: "bra",
  england: "eng",
  scotland: "sct",
  turkey: "tur",
  "türkiye": "tur",
  tunisia: "tun",
  mexico: "mex",
  canada: "can",
  switzerland: "che",
  australia: "aus",
  paraguay: "pry",
  morocco: "mar",
  belgium: "bel",
  egypt: "egy",
  iran: "irn",
  "new zealand": "nzl",
  spain: "esp",
  france: "fra",
  argentina: "arg",
  portugal: "prt",
  croatia: "hrv",
};

function normCountryName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** 表示名・旧データから wc-{iso3} を引く */
export function lookupWcTeamIdByCountryName(
  name: string | null | undefined
): string | null {
  if (!name?.trim()) return null;
  const raw = name.trim();
  const normalized = normCountryName(raw);

  for (const [iso3, country] of Object.entries(WC_COUNTRIES)) {
    if (normCountryName(country.name) === normalized) return `wc-${iso3}`;
    if (country.nameJa === raw) return `wc-${iso3}`;
  }

  const aliasIso = WC_NAME_ALIASES[normalized];
  if (aliasIso) return `wc-${aliasIso}`;

  return null;
}

/**
 * 登録済み WC 国の iso3 一覧（"jpn" / "bra" など）。
 */
export const WC_COUNTRY_ISO3_LIST = Object.keys(WC_COUNTRIES);

const WC_ISO3_BY_ISO2_OR_FLAG: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const iso3 of Object.keys(WC_COUNTRIES)) {
    const c = WC_COUNTRIES[iso3];
    out[c.iso2.toLowerCase()] = iso3;
    out[c.flag.toLowerCase()] = iso3;
    out[iso3.toLowerCase()] = iso3;
  }
  return out;
})();

function wcIso3FromLooseTeamKey(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;

  if (t.startsWith("wc-")) {
    const iso3 = t.slice(3).toLowerCase();
    return WC_COUNTRIES[iso3] ? iso3 : null;
  }

  if (/^[a-z]{3}$/i.test(t)) {
    const iso3 = t.toLowerCase();
    return WC_COUNTRIES[iso3] ? iso3 : null;
  }

  const viaIso2 = WC_ISO3_BY_ISO2_OR_FLAG[t.toLowerCase()];
  if (viaIso2) return viaIso2;

  const viaName = lookupWcTeamIdByCountryName(t);
  if (viaName?.startsWith("wc-")) {
    const iso3 = viaName.slice(3);
    return WC_COUNTRIES[iso3] ? iso3 : null;
  }

  return null;
}

/**
 * 各種表記を `wc-{iso3}` に正規化（解決不能なら null）。
 */
export function coerceWcTeamId(
  raw: string | null | undefined
): string | null {
  const iso3 = raw ? wcIso3FromLooseTeamKey(raw) : null;
  return iso3 ? `wc-${iso3}` : null;
}

/**
 * teamId（"wc-jpn" 形式）を WcCountry に解決する。
 * ISO2（jp / gb-eng）・国名・iso3 単体にも対応。
 */
export function teamIdToWcCountry(
  teamId: string | null | undefined
): WcCountry | null {
  const iso3 = teamId ? wcIso3FromLooseTeamKey(teamId) : null;
  return iso3 ? (WC_COUNTRIES[iso3] ?? null) : null;
}

/**
 * teamId から flag-icons の class 名を返す（"fi fi-jp" 形式）。
 * 解決できないときは null。
 */
export function teamIdToFlagClass(
  teamId: string | null | undefined
): string | null {
  const c = teamIdToWcCountry(teamId);
  return c ? `fi fi-${c.flag}` : null;
}

/**
 * 表示名（言語に応じて切替）
 */
export function teamIdToCountryName(
  teamId: string | null | undefined,
  language: string
): string | null {
  const c = teamIdToWcCountry(teamId);
  if (!c) return null;
  return language === "ja" ? c.nameJa : c.name;
}
