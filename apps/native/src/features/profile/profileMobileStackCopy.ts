/**
 * ProfileMobileStackModal webview / missing-url chrome（7言語）
 */
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

export function profileMobileStackCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    webUrlMissing: L(lang, {
      ja: "Web URL が未設定です。",
      en: "Web URL is not configured.",
      ko: "Web URL이 설정되지 않았습니다.",
      zh: "未配置 Web URL。",
      es: "La URL web no está configurada.",
      pt: "URL web não configurada.",
      fr: "URL web non configurée.",
    }),
    helpTitle: L(lang, {
      ja: "ヘルプ",
      en: "Help",
      ko: "도움말",
      zh: "帮助",
      es: "Ayuda",
      pt: "Ajuda",
      fr: "Aide",
    }),
    termsTitle: L(lang, {
      ja: "利用規約",
      en: "Terms",
      ko: "이용약관",
      zh: "服务条款",
      es: "Términos",
      pt: "Termos",
      fr: "Conditions",
    }),
    contactTitle: L(lang, {
      ja: "お問い合わせ",
      en: "Contact",
      ko: "문의",
      zh: "联系我们",
      es: "Contacto",
      pt: "Contato",
      fr: "Contact",
    }),
  };
}

export function profileMobileWebviewTitle(
  path: string,
  language: string | null | undefined
): string {
  const c = profileMobileStackCopy(language);
  if (path.includes("help")) return c.helpTitle;
  if (path.includes("terms")) return c.termsTitle;
  return c.contactTitle;
}
