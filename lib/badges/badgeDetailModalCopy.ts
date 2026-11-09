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
    flipHint: L(lang, {
      ja: "タップで裏返す",
      en: "Tap to flip",
      ko: "탭하여 뒤집기",
      zh: "点击翻面",
      es: "Toca para girar",
      pt: "Toque para virar",
      fr: "Touchez pour retourner",
    }),
    newBadgeKicker: L(lang, {
      ja: "新しいバッジ",
      en: "New badge",
      ko: "새 배지",
      zh: "新徽章",
      es: "Nueva insignia",
      pt: "Nova medalha",
      fr: "Nouveau badge",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
  };
}

export type BadgeDetailModalLang = LocalizedLang;
