// lib/wc/clubLeagueCountry.ts
//
// キープレイヤーの所属クラブ → リーグ所在国（ISO 3166-1 alpha-2、小文字）。
// `public/flags/4x3/<iso2>.svg` と CountryFlag の iso2 指定で表示する。

import type { Language } from "@/lib/i18n/language";

/** rosters.ts の club 文字列と完全一致で引く */
const CLUB_LEAGUE_ISO2: Record<string, string> = {
  "AC Milan": "it",
  "AEK Larnaca": "cy",
  "AEL Limassol": "cy",
  "AFC Bournemouth": "gb-eng",
  "AGF": "dk",
  "AS Monaco": "fr",
  "AS Roma": "it",
  Ajax: "nl",
  "Al Ahli": "sa",
  "Al Ahly": "eg",
  "Al Hilal": "sa",
  "Al Ittihad": "sa",
  "Al Jazira": "ae",
  "Al Nassr": "sa",
  "Al Rayyan": "qa",
  "Al Sadd": "qa",
  "Al-Ahli": "sa",
  "Al-Dhafra": "ae",
  "Al-Duhail": "qa",
  "Al-Fayha": "sa",
  "Al-Hussein": "jo",
  "Al-Karma": "iq",
  "Al-Najma": "jo",
  "Al-Sailiya": "qa",
  Angers: "fr",
  Arsenal: "gb-eng",
  "Aston Villa": "gb-eng",
  Atalanta: "it",
  "Athletic Club": "es",
  "Atlanta United": "us",
  "Atlético Madrid": "es",
  Baniyas: "ae",
  Barcelona: "es",
  "Barcelona Atlètic": "es",
  Bastia: "fr",
  "Bayer Leverkusen": "de",
  "Bayern Munich": "de",
  Benfica: "pt",
  Beşiktaş: "tr",
  Bologna: "it",
  "Borussia Dortmund": "de",
  "Borussia Mönchengladbach": "de",
  Bournemouth: "gb-eng",
  "Braintree Town": "gb-eng",
  "Brighton & Hove Albion": "gb-eng",
  Brøndby: "dk",
  Burnley: "gb-eng",
  Celtic: "gb-sct",
  "Charlotte FC": "us",
  Chaves: "pt",
  Chelsea: "gb-eng",
  "Club León": "mx",
  "Club Tijuana": "mx",
  "Columbus Crew": "us",
  Corinthians: "br",
  Cremonese: "it",
  "Crvena Zvezda": "rs",
  "Crystal Palace": "gb-eng",
  Dender: "be",
  "Dynamo Moscow": "ru",
  "Eintracht Frankfurt": "de",
  Esteghlal: "ir",
  "Estrela Amadora": "pt",
  Everton: "gb-eng",
  "FC Copenhagen": "dk",
  "FC Juárez": "mx",
  "FC Seoul": "kr",
  Fenerbahçe: "tr",
  Feyenoord: "nl",
  Flamengo: "br",
  Foolad: "ir",
  Fulham: "gb-eng",
  Galatasaray: "tr",
  Gent: "be",
  Girona: "es",
  Granada: "es",
  Hamburg: "de",
  Heerenveen: "nl",
  "Heracles Almelo": "nl",
  Hoffenheim: "de",
  Huracán: "ar",
  Independiente: "ar",
  "Inter Miami": "us",
  "Inter Milan": "it",
  "Ipswich Town": "gb-eng",
  "Istanbul Başakşehir": "tr",
  Iğdır: "tr",
  Juventus: "it",
  Kalba: "ae",
  Kayserispor: "tr",
  Konyaspor: "tr",
  LAFC: "us",
  "LDU Quito": "ec",
  "Leicester City": "gb-eng",
  Lens: "fr",
  Levante: "es",
  Lille: "fr",
  Liverpool: "gb-eng",
  Lorient: "fr",
  Lyon: "fr",
  "Maccabi Tel Aviv": "il",
  Mainz: "de",
  "Mainz 05": "de",
  Mallorca: "es",
  "Mamelodi Sundowns": "za",
  "Manchester City": "gb-eng",
  "Manchester United": "gb-eng",
  Marseille: "fr",
  "Melbourne City": "au",
  "Miami FC": "us",
  Middlesbrough: "gb-eng",
  Midtjylland: "dk",
  Millwall: "gb-eng",
  "Minnesota United": "us",
  Monaco: "fr",
  Napoli: "it",
  Navbahor: "uz",
  "Newcastle United": "gb-eng",
  Nice: "fr",
  "Norwich City": "gb-eng",
  "Nottingham Forest": "gb-eng",
  "OGC Nice": "fr",
  Olympiacos: "gr",
  "Orlando Pirates": "za",
  PAOK: "gr",
  "PEC Zwolle": "nl",
  PSG: "fr",
  PSV: "nl",
  "PSV Eindhoven": "nl",
  Pachuca: "mx",
  Palmeiras: "br",
  "Paris Saint-Germain": "fr",
  Parma: "it",
  Persepolis: "ir",
  "Philadelphia Union": "us",
  Porto: "pt",
  "Pumas UNAM": "mx",
  "Pyramids FC": "eg",
  "Qatar SC": "qa",
  "RB Leipzig": "de",
  "Raja Casablanca": "ma",
  "Real Betis": "es",
  "Real Madrid": "es",
  "Real Sociedad": "es",
  Rennes: "fr",
  "River Plate": "ar",
  Rostov: "ru",
  "San Diego FC": "us",
  "Sarpsborg 08": "no",
  Santos: "br",
  Sassuolo: "it",
  "Schalke 04": "de",
  Selangor: "my",
  Sepahan: "ir",
  "Servette Geneva": "ch",
  "Shabab Al-Ahli": "ae",
  "Sheffield United": "gb-eng",
  "St Pauli": "de",
  "St. Gallen": "ch",
  "St. Pauli": "de",
  "Stade Rennais": "fr",
  Strasbourg: "fr",
  Stuttgart: "de",
  Sunderland: "gb-eng",
  "Swansea City": "gb-eng",
  Torino: "it",
  Tottenham: "gb-eng",
  "Tottenham Hotspur": "gb-eng",
  Tractor: "ir",
  "Universidad Católica": "ec",
  "Universidad de Concepción": "cl",
  Utrecht: "nl",
  "Vancouver Whitecaps": "us",
  "VfB Stuttgart": "de",
  "VfL Wolfsburg": "de",
  "Viking FK": "no",
  Villarreal: "es",
  Volendam: "nl",
  Watford: "gb-eng",
  "Wellington Phoenix": "au",
  "West Ham": "gb-eng",
  "West Ham United": "gb-eng",
  "Wolverhampton Wanderers": "gb-eng",
  Wolves: "gb-eng",
  "Wrexham AFC": "gb-wls",
  "Young Boys": "ch",
  "Çaykur Rizespor": "tr",
  "İstanbul Başakşehir": "tr",
};

/** Intl.DisplayNames が扱えないサブディビジョン旗 */
const LEAGUE_REGION_LABEL: Partial<
  Record<string, { en: string; ja: string }>
> = {
  "gb-eng": { en: "England", ja: "イングランド" },
  "gb-sct": { en: "Scotland", ja: "スコットランド" },
  "gb-wls": { en: "Wales", ja: "ウェールズ" },
  "gb-nir": { en: "Northern Ireland", ja: "北アイルランド" },
};

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function displayNamesFor(language: Language): Intl.DisplayNames {
  const locale =
    language === "ja"
      ? "ja"
      : language === "ko"
        ? "ko"
        : language === "zh"
          ? "zh"
          : language === "de"
            ? "de"
            : language === "fr"
              ? "fr"
              : language === "es"
                ? "es"
                : language === "pt"
                  ? "pt"
                  : language === "ar"
                    ? "ar"
                    : "en";
  let dn = displayNamesCache.get(locale);
  if (!dn) {
    dn = new Intl.DisplayNames([locale], { type: "region" });
    displayNamesCache.set(locale, dn);
  }
  return dn;
}

/** 所属クラブ名からリーグ所在国の ISO2（小文字）を返す */
export function getClubLeagueIso2(
  club: string | undefined,
  override?: string,
): string | null {
  if (override) return override.toLowerCase();
  if (!club) return null;
  return CLUB_LEAGUE_ISO2[club] ?? null;
}

/** ツールチップ・alt 用のリーグ国名 */
export function formatLeagueCountryName(
  iso2: string,
  language: Language,
): string {
  const key = iso2.toLowerCase();
  const custom = LEAGUE_REGION_LABEL[key];
  if (custom) {
    return language === "ja" ? custom.ja : custom.en;
  }
  const code = key.length === 2 ? key.toUpperCase() : key;
  try {
    return displayNamesFor(language).of(code) ?? iso2;
  } catch {
    return iso2;
  }
}
