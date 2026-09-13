/**
 * プロフィール Report タブ chrome（週次/月次切替）— 7言語
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function profileReportPanelCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    weeklyTab: L(lang, {
      ja: "週次",
      en: "Weekly",
      ko: "주간",
      zh: "周报",
      es: "Semanal",
      pt: "Semanal",
      fr: "Hebdo",
    }),
    monthlyTab: L(lang, {
      ja: "月次",
      en: "Monthly",
      ko: "월간",
      zh: "月报",
      es: "Mensual",
      pt: "Mensal",
      fr: "Mensuel",
    }),
  };
}
