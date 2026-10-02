/**
 * バッジ詳細モーダル chrome（7言語）。
 * Web `BadgeDetailModal` / Native `ProfileBadgeDetailModal` 共有。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export function badgeDetailModalCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    kicker: L(lang, {
      ja: "バッジ",
      en: "Badge",
      ko: "배지",
      zh: "徽章",
      es: "Insignia",
      pt: "Medalha",
      fr: "Badge",
    }),
    grantedAt: L(lang, {
      ja: "付与日",
      en: "Granted",
      ko: "부여일",
      zh: "授予日",
      es: "Otorgada",
      pt: "Concedida",
      fr: "Attribuée",
    }),
  };
}

export type BadgeDetailModalLang = LocalizedLang;
