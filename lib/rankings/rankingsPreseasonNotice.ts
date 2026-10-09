import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";

/** 開幕前でランキングが空のとき NO DATA の代わりに出す（プレシーズンは集計対象外） */
export function shouldShowRankingsPreseasonNotice(
  rankingHasNoEntries: boolean,
  now: Date = new Date()
): boolean {
  return rankingHasNoEntries && !nbaSeasonStatsReady(now);
}

export function rankingsPreseasonNotice(language: string | null | undefined): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "プレシーズンはランキングの対象外です。\nレギュラーシーズン開幕から集計が始まります。",
    en: "Preseason games don't count toward rankings.\nRankings start with the regular season.",
    ko: "프리시즌은 랭킹 집계 대상이 아닙니다.\n정규시즌 개막부터 집계됩니다.",
    zh: "季前赛不计入排名。\n常规赛开幕后开始统计。",
    es: "La pretemporada no cuenta para las clasificaciones.\nEmpiezan con la temporada regular.",
    pt: "A pré-temporada não conta para os rankings.\nEles começam com a temporada regular.",
    fr: "La présaison ne compte pas pour les classements.\nIls démarrent avec la saison régulière.",
    de: "Preseason-Spiele zählen nicht für die Rankings.\nDie Wertung beginnt mit der regulären Saison.",
    ar: "مباريات ما قبل الموسم لا تُحتسب في التصنيفات.\nيبدأ احتساب التصنيف مع انطلاق الموسم العادي.",
  });
}
