/**
 * 週次・月次の期間説明（ランキング UI）。
 * 期間時計は US Eastern（全員共通）。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function rankingPeriodCalendarNote(
  period: "weekly" | "monthly",
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (period === "weekly") {
    return L(lang, {
      ja: "週間は米国東部時間基準です。日本の日付とズレます。",
      en: "Weekly periods use US Eastern Time (may differ from Japan).",
      ko: "주간은 미국 동부시간 기준입니다. 일본 날짜와 다를 수 있습니다.",
      zh: "周榜以美国东部时间为准，可能与日本日期不同。",
      es: "La semana usa hora del Este de EE. UU. (puede diferir de Japón).",
      pt: "A semana usa o horário do Leste dos EUA (pode diferir do Japão).",
      fr: "La semaine suit l'heure de l'Est US (peut différer du Japon).",
    });
  }
  return L(lang, {
    ja: "月間は米国東部時間基準です。日本の日付とズレます。",
    en: "Monthly periods use US Eastern Time (may differ from Japan).",
    ko: "월간은 미국 동부시간 기준입니다. 일본 날짜와 다를 수 있습니다.",
    zh: "月榜以美国东部时间为准，可能与日本日期不同。",
    es: "El mes usa hora del Este de EE. UU. (puede diferir de Japón).",
    pt: "O mês usa o horário do Leste dos EUA (pode diferir do Japão).",
    fr: "Le mois suit l'heure de l'Est US (peut différer du Japon).",
  });
}
