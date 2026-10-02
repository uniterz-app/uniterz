/**
 * Injury Report パネルの UI クロム（部位ラベルは nbaInjuryReport 側）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type InjuryReportUiLang = LocalizedLang;
export const resolveInjuryReportUiLang = resolveLocalizedLang;

export function injuryReportUiCopy(lang: InjuryReportUiLang) {
  return {
    noInjuries: L(lang, {
      ja: "怪我人なし",
      en: "No injuries",
      ko: "부상자 없음",
      zh: "无伤病",
      es: "Sin lesiones",
      pt: "Sem lesões",
      fr: "Aucune blessure",
    }),
    updated: L(lang, {
      ja: "更新",
      en: "Updated",
      ko: "업데이트",
      zh: "更新",
      es: "Actualizado",
      pt: "Atualizado",
      fr: "Mis à jour",
    }),
    /** 人数サフィックス。en などは空（数字のみ） */
    countSuffix: L(lang, {
      ja: "名",
      en: "",
      ko: "명",
      zh: "人",
      es: "",
      pt: "",
      fr: "",
    }),
  };
}

export function injuryReportCountLabel(
  count: number,
  language: string | null | undefined
): string {
  const c = injuryReportUiCopy(resolveLocalizedLang(language));
  return c.countSuffix ? `${count}${c.countSuffix}` : `${count}`;
}
