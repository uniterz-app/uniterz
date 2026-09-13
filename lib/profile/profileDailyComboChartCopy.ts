/**
 * Profile Daily Combo Chart（Neural）の短い単位・凡例接頭辞 — 7言語
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function profileDailyComboChartCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    /** 凡例ライン用「累積」接頭辞（末尾スペース込み） */
    cumulativePrefix: L(lang, {
      ja: "累積 ",
      en: "Cumulative ",
      ko: "누적 ",
      zh: "累计 ",
      es: "Acumulado ",
      pt: "Acumulado ",
      fr: "Cumulé ",
    }),
    matchUnit: L(lang, {
      ja: "試合",
      en: "matches",
      ko: "경기",
      zh: "场次",
      es: "partidos",
      pt: "jogos",
      fr: "matchs",
    }),
  };
}
