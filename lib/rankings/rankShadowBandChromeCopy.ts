/**
 * Rank Shadow 帯ヘッダーの数値クローム（Ranks / 位 / レンジ記号）。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function rankShadowBandChromeCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  const showPrefix = lang !== "ja" && lang !== "ko" && lang !== "zh";
  const showSuffix = lang === "ja" || lang === "ko" || lang === "zh";
  return {
    lang,
    showPrefix,
    showSuffix,
    ranksPrefix: L(lang, {
      ja: "Ranks",
      en: "Ranks",
      ko: "Ranks",
      zh: "Ranks",
      es: "Ranks",
      pt: "Ranks",
      fr: "Ranks",
    }),
    rangeSep: L(lang, {
      ja: "〜",
      en: "–",
      ko: "~",
      zh: "–",
      es: "–",
      pt: "–",
      fr: "–",
    }),
    rankSuffix: L(lang, {
      ja: "位",
      en: "",
      ko: "위",
      zh: "名",
      es: "",
      pt: "",
      fr: "",
    }),
  };
}
